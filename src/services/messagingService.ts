import { supabase } from '@/integrations/supabase/client';

/**
 * Conversation types — match the CHECK constraint in
 * `public/conversations_setup.sql`.
 */
export type ConversationType =
  | 'service_request'
  | 'project_request'
  | 'template_purchase'
  | 'pre_bid_inquiry'
  | 'supervisor_office'
  | 'supervisor_client';

export interface Conversation {
  id: string;
  type: ConversationType;
  reference_id: string | null;
  reference_title: string | null;
  client_id: string | null;
  office_id: string | null;
  supervisor_id: string | null;
  created_at: string;
  last_message_at: string;
  status: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string | null;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  is_read: boolean | null;
}

interface GetOrCreateOptions {
  type: ConversationType;
  referenceId?: string | null;
  referenceTitle?: string | null;
  clientId?: string | null;
  officeId?: string | null;
  supervisorId?: string | null;
}

const conv = () => supabase.from('conversations' as any);
const msg = () => supabase.from('messages' as any);

/**
 * Pick the most relevant counterparty for the legacy `recipient_id` column.
 * The legacy `messages` table requires a non-null recipient. For the new
 * conversations model we still write a sensible counterparty so the
 * existing SELECT policies and notification mirrors keep working.
 */
function pickRecipient(
  conversation: Conversation,
  senderId: string,
): string {
  const candidates = [
    conversation.client_id,
    conversation.office_id,
    conversation.supervisor_id,
  ].filter((id): id is string => !!id && id !== senderId);
  return candidates[0] ?? senderId;
}

export const messagingService = {
  /**
   * Find an existing conversation matching (type + reference + participants)
   * or create one. Reuses the row so each (type, reference, participants)
   * pair has a single thread.
   */
  async getOrCreateConversation(opts: GetOrCreateOptions): Promise<Conversation> {
    const {
      type,
      referenceId = null,
      referenceTitle = null,
      clientId = null,
      officeId = null,
      supervisorId = null,
    } = opts;

    // 1) Try to find an existing conversation with the same identity.
    let query = conv().select('*').eq('type', type);
    if (referenceId) query = query.eq('reference_id', referenceId);
    else query = query.is('reference_id', null);
    if (clientId) query = query.eq('client_id', clientId); else query = query.is('client_id', null);
    if (officeId) query = query.eq('office_id', officeId); else query = query.is('office_id', null);
    if (supervisorId) query = query.eq('supervisor_id', supervisorId); else query = query.is('supervisor_id', null);

    const { data: existing, error: findErr } = await query.maybeSingle();
    if (findErr && findErr.code !== 'PGRST116') {
      // PGRST116 = "no rows" with maybeSingle, safe to ignore
      // any other error -> bubble up
      throw findErr;
    }
    if (existing) return existing as unknown as Conversation;

    // 2) Otherwise create it.
    const { data: created, error: insErr } = await conv()
      .insert({
        type,
        reference_id: referenceId,
        reference_title: referenceTitle,
        client_id: clientId,
        office_id: officeId,
        supervisor_id: supervisorId,
      })
      .select('*')
      .single();
    if (insErr) throw insErr;
    return created as unknown as Conversation;
  },

  async getConversation(id: string): Promise<Conversation | null> {
    const { data, error } = await conv().select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return (data as unknown as Conversation) ?? null;
  },

  /**
   * Insert a new message into a conversation. Populates the legacy
   * `recipient_id` and `conversation_key` columns so the existing
   * messages schema constraints + policies remain happy.
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
  ): Promise<ChatMessage> {
    const trimmed = content.trim();
    if (!trimmed) throw new Error('Message content is required');

    const conversation = await this.getConversation(conversationId);
    if (!conversation) throw new Error('Conversation not found');

    const recipientId = pickRecipient(conversation, senderId);
    const conversationKey = `conv:${conversationId}`;

    const { data, error } = await msg()
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        recipient_id: recipientId,
        conversation_key: conversationKey,
        content: trimmed,
        is_read: false,
      })
      .select('*')
      .single();
    if (error) throw error;
    return data as unknown as ChatMessage;
  },

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const { data, error } = await msg()
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as ChatMessage[];
  },

  /**
   * Mark all unread messages in this conversation NOT sent by `userId`
   * as read. RLS policy `messages_update_mark_read` allows this for any
   * conversation participant.
   */
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    const { error } = await msg()
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('is_read', false);
    if (error) throw error;
  },

  /**
   * All conversations the user participates in (as client, office, or
   * supervisor), ordered by most recent activity first.
   */
  async getConversationsByUser(userId: string): Promise<Conversation[]> {
    const { data, error } = await conv()
      .select('*')
      .or(`client_id.eq.${userId},office_id.eq.${userId},supervisor_id.eq.${userId}`)
      .order('last_message_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Conversation[];
  },

  /**
   * Counts of unread messages per conversation for the given user.
   * Returns a Map keyed by conversation_id.
   */
  async getUnreadCountsForUser(
    userId: string,
    conversationIds: string[],
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (conversationIds.length === 0) return counts;

    const { data, error } = await msg()
      .select('conversation_id')
      .in('conversation_id', conversationIds)
      .neq('sender_id', userId)
      .eq('is_read', false);
    if (error) throw error;

    (data ?? []).forEach((row: any) => {
      const id = row.conversation_id as string | null;
      if (!id) return;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    });
    return counts;
  },

  /**
   * Subscribe to INSERTs on `messages` for a single conversation.
   * Returns an unsubscribe function.
   */
  subscribeToMessages(
    conversationId: string,
    onMessage: (message: ChatMessage) => void,
  ): () => void {
    const channel = supabase
      .channel(`conv:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          onMessage(payload.new as ChatMessage);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
