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
