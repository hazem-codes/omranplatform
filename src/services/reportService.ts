import { supabase } from '@/integrations/supabase/client';

export const reportService = {
  // README: submitReport(clientId, projectId, description)
  async submitReport(clientId: string, projectId: string, description: string) {
    const { data, error } = await supabase.from('reports')
      .insert({ client_id: clientId, project_id: projectId, description }).select().single();
    if (error) throw error;
    return data;
  },

  // README: getReportsByClient(clientId)
  async getReportsByClient(clientId: string) {
    const { data, error } = await supabase.from('reports')
      .select('*').eq('client_id', clientId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // README: updateReportStatus(reportId, status)
  async updateReportStatus(reportId: string, status: string) {
    const { data, error } = await supabase.from('reports')
      .update({ status }).eq('report_id', reportId).select().single();
    if (error) throw error;
    return data;
  },

  // Legacy aliases
  async submit(report: { client_id: string; project_id: string; description: string }) {
    return this.submitReport(report.client_id, report.project_id, report.description);
  },
  async getByClient(clientId: string) { return this.getReportsByClient(clientId); },
  async getAll() {
    const { data, error } = await supabase.from('reports')
      .select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async updateStatus(reportId: string, status: string) {
    return this.updateReportStatus(reportId, status);
  },
};
