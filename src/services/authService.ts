import { supabase } from '@/integrations/supabase/client';

export const authService = {
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async register(email: string, password: string, name: string, role: string, meta?: Record<string, string>) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role, ...meta } },
    });
    if (error) throw error;

    // Create role-specific record
    if (data.user) {
      if (role === 'client') {
        await supabase.from('clients').insert({ id: data.user.id, phone: meta?.phone || null });
      } else if (role === 'engineering_office') {
        // Save extended office fields directly to native columns. The migration adds:
        // phone, city, office_type, years_of_experience, license_document_url.
        const baseDescription = meta?.description_text || '';
        const insertRow: Record<string, any> = {
          id: data.user.id,
          license_number: meta?.license_number || '',
          coverage_area: meta?.coverage_area || null,
          description: baseDescription || null,
          license_expiry_date: meta?.license_expiry_date || null,
          phone: meta?.phone || null,
          city: meta?.city || null,
          office_type: meta?.office_type || null,
          years_of_experience: meta?.years_of_experience || null,
          license_document_url: meta?.license_document_url || null,
        };
        await supabase.from('engineering_offices').insert(insertRow as any);
      }
    }
    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },
};
