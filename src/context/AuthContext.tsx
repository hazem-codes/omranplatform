import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ProfileData, AuthState } from '@/types';
import type { Session } from '@supabase/supabase-js';

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: string, meta?: Record<string, string>) => Promise<void>;
  logout: () => Promise<void>;
  session: Session | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    role: null,
  });
  const [session, setSession] = useState<Session | null>(null);

  const enforceSuspension = useCallback(async (userId: string, role: string | null) => {
    if (!role || role === 'supervisor') return false;
    try {
      if (role === 'client') {
        const { data } = await supabase
          .from('clients')
          .select('is_active')
          .eq('id', userId)
          .maybeSingle();
        if (data && data.is_active === false) return true;
      } else if (role === 'engineering_office') {
        const { data } = await supabase
          .from('engineering_offices')
          .select('is_active, is_verified')
          .eq('id', userId)
          .maybeSingle();
        // Only block once an office has been verified — otherwise unverified
        // offices (default is_active=false) would be locked out by the onboarding flow.
        if (data && data.is_verified === true && data.is_active === false) return true;
      }
    } catch (e) {
      console.error('enforceSuspension check failed', e);
    }
    return false;
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) {
      const profile = data as unknown as ProfileData;
      // Normalize legacy/short role values from the DB so the rest of the app
      // (route guards, redirects) sees the canonical role string.
      if ((profile.role as string) === 'office') {
        profile.role = 'engineering_office';
      }
      const suspended = await enforceSuspension(userId, profile.role);
      if (suspended) {
        try { sessionStorage.setItem('omran:suspended', '1'); } catch {}
        await supabase.auth.signOut();
        setState({ user: null, isAuthenticated: false, isLoading: false, role: null });
        return;
      }
      setState({
        user: profile,
        isAuthenticated: true,
        isLoading: false,
        role: profile.role,
      });
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (user && user.id === userId) {
      const role = (user.user_metadata?.role as ProfileData['role'] | undefined) ?? null;
      const suspended = await enforceSuspension(userId, role ?? null);
      if (suspended) {
        try { sessionStorage.setItem('omran:suspended', '1'); } catch {}
        await supabase.auth.signOut();
        setState({ user: null, isAuthenticated: false, isLoading: false, role: null });
        return;
      }
      setState({
        user: role ? {
          id: user.id,
          name:
            (user.user_metadata?.name as string | undefined) ||
            user.email?.split('@')[0] ||
            'User',
          email: user.email || '',
          role,
        } : null,
        isAuthenticated: true,
        isLoading: false,
        role,
      });
    } else {
      setState({ user: null, isAuthenticated: false, isLoading: false, role: null });
    }
  }, [enforceSuspension]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          // Use setTimeout to avoid Supabase deadlock
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setState({ user: null, isAuthenticated: false, isLoading: false, role: null });
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    role: string,
    meta?: Record<string, string>
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role, ...meta },
      },
    });
    if (error) throw error;

    // When email auto-confirm is enabled, data.user is immediately available
    // and the session is active — create role-specific rows right away so
    // resolvePostAuthDestination() finds a complete record on first login.
    const newUser = data.user;
    if (newUser) {
      // Profiles row (trigger may create it; upsert is idempotent)
      try {
        await supabase.from('profiles').upsert({
          id: newUser.id,
          email,
          name,
          role: role as any,
        });
      } catch {}

      if (role === 'engineering_office') {
        try {
          await supabase.from('engineering_offices').upsert({
            id: newUser.id,
            license_number: meta?.license_number || '',
            license_expiry_date: meta?.license_expiry_date || null,
            coverage_area: meta?.coverage_area || null,
            phone: meta?.phone || null,
            city: meta?.city || null,
            office_type: meta?.office_type || null,
            years_of_experience: meta?.years_of_experience || null,
            is_verified: false,
            is_active: false,
          } as any);
        } catch {}
      } else if (role === 'client') {
        try {
          await supabase.from('clients').upsert({
            id: newUser.id,
            phone: meta?.phone || null,
          });
        } catch {}
      } else if (role === 'supervisor') {
        try {
          await supabase.from('supervisors').upsert({
            id: newUser.id,
            phone: meta?.phone || null,
          });
        } catch {}
      }
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, session }}>
      {children}
    </AuthContext.Provider>
  );
}

const defaultAuthValue: AuthContextValue = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  role: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  session: null,
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  return ctx ?? defaultAuthValue;
}
