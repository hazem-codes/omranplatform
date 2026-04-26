import { supabase } from '@/integrations/supabase/client';

export const contractService = {
  // README: generateContract(clientId, officeId, bidId)
  async generateContract(clientId: string, officeId: string, bidId: string) {
    // Fetch bid details
    const { data: bid } = await supabase.from('bids').select('*').eq('bid_id', bidId).single();
    const title = bid ? `عقد مشروع — ${bid.price?.toLocaleString()} ر.س` : 'عقد مشروع';
    const description = bid
      ? `عقد بين صاحب المشروع والمكتب الهندسي. السعر: ${bid.price?.toLocaleString()} ر.س — المدة: ${bid.timeline} يوم`
      : 'عقد مشروع هندسي';

    const { data, error } = await supabase.from('contracts').insert({
      client_id: clientId,
      office_id: officeId,
      title,
      description,
    }).select().single();
    if (error) throw error;
    return data;
  },

  // README: signContract(contractId, role)
  async signContract(contractId: string, role: 'client' | 'office') {
    const update = role === 'client'
      ? { is_client_signed: true, signed_at: new Date().toISOString() }
      : { is_office_signed: true, signed_at: new Date().toISOString() };
    const { data, error } = await supabase.from('contracts')
      .update(update).eq('contract_id', contractId).select().single();
    if (error) throw error;
    return data;
  },

  // README: getContract(contractId)
  async getContract(contractId: string) {
    const { data, error } = await supabase.from('contracts')
      .select('*').eq('contract_id', contractId).single();
    if (error) throw error;
    return data;
  },

  // README: exportContractPDF(contractId) — stub
  async exportContractPDF(contractId: string): Promise<Blob> {
    const contract = await this.getContract(contractId);
    const text = `Contract: ${contract.title}\n\n${contract.description}`;
    return new Blob([text], { type: 'application/pdf' });
  },

  // Legacy aliases
  async create(contract: { client_id: string; office_id: string; title: string; description?: string }) {
    const { data, error } = await supabase.from('contracts').insert(contract).select().single();
    if (error) throw error;
    return data;
  },

  async getById(contractId: string) { return this.getContract(contractId); },

  async getByUser(userId: string) {
    const { data, error } = await supabase.from('contracts')
      .select('*').or(`client_id.eq.${userId},office_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async signAsClient(contractId: string) { return this.signContract(contractId, 'client'); },
  async signAsOffice(contractId: string) { return this.signContract(contractId, 'office'); },
};
