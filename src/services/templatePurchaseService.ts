import { supabase } from '@/integrations/supabase/client';

export type TemplatePurchaseStatus = 'paid' | 'delivered' | 'cancelled';

export type TemplatePurchaseInput = {
  template_id: string;
  client_id: string;
  office_id?: string | null;
  purchase_price: number;
  title_snapshot?: string | null;
  category_snapshot?: string | null;
  sub_category_snapshot?: string | null;
  file_url_snapshot?: string | null;
  preview_image_snapshot?: string | null;
};

// Until the database migration runs, types.ts won't know about template_purchases.
// We keep all calls cast to `any` so the build remains green either way.
const tp = () => (supabase as any).from('template_purchases');

export const templatePurchaseService = {
  async create(input: TemplatePurchaseInput) {
    const row = {
      template_id: input.template_id,
      client_id: input.client_id,
      office_id: input.office_id ?? null,
      status: 'paid' as TemplatePurchaseStatus,
      purchase_price: input.purchase_price,
      title_snapshot: input.title_snapshot ?? null,
      category_snapshot: input.category_snapshot ?? null,
      sub_category_snapshot: input.sub_category_snapshot ?? null,
      file_url_snapshot: input.file_url_snapshot ?? null,
      preview_image_snapshot: input.preview_image_snapshot ?? null,
    };
    const { data, error } = await tp().insert(row).select().single();
    if (error) throw error;
    return data;
  },

  async getByClient(clientId: string) {
    const { data, error } = await tp()
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async getByOffice(officeId: string) {
    const { data, error } = await tp()
      .select('*')
      .eq('office_id', officeId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async updateStatus(id: string, status: TemplatePurchaseStatus) {
    const { data, error } = await tp().update({ status }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
};
