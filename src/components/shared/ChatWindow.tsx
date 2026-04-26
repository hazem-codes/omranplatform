import { useEffect, useMemo, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  messagingService,
  type ChatMessage,
} from '@/services/messagingService';

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
  isRTL: boolean;
  /** Optional sender label map: userId -> display name */
  senderNames?: Record<string, string>;
  /** Visible height of the message scroll area */
  height?: string;
}

export function ChatWindow({
  conversationId,
  currentUserId,
  isRTL,
  senderNames = {},
  height = '60vh',
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const data = await messagingService.getMessages(conversationId);
        if (!cancelled) setMessages(data);
        // Mark inbound messages as read on open.
        try {
          await messagingService.markMessagesAsRead(conversationId, currentUserId);
        } catch {
          /* non-fatal */
        }
      } catch (err) {
        console.error('chat load error =>', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId, currentUserId]);

  // Realtime subscription
  useEffect(() => {
    const unsubscribe = messagingService.subscribeToMessages(
      conversationId,
      (incoming) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === incoming.id)) return prev;
          return [...prev, incoming];
        });
        // Auto-mark as read for inbound messages while window is open.
        if (incoming.sender_id !== currentUserId) {
          messagingService
            .markMessagesAsRead(conversationId, currentUserId)
            .catch(() => {});
        }
      },
    );
    return unsubscribe;
  }, [conversationId, currentUserId]);

  // Auto-scroll to latest
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const content = text.trim();
    if (!content || sending) return;
    try {
      setSending(true);
      const newMsg = await messagingService.sendMessage(
        conversationId,
        currentUserId,
        content,
      );
      setText('');
      setMessages((prev) =>
        prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg],
      );
    } catch (err: any) {
      console.error('send error =>', err);
      toast.error(err?.message || (isRTL ? 'تعذر الإرسال' : 'Failed to send'));
    } finally {
      setSending(false);
    }
  };

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(isRTL ? 'ar' : 'en', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short',
      }),
    [isRTL],
  );

  return (
    <div className="flex flex-col rounded-xl border bg-card overflow-hidden">
      <div
        ref={scrollRef}
        className="overflow-y-auto p-4 space-y-3 bg-muted/20"
        style={{ height }}
      >
        {loading ? (
          <p className="text-center text-muted-foreground text-sm py-12">
            {isRTL ? 'جارٍ التحميل...' : 'Loading...'}
          </p>
        ) : messages.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-12">
            {isRTL ? 'ابدأ المحادثة' : 'Start the conversation'}
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === currentUserId;
            const name =
              senderNames[m.sender_id] ||
              (mine
                ? isRTL
                  ? 'أنا'
                  : 'Me'
                : isRTL
                  ? 'الطرف الآخر'
                  : 'Other');
            return (
              <div
                key={m.id}
                className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    mine
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background border'
                  }`}
                >
                  <div className="text-[11px] opacity-70 mb-0.5">
                    {name}
                    {' · '}
                    {formatter.format(new Date(m.created_at))}
                  </div>
                  <div className="whitespace-pre-wrap break-words">
                    {m.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center gap-2 border-t p-3 bg-card">
        <Input
          placeholder={isRTL ? 'اكتب رسالة...' : 'Type a message...'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          dir={isRTL ? 'rtl' : 'ltr'}
        />
        <Button onClick={send} disabled={sending || !text.trim()}>
          <Send className="me-1 h-4 w-4" />
          {isRTL ? 'إرسال' : 'Send'}
        </Button>
      </div>
    </div>
  );
}

export default ChatWindow;
