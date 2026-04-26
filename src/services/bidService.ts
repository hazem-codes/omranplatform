import { supabase } from '@/integrations/supabase/client';

export const bidService = {
  // README: submitBid(data)
  async submitBid(data: { request_id: string; office_id: string; price: number; timeline: number }) {
    const { data: result, error } = await supabase.from('bids').insert(data).select().single();
    if (error) throw error;
    return result;
  },

  // README: withdrawBid(bidId)
  async withdrawBid(bidId: string) {
    return this.updateStatus(bidId, 'withdrawn');
  },

  // README: getBidsForRequest(requestId)
  async getBidsForRequest(requestId: string) {
    const { data, error } = await supabase.from('bids')
      .select('*').eq('request_id', requestId).order('submitted_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // README: acceptBid(bidId)
  async acceptBid(bidId: string) {
    return this.updateStatus(bidId, 'accepted');
  },

  // README: rejectBid(bidId)
  async rejectBid(bidId: string) {
    return this.updateStatus(bidId, 'rejected');
  },

  // Internal
  async updateStatus(bidId: string, status: string) {
    const { data, error } = await supabase.from('bids')
      .update({ status }).eq('bid_id', bidId).select().single();
    if (error) throw error;
    return data;
  },

  // Legacy aliases
  async submit(bid: { request_id: string; office_id: string; price: number; timeline: number }) {
    return this.submitBid(bid);
  },
  async getByRequest(requestId: string) { return this.getBidsForRequest(requestId); },
  async getByOffice(officeId: string) {
    const { data, error } = await supabase.from('bids')
      .select('*').eq('office_id', officeId).order('submitted_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async withdraw(bidId: string) { return this.withdrawBid(bidId); },

  // README: getBidsForClient(clientId)
  // Returns all bids submitted on this client's project requests, enriched with
  // office_name (profiles.name), city + office_type (engineering_offices), and
  // request_title (project_requests.title). Manual joins because there are no
  // FK constraints PostgREST can follow automatically.
  async getBidsForClient(clientId: string) {
    const { data: requests } = await supabase.from('project_requests')
      .select('request_id, title').eq('client_id', clientId);
    const reqList = requests ?? [];
    if (reqList.length === 0) return [];
    const requestIds = reqList.map((r: any) => r.request_id);
    const reqMap = new Map<string, string>();
    reqList.forEach((r: any) => reqMap.set(r.request_id, r.title));

    const { data: bids, error } = await supabase.from('bids')
      .select('*').in('request_id', requestIds).order('submitted_at', { ascending: false });
    if (error) throw error;
    const bidList = bids ?? [];
    if (bidList.length === 0) return [];

    const officeIds = Array.from(new Set(bidList.map((b: any) => b.office_id).filter(Boolean)));
    const [profilesRes, officesRes] = await Promise.all([
      supabase.from('profiles').select('id, name').in('id', officeIds),
      supabase.from('engineering_offices').select('id, city, office_type').in('id', officeIds),
    ]);
    const nameMap = new Map<string, string>();
    (profilesRes.data ?? []).forEach((p: any) => nameMap.set(p.id, p.name || ''));
    const officeMap = new Map<string, any>();
    (officesRes.data ?? []).forEach((o: any) => officeMap.set(o.id, o));

    return bidList.map((b: any) => {
      const office = officeMap.get(b.office_id) ?? {};
      return {
        ...b,
        office_name: nameMap.get(b.office_id) || '',
        city: office.city || null,
        office_type: office.office_type || null,
        request_title: reqMap.get(b.request_id) || '',
      };
    });
  },
};
