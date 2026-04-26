import { supabase } from '@/integrations/supabase/client';

export const clientService = {
  async getProfile(clientId: string) {
    const { data, error } = await supabase.from('clients')
      .select('*').eq('id', clientId).single();
    if (error) throw error;
    return data;
  },

  async updatePhone(clientId: string, phone: string) {
    const { data, error } = await supabase.from('clients')
      .update({ phone }).eq('id', clientId).select().single();
    if (error) throw error;
    return data;
  },
};
