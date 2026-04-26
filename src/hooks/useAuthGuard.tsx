import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/context/AuthContext';
import { resolvePostAuthDestination } from '@/services/authRoutingService';

/**
 * Redirects unauthenticated users to /login.
 * Optionally checks for a specific role.
 * Returns { allowed, isLoading } so the component can render a loading state.
 */
export function useAuthGuard(requiredRole?: string | string[]) {
  const { isAuthenticated, isLoading, role, session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    let cancelled = false;

    if (!isAuthenticated) {
      navigate({ to: '/login' as '/' });
      return;
    }

    (async () => {
      const userId = session?.user?.id;
      if (!userId || cancelled) return;

      const dest = await resolvePostAuthDestination(userId);
      if (cancelled) return;
      if (dest.includes('/register?onboarding=1')) {
        navigate({ to: '/register', search: { onboarding: '1' } } as any);
        return;
      }

      if (!role) {
        navigate({ to: '/register', search: { onboarding: '1' } } as any);
        return;
      }

      if (requiredRole) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (!roles.includes(role)) {
          navigate({ to: '/' as '/' });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading, role, requiredRole, navigate, session?.user?.id]);

  const roleOk = !requiredRole || (
    Array.isArray(requiredRole) ? requiredRole.includes(role ?? '') : role === requiredRole
  );

  return {
    allowed: !isLoading && isAuthenticated && roleOk,
    isLoading,
  };
}
