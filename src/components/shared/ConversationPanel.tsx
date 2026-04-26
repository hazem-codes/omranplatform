import { useEffect, useState } from 'react';
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  messagingService,
  type Conversation,
  type ConversationType,
} from '@/services/messagingService';
import { ChatWindow } from '@/components/shared/ChatWindow';

interface ConversationPanelProps {
  type: ConversationType;
  referenceId: string | null;
  referenceTitle?: string | null;
  clientId?: string | null;
  officeId?: string | null;
  supervisorId?: string | null;
  currentUserId: string;
  isRTL: boolean;
  /** Initial open state. Defaults to false. */
  defaultOpen?: boolean;
  /** Optional override label (else "المحادثة" / "Conversation"). */
  label?: string;
  senderNames?: Record<string, string>;
}

/**
 * Reusable panel that lazily ensures a conversation exists between the
 * given participants and renders the realtime ChatWindow. Safe to drop in
 * any client/office/supervisor detail view.
 */
export function ConversationPanel({
  type,
  referenceId,
  referenceTitle = null,
  clientId = null,
  officeId = null,
  supervisorId = null,
  currentUserId,
  isRTL,
  defaultOpen = false,
  label,
  senderNames,
}: ConversationPanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || conversation || loading) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const c = await messagingService.getOrCreateConversation({
          type,
          referenceId,
          referenceTitle,
          clientId,
          officeId,
          supervisorId,
        });
        if (!cancelled) setConversation(c);
      } catch (e: any) {
        if (!cancelled) {
          setError(
            e?.message ||
              (isRTL ? 'تعذر تحميل المحادثة' : 'Could not load the conversation'),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, conversation, loading, type, referenceId, referenceTitle, clientId, officeId, supervisorId, isRTL]);

  const heading = label ?? (isRTL ? 'المحادثة' : 'Conversation');

  return (
    <Card>
      <CardContent className="p-0">
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-between rounded-none px-4 py-3"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="flex items-center gap-2 font-bold">
            <MessageSquare className="h-4 w-4 text-gold" />
            {heading}
          </span>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        {open && (
          <div className="border-t p-3">
            {loading && (
              <p className="text-sm text-muted-foreground py-6 text-center">
                {isRTL ? 'جارٍ التحميل...' : 'Loading...'}
              </p>
            )}
            {!loading && error && (
              <p className="text-sm text-destructive py-6 text-center">{error}</p>
            )}
            {!loading && !error && conversation && (
              <ChatWindow
                conversationId={conversation.id}
                currentUserId={currentUserId}
                isRTL={isRTL}
                senderNames={senderNames}
                height="50vh"
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ConversationPanel;
