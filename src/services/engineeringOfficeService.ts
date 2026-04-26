import { supabase } from '@/integrations/supabase/client';

export const engineeringOfficeService = {
  // README: registerWithLicense(data)
  async registerWithLicense(data: {
    id: string;
    license_number: string;
    description?: string;
    coverage_area?: string;
    license_expiry_date?: string;
  }) {
    const { data: result, error } = await supabase.from('engineering_offices')
      .insert(data).select().single();
    if (error) throw error;
    return result;
  },

  // README: getOfficeProfile(officeId)
  async getOfficeProfile(officeId: string) {
    const { data, error } = await supabase.from('engineering_offices')
      .select('*').eq('id', officeId).single();
    if (error) throw error;
    return data;
  },

  // README: updateOfficeProfile(officeId, data)
  async updateOfficeProfile(officeId: string, updates: { description?: string; coverage_area?: string; license_expiry_date?: string }) {
    const { data, error } = await supabase.from('engineering_offices')
      .update(updates).eq('id', officeId).select().single();
    if (error) throw error;
    return data;
  },

  // README: verifyLicense(licenseNumber)
  async verifyLicense(licenseNumber: string): Promise<boolean> {
    const { data } = await supabase.from('engineering_offices')
      .select('is_verified').eq('license_number', licenseNumber).single();
    return data?.is_verified || false;
  },

  // README: browseProjectRequests(filters)
  async browseProjectRequests(filters?: { category?: string; city?: string }) {
    let query = supabase.from('project_requests').select('*').eq('status', 'approved');
    if (filters?.city) query = query.eq('location', filters.city);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // README: receivePayment(milestoneId)
  async receivePayment(milestoneId: string) {
    // Placeholder — payment release is handled via escrowService
  },

  // Legacy aliases
  async getProfile(officeId: string) { return this.getOfficeProfile(officeId); },
  async update(officeId: string, updates: any) { return this.updateOfficeProfile(officeId, updates); },

  async getVerified() {
    const { data, error } = await supabase.from('engineering_offices')
      .select('*').eq('is_verified', true);
    if (error) throw error;
    return data;
  },

  async getAll() {
    const { data, error } = await supabase.from('engineering_offices').select('*');
    if (error) throw error;
    return data;
  },

  async getPortfolio(officeId: string) {
    const { data, error } = await supabase.from('portfolio')
      .select('*').eq('office_id', officeId);
    if (error) throw error;
    return data;
  },

  async addPortfolioItem(item: { office_id: string; project_title: string; description?: string; category?: string; image_url?: string }) {
    const { data, error } = await supabase.from('portfolio').insert(item).select().single();
    if (error) throw error;
    return data;
  },
};
