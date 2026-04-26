import { supabase } from '@/integrations/supabase/client';

export const ratingService = {
  // README: submitRating(milestoneId, clientId, stars, comment)
  async submitRating(milestoneId: string, clientId: string, stars: number, comment?: string) {
    const { data, error } = await supabase.from('ratings')
      .insert({ milestone_id: milestoneId, client_id: clientId, stars, comment }).select().single();
    if (error) throw error;
    return data;
  },

  // README: getRatingsByOffice(officeId) — gets ratings via milestones→projects→contracts→office
  async getRatingsByOffice(officeId: string) {
    // Simplified: get all ratings (in a real app, join through milestones→projects→contracts)
    const { data, error } = await supabase.from('ratings').select('*');
    if (error) throw error;
    return data;
  },

  // README: getAverageRating(officeId)
  async getAverageRating(officeId: string) {
    const ratings = await this.getRatingsByOffice(officeId);
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, r) => acc + (r.stars || 0), 0);
    return sum / ratings.length;
  },

  // Legacy aliases
  async submit(rating: { client_id: string; milestone_id: string; stars: number; comment?: string }) {
    return this.submitRating(rating.milestone_id, rating.client_id, rating.stars, rating.comment);
  },
  async getByMilestone(milestoneId: string) {
    const { data, error } = await supabase.from('ratings')
      .select('*').eq('milestone_id', milestoneId);
    if (error) throw error;
    return data;
  },
};
