import { supabase } from '@/integrations/supabase/client';
import { notificationService } from './notificationService';

// Conversation key is deterministic for any pair of users (sorted)
export function conversationKey(a: string, b: string) {
  return [a, b].sort().join(':');
}

export const messageService = {
  async getConversation(userA: string, userB: string) {
    const key = conversationKey(userA, userB);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_key', key)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async send(senderId: string, recipientId: string, content: string, senderLabel: string) {
    const key = conversationKey(senderId, recipientId);
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        recipient_id: recipientId,
        conversation_key: key,
        content,
      })
      .select()
      .single();
    if (error) throw error;

    // Mirror as a notification to the recipient
    try {
      await notificationService.send(recipientId, `[${senderLabel}] ${content}`);
    } catch (e) {
      console.warn('notification mirror failed', e);
    }

    return data;
  },

  // For an office: find all distinct conversation partners (admins) who messaged them
  async listConversationsForUser(userId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('sender_id, recipient_id, content, created_at')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const partners = new Map<string, { partnerId: string; lastMessage: string; lastAt: string }>();
    (data ?? []).forEach((m: any) => {
      const partnerId = m.sender_id === userId ? m.recipient_id : m.sender_id;
      if (!partners.has(partnerId)) {
        partners.set(partnerId, { partnerId, lastMessage: m.content, lastAt: m.created_at });
      }
    });
    return Array.from(partners.values());
  },
};
