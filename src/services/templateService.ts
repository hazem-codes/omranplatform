import { supabase } from '@/integrations/supabase/client';
import { fetchOfficeRatings } from './serviceCatalogService';

export const templateService = {
  // README: uploadTemplate(data)
  // Saves directly to native columns (category, sub_category, file_url) added by the migration.
  async uploadTemplate(data: { office_id: string; title: string; description?: string; price?: number; category?: string; sub_category?: string; file_url?: string }) {
    const insertRow: Record<string, any> = {
      office_id: data.office_id,
      title: data.title,
      description: data.description || null,
      price: data.price,
      category: data.category || null,
      sub_category: data.sub_category || null,
      file_url: data.file_url || null,
    };
    const { data: result, error } = await supabase.from('templates').insert(insertRow as any).select().single();
    if (error) throw error;
    return result;
  },

  // README: getApprovedTemplates()
  async getApprovedTemplates() {
    const { data, error } = await supabase.from('templates')
      .select('*').eq('is_approved', true).eq('is_available', true);
    if (error) throw error;
    return data;
  },

  async getPublicMarketplace() {
    // PostgREST cannot embed engineering_offices through templates.office_id because
    // there is no FK constraint, so we enrich manually with parallel lookups.
    const flat = await supabase
      .from('templates')
      .select('*')
      .eq('is_approved', true)
      .eq('is_available', true);

    if (flat.error) throw flat.error;
    const items = flat.data ?? [];
    const officeIds = Array.from(new Set(items.map((i: any) => i.office_id).filter(Boolean)));
    if (officeIds.length === 0) return items;

    const [officesRes, profilesRes, portfolioRes, ratingsByOffice] = await Promise.all([
      // Only verified + active offices visible to public (RLS also enforces this).
      supabase.from('engineering_offices').select('id, city, coverage_area, office_type, is_verified, is_active, years_of_experience').in('id', officeIds),
      supabase.from('profiles').select('id, name').in('id', officeIds),
      supabase.from('portfolio').select('office_id, portfolio_id, project_title, image_url').in('office_id', officeIds),
      fetchOfficeRatings(officeIds),
    ]);

    const officeMap = new Map<string, any>();
    (officesRes.data ?? []).forEach((o: any) => officeMap.set(o.id, o));
    const profileMap = new Map<string, string>();
    (profilesRes.data ?? []).forEach((p: any) => profileMap.set(p.id, p.name));
    const portfolioMap = new Map<string, any[]>();
    (portfolioRes.data ?? []).forEach((p: any) => {
      const arr = portfolioMap.get(p.office_id) ?? [];
      arr.push(p);
      portfolioMap.set(p.office_id, arr);
    });

    // Hide templates whose office is suspended or not visible to us via RLS.
    return items
      .filter((i: any) => officeMap.has(i.office_id))
      .map((i: any) => {
        const office = officeMap.get(i.office_id);
        const portfolioItems = portfolioMap.get(i.office_id) ?? [];
        const r = ratingsByOffice.get(i.office_id) ?? { avg: 0, count: 0 };
        return {
          ...i,
          engineering_offices: {
            ...office,
            public_profiles: { name: profileMap.get(i.office_id) || '' },
            portfolio_preview: portfolioItems.slice(0, 3),
            portfolio_count: portfolioItems.length,
            rating_avg: r.avg,
            rating_count: r.count,
          },
        };
      });
  },

  // README: purchaseTemplate(templateId, clientId)
  async purchaseTemplate(templateId: string, clientId: string) {
    // In a real system, create a payment record
    // For now, just mark as purchased (no-op)
  },

  // README: deleteTemplate(templateId)
  async deleteTemplate(templateId: string) {
    const { error } = await supabase.from('templates').delete().eq('template_id', templateId);
    if (error) throw error;
  },

  // Legacy aliases
  async getAll() {
    const { data, error } = await supabase.from('templates').select('*');
    if (error) throw error;
    return data;
  },
  async getApproved() { return this.getApprovedTemplates(); },
  async getByOffice(officeId: string) {
    const { data, error } = await supabase.from('templates').select('*').eq('office_id', officeId);
    if (error) throw error;
    return data;
  },
  async upload(template: { office_id: string; title: string; description?: string; price?: number; category?: string; sub_category?: string; file_url?: string }) {
    return this.uploadTemplate(template);
  },
  async delete(templateId: string) {
    return this.deleteTemplate(templateId);
  },
  async approve(templateId: string) {
    const { data, error } = await supabase.from('templates')
      .update({ is_approved: true, is_available: true }).eq('template_id', templateId).select().single();
    if (error) throw error;
    return data;
  },
  async reject(templateId: string) {
    const { data, error } = await supabase.from('templates')
      .update({ is_approved: false }).eq('template_id', templateId).select().single();
    if (error) throw error;
    return data;
  },
};
