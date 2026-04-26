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
};
