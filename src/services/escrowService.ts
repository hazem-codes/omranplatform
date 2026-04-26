import { supabase } from '@/integrations/supabase/client';

export const escrowService = {
  // README: deposit(contractId, amount)
  async deposit(contractId: string, amount: number) {
    const { data: existing } = await supabase.from('escrow')
      .select('*').eq('contract_id', contractId).single();
    if (existing) {
      const newTotal = (existing.total_amount || 0) + amount;
      const { data, error } = await supabase.from('escrow')
        .update({ total_amount: newTotal }).eq('escrow_id', existing.escrow_id).select().single();
      if (error) throw error;
      return data;
    }
    const { data, error } = await supabase.from('escrow')
      .insert({ contract_id: contractId, total_amount: amount }).select().single();
    if (error) throw error;
    return data;
  },

  // README: releaseFunds(milestoneId)
  async releaseFunds(milestoneId: string) {
    // In a real system, link milestone → escrow and release portion
    // For now, mark milestone as approved triggers this
  },

  // README: refund(escrowId)
  async refund(escrowId: string) {
    const { data, error } = await supabase.from('escrow')
      .update({ status: 'refunded', released_amount: 0 }).eq('escrow_id', escrowId).select().single();
    if (error) throw error;
    return data;
  },

  // README: getBalance(escrowId)
  async getBalance(escrowId: string) {
    const { data, error } = await supabase.from('escrow')
      .select('total_amount, released_amount').eq('escrow_id', escrowId).single();
    if (error) throw error;
    return (data?.total_amount || 0) - (data?.released_amount || 0);
  },

  // README: freezeEscrow(escrowId)
  async freezeEscrow(escrowId: string) {
    const { data, error } = await supabase.from('escrow')
      .update({ status: 'frozen' }).eq('escrow_id', escrowId).select().single();
    if (error) throw error;
    return data;
  },

  // Legacy aliases
  async create(escrow: { contract_id: string; total_amount: number }) {
    return this.deposit(escrow.contract_id, escrow.total_amount);
  },

  async getByContract(contractId: string) {
    const { data, error } = await supabase.from('escrow')
      .select('*').eq('contract_id', contractId);
    if (error) throw error;
    return data;
  },

  async release(escrowId: string, amount: number) {
    const { data: current } = await supabase.from('escrow')
      .select('released_amount').eq('escrow_id', escrowId).single();
    const newReleased = (current?.released_amount || 0) + amount;
    const { data, error } = await supabase.from('escrow')
      .update({ released_amount: newReleased, status: 'released' })
      .eq('escrow_id', escrowId).select().single();
    if (error) throw error;
    return data;
  },

  async freeze(escrowId: string) { return this.freezeEscrow(escrowId); },
};
