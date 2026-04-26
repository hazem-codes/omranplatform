import { useEffect, useMemo, useState } from 'react';
import { Inbox, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import {
  messagingService,
  type Conversation,
  type ConversationType,
} from '@/services/messagingService';
import { ChatWindow } from '@/components/shared/ChatWindow';

export type InboxRole = 'client' | 'office' | 'supervisor';

interface SectionDef {
  key: string;
  ar: string;
  en: string;
  types: ConversationType[];
}

const SECTIONS: Record<InboxRole, SectionDef[]> = {
  client: [
    { key: 'projects',  ar: 'مشاريعي',  en: 'My Projects',  types: ['project_request'] },
    { key: 'services',  ar: 'خدماتي',  en: 'My Services',  types: ['service_request'] },
    { key: 'templates', ar: 'قوالبي',  en: 'My Templates', types: ['template_purchase'] },
    { key: 'admin',     ar: 'الإدارة', en: 'Admin',         types: ['supervisor_client'] },
  ],
  office: [
    { key: 'project_requests', ar: 'طلبات المشاريع',     en: 'Project Requests',  types: ['project_request'] },
    { key: 'services',         ar: 'الخدمات المحجوزة',   en: 'Booked Services',   types: ['service_request'] },
    { key: 'templates',        ar: 'القوالب المباعة',    en: 'Sold Templates',    types: ['template_purchase'] },
    { key: 'pre_bid',          ar: 'استفسارات قبل العرض', en: 'Pre-bid Inquiries', types: ['pre_bid_inquiry'] },
    { key: 'admin',            ar: 'المشرف',             en: 'Admin',             types: ['supervisor_office'] },
  ],
  supervisor: [
    { key: 'offices', ar: 'المكاتب', en: 'Offices', types: ['supervisor_office'] },
    { key: 'clients', ar: 'العملاء', en: 'Clients', types: ['supervisor_client'] },
  ],
};

interface RoleInboxProps {
  role: InboxRole;
  userId: string;
  isRTL: boolean;
}

export function RoleInbox({ role, userId, isRTL }: RoleInboxProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unread, setUnread] = useState<Map<string, number>>(new Map());
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Conversation | null>(null);

  const sections = SECTIONS[role];

  const load = async () => {
    setLoading(true);
    try {
      const list = await messagingService.getConversationsByUser(userId);
      setConversations(list);

      const ids = list.map((c) => c.id);
      const counts = await messagingService.getUnreadCountsForUser(userId, ids);
      setUnread(counts);

      // Resolve counterparty display names from `profiles`.
      const counterIds = new Set<string>();
      list.forEach((c) => {
        [c.client_id, c.office_id, c.supervisor_id].forEach((id) => {
          if (id && id !== userId) counterIds.add(id);
        });
      });
      if (counterIds.size > 0) {
        const { data } = await supabase
          .from('profiles')
          .select('id, name, role')
          .in('id', Array.from(counterIds));
        const map: Record<string, string> = {};
        (data ?? []).forEach((p: any) => {
          map[p.id] =
            p.role === 'supervisor'
              ? (isRTL ? 'الإدارة' : 'Admin')
              : (p.name || (isRTL ? 'مستخدم' : 'User'));
        });
        setNames(map);
      } else {
        setNames({});
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    load();
    // light polling as fallback when realtime isn't connected
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isRTL]);

  const grouped = useMemo(() => {
    const g = new Map<string, Conversation[]>();
    sections.forEach((s) => g.set(s.key, []));
    conversations.forEach((c) => {
      const sec = sections.find((s) => s.types.includes(c.type));
      if (!sec) return;
      g.get(sec.key)!.push(c);
    });
    return g;
  }, [conversations, sections]);

  const counterpartyName = (c: Conversation) => {
    const otherIds = [c.client_id, c.office_id, c.supervisor_id].filter(
      (id) => id && id !== userId,
    ) as string[];
    return names[otherIds[0] ?? ''] || '';
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
    <div className="mx-auto max-w-4xl px-4 py-10" dir={isRTL ? 'rtl' : 'ltr'}>
      <h1 className="text-3xl font-black flex items-center gap-2">
        <MessageSquare className="h-7 w-7 text-gold" />
        {isRTL ? 'الرسائل' : 'Messages'}
      </h1>

      <div className="mt-6 space-y-6">
        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm">
                {isRTL ? 'جارٍ التحميل...' : 'Loading...'}
              </p>
            </CardContent>
          </Card>
        ) : (
          sections.map((sec) => {
            const items = grouped.get(sec.key) ?? [];
            return (
              <section key={sec.key}>
                <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-2 px-1">
                  {isRTL ? sec.ar : sec.en}{' '}
                  {items.length > 0 && (
                    <span className="text-xs font-medium opacity-60">
                      ({items.length})
                    </span>
                  )}
                </h2>
                <Card>
                  {items.length === 0 ? (
                    <CardContent className="py-8 flex flex-col items-center justify-center text-center text-muted-foreground">
                      <Inbox className="h-6 w-6 mb-2 opacity-50" />
                      <p className="text-sm">
                        {isRTL ? 'لا توجد محادثات حتى الآن' : 'No conversations yet'}
                      </p>
                    </CardContent>
                  ) : (
                    <CardContent className="p-0 divide-y">
                      {items.map((c) => {
                        const partner = counterpartyName(c);
                        const unreadN = unread.get(c.id) ?? 0;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setActive(c)}
                            className="flex w-full items-start justify-between gap-3 p-3 hover:bg-muted/40 text-start transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold truncate">
                                  {c.reference_title ||
                                    (isRTL ? 'محادثة' : 'Conversation')}
                                </span>
                                {unreadN > 0 && (
                                  <Badge className="bg-gold text-gold-foreground hover:bg-gold/90">
                                    {unreadN}
                                  </Badge>
                                )}
                              </div>
                              {partner && (
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                  {isRTL ? 'مع:' : 'With:'} {partner}
                                </p>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground shrink-0">
                              {formatter.format(new Date(c.last_message_at))}
                            </div>
                          </button>
                        );
                      })}
                    </CardContent>
                  )}
                </Card>
              </section>
            );
          })
        )}
      </div>

      <Sheet
        open={!!active}
        onOpenChange={(open) => {
          if (!open) {
            setActive(null);
            // refresh unread + last activity
            load();
          }
        }}
      >
        <SheetContent
          side={isRTL ? 'left' : 'right'}
          className="w-full sm:max-w-xl flex flex-col p-0"
        >
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="text-start">
              {active?.reference_title ||
                (isRTL ? 'محادثة' : 'Conversation')}
            </SheetTitle>
            {active && counterpartyName(active) && (
              <p className="text-xs text-muted-foreground text-start">
                {isRTL ? 'مع:' : 'With:'} {counterpartyName(active)}
              </p>
            )}
          </SheetHeader>
          {active && (
            <div className="flex-1 p-3 overflow-hidden">
              <ChatWindow
                conversationId={active.id}
                currentUserId={userId}
                isRTL={isRTL}
                senderNames={{ ...names, [userId]: isRTL ? 'أنا' : 'Me' }}
                height="calc(100vh - 180px)"
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default RoleInbox;
