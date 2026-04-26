import { supabase } from '@/integrations/supabase/client';

export const milestoneService = {
  // README: createMilestonePlan(projectId, milestones)
  async createMilestonePlan(projectId: string, milestones: Array<{ title: string; description?: string; due_date?: string }>) {
    const rows = milestones.map(m => ({ project_id: projectId, ...m }));
    const { data, error } = await supabase.from('milestones').insert(rows).select();
    if (error) throw error;
    return data;
  },

  // README: submitMilestone(milestoneId, deliverableURL)
  async submitMilestone(milestoneId: string, deliverableURL: string) {
    const { data, error } = await supabase.from('milestones')
      .update({ deliverable_url: deliverableURL, status: 'submitted' })
      .eq('milestone_id', milestoneId).select().single();
    if (error) throw error;
    return data;
  },

  // README: approveMilestone(milestoneId)
  async approveMilestone(milestoneId: string) {
    const { data, error } = await supabase.from('milestones')
      .update({ status: 'approved' }).eq('milestone_id', milestoneId).select().single();
    if (error) throw error;
    return data;
  },

  // README: rejectMilestone(milestoneId)
  async rejectMilestone(milestoneId: string) {
    const { data, error } = await supabase.from('milestones')
      .update({ status: 'rejected' }).eq('milestone_id', milestoneId).select().single();
    if (error) throw error;
    return data;
  },

  // README: getMilestones(projectId)
  async getMilestones(projectId: string) {
    const { data, error } = await supabase.from('milestones')
      .select('*').eq('project_id', projectId).order('due_date', { ascending: true });
    if (error) throw error;
    return data;
  },

  // Legacy aliases
  async create(milestone: { project_id: string; title: string; description?: string; due_date?: string }) {
    const { data, error } = await supabase.from('milestones').insert(milestone).select().single();
    if (error) throw error;
    return data;
  },
  async getByProject(projectId: string) { return this.getMilestones(projectId); },
  async updateStatus(milestoneId: string, status: string) {
    const { data, error } = await supabase.from('milestones')
      .update({ status }).eq('milestone_id', milestoneId).select().single();
    if (error) throw error;
    return data;
  },
  async submitDeliverable(milestoneId: string, deliverableUrl: string) {
    return this.submitMilestone(milestoneId, deliverableUrl);
  },
};
