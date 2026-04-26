import { supabase } from '@/integrations/supabase/client';

// Compute per-office average rating by joining ratings -> milestones -> projects -> contracts.office_id.
// This avoids the previous global-average bug where every office showed the same rating.
async function fetchOfficeRatings(officeIds: string[]): Promise<Map<string, { avg: number; count: number }>> {
  const result = new Map<string, { avg: number; count: number }>();
  if (officeIds.length === 0) return result;
  // Pull contracts for these offices, then milestones for those contracts, then ratings for those milestones.
  const { data: contracts } = await supabase
    .from('contracts').select('contract_id, office_id').in('office_id', officeIds);
  const contractIds = (contracts ?? []).map((c: any) => c.contract_id).filter(Boolean);
  if (contractIds.length === 0) return result;
  const contractToOffice = new Map<string, string>();
  (contracts ?? []).forEach((c: any) => contractToOffice.set(c.contract_id, c.office_id));

  const { data: projects } = await supabase
    .from('projects').select('project_id, contract_id').in('contract_id', contractIds);
  const projectIds = (projects ?? []).map((p: any) => p.project_id).filter(Boolean);
  if (projectIds.length === 0) return result;
  const projectToOffice = new Map<string, string>();
  (projects ?? []).forEach((p: any) => {
    const off = contractToOffice.get(p.contract_id);
    if (off) projectToOffice.set(p.project_id, off);
  });

  const { data: milestones } = await supabase
    .from('milestones').select('milestone_id, project_id').in('project_id', projectIds);
  const milestoneIds = (milestones ?? []).map((m: any) => m.milestone_id).filter(Boolean);
  if (milestoneIds.length === 0) return result;
  const milestoneToOffice = new Map<string, string>();
  (milestones ?? []).forEach((m: any) => {
    const off = projectToOffice.get(m.project_id);
    if (off) milestoneToOffice.set(m.milestone_id, off);
  });

  const { data: ratings } = await supabase
    .from('ratings').select('milestone_id, stars').in('milestone_id', milestoneIds);
  const accum = new Map<string, { sum: number; count: number }>();
  (ratings ?? []).forEach((r: any) => {
    const off = milestoneToOffice.get(r.milestone_id);
    const stars = Number(r.stars) || 0;
    if (!off || !stars) return;
    const cur = accum.get(off) ?? { sum: 0, count: 0 };
    cur.sum += stars; cur.count += 1;
    accum.set(off, cur);
  });
  accum.forEach((v, k) => result.set(k, { avg: v.sum / v.count, count: v.count }));
  return result;
}

export { fetchOfficeRatings };

export const serviceCatalogService = {
  async getAll() {
    const { data, error } = await supabase.from('service_catalog').select('*');
    if (error) throw error;
    return data;
  },

  // Public marketplace: rely on RLS to restrict visibility. PostgREST cannot embed
  // engineering_offices automatically because there is no FK constraint between
  // service_catalog.office_id and engineering_offices.id, so we enrich manually
  // with parallel lookups (offices + profiles + portfolio counts + ratings).
  async getPublicMarketplace() {
    const flat = await supabase.from('service_catalog').select('*');
    if (flat.error) throw flat.error;
    const items = flat.data ?? [];
    const officeIds = Array.from(new Set(items.map((i: any) => i.office_id).filter(Boolean)));
    if (officeIds.length === 0) return items;

    const [officesRes, profilesRes, portfolioRes, ratingsByOffice] = await Promise.all([
      // Only verified + active offices are visible to the public marketplace (RLS also enforces this).
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

    // Hide services whose office is suspended or not visible to us via RLS.
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

  async getByOffice(officeId: string) {
    const { data, error } = await supabase.from('service_catalog')
      .select('*').eq('office_id', officeId);
    if (error) throw error;
    return data;
  },

  async getByCategory(category: string) {
    const { data, error } = await supabase.from('service_catalog')
      .select('*').eq('category', category);
    if (error) throw error;
    return data;
  },

  // README: addService(officeId, data)
  async addService(officeId: string, data: { category: string; sub_category?: string; pricing_model?: string; price?: number }) {
    const { data: result, error } = await supabase.from('service_catalog')
      .insert({ office_id: officeId, ...data }).select().single();
    if (error) throw error;
    return result;
  },

  // README: editService(catalogId, data)
  async editService(catalogId: string, data: { category?: string; sub_category?: string; pricing_model?: string; price?: number }) {
    const { data: result, error } = await supabase.from('service_catalog')
      .update(data).eq('catalog_id', catalogId).select().single();
    if (error) throw error;
    return result;
  },

  // README: deleteService(catalogId)
  async deleteService(catalogId: string) {
    const { error } = await supabase.from('service_catalog').delete().eq('catalog_id', catalogId);
    if (error) throw error;
  },

  // README: getCatalogByOffice(officeId) — alias
  async getCatalogByOffice(officeId: string) {
    return this.getByOffice(officeId);
  },

  // README: searchCatalog(filters)
  async searchCatalog(filters: { category?: string; sub_category?: string; city?: string }) {
    let query = supabase.from('service_catalog').select('*');
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.sub_category) query = query.eq('sub_category', filters.sub_category);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Legacy aliases
  async add(entry: { office_id: string; category: string; sub_category?: string; pricing_model?: string; price?: number }) {
    return this.addService(entry.office_id, entry);
  },

  async remove(catalogId: string) {
    return this.deleteService(catalogId);
  },
};
