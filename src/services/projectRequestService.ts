import { supabase } from '@/integrations/supabase/client';
import type { ProjectRequestData } from '@/types';

export const projectRequestService = {
  // README: submitProjectRequest(data)
  async submitProjectRequest(data: Omit<ProjectRequestData, 'request_id' | 'created_at' | 'status'>) {
    const { data: result, error } = await supabase.from('project_requests').insert(data).select().single();
    if (error) throw error;
    return result;
  },

  // README: getClientRequests(clientId)
  async getClientRequests(clientId: string) {
    const { data, error } = await supabase.from('project_requests')
      .select('*').eq('client_id', clientId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // README: getClientRequestsWithBidCount(clientId)
  // Returns each project request enriched with `bids_count` (number of bids per request).
  async getClientRequestsWithBidCount(clientId: string) {
    const { data: reqs, error } = await supabase.from('project_requests')
      .select('*').eq('client_id', clientId).order('created_at', { ascending: false });
    if (error) throw error;
    const list = reqs ?? [];
    if (list.length === 0) return list;
    const ids = list.map((r: any) => r.request_id).filter(Boolean);
    const { data: bids } = await supabase.from('bids')
      .select('request_id').in('request_id', ids);
    const counts: Record<string, number> = {};
    (bids ?? []).forEach((b: any) => {
      counts[b.request_id] = (counts[b.request_id] ?? 0) + 1;
    });
    return list.map((r: any) => ({ ...r, bids_count: counts[r.request_id] ?? 0 }));
  },

  // README: getApprovedRequests()
  async getApprovedRequests() {
    const { data, error } = await supabase.from('project_requests')
      .select('*').eq('status', 'approved').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // README: updateRequestStatus(requestId, status)
  async updateRequestStatus(requestId: string, status: string) {
    const { data, error } = await supabase.from('project_requests')
      .update({ status }).eq('request_id', requestId).select().single();
    if (error) throw error;
    return data;
  },

  // Legacy aliases
  async submit(request: Omit<ProjectRequestData, 'request_id' | 'created_at' | 'status'>) {
    return this.submitProjectRequest(request);
  },
  async getByClient(clientId: string) { return this.getClientRequests(clientId); },
  async getApproved() { return this.getApprovedRequests(); },
  async getAll() {
    const { data, error } = await supabase.from('project_requests')
      .select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async updateStatus(requestId: string, status: string) {
    return this.updateRequestStatus(requestId, status);
  },
};
