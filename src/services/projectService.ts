import { supabase } from '@/integrations/supabase/client';

export const projectService = {
  async getById(projectId: string) {
    const { data, error } = await supabase.from('projects')
      .select('*').eq('project_id', projectId).single();
    if (error) throw error;
    return data;
  },

  async getAll() {
    const { data, error } = await supabase.from('projects')
      .select('*').order('start_date', { ascending: false });
    if (error) throw error;
    return data;
  },

  async create(project: { contract_id: string; title: string; description?: string }) {
    const { data, error } = await supabase.from('projects')
      .insert({ ...project, start_date: new Date().toISOString().split('T')[0] })
      .select().single();
    if (error) throw error;
    return data;
  },

  async updateProgress(projectId: string, progress: number) {
    const { data, error } = await supabase.from('projects')
      .update({ progress_percentage: progress })
      .eq('project_id', projectId).select().single();
    if (error) throw error;
    return data;
  },
};
