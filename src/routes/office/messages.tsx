import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { messageService } from "@/services/messageService";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export const Route = createFileRoute("/office/messages")({
  component: OfficeMessagesPage,
});

function OfficeMessagesPage() {
  const { allowed, isLoading } = useAuthGuard("engineering_office");
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { user } = useAuth();
  const [convos, setConvos] = useState<{ partnerId: string; partnerName: string; lastMessage: string; lastAt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || !allowed) return;
    (async () => {
      try {
        setLoading(true);
        const list = await messageService.listConversationsForUser(user.id);
        const ids = list.map((c) => c.partnerId);
        let names = new Map<string, string>();
        if (ids.length) {
          const { data } = await supabase.from("profiles").select("id, name, role").in("id", ids);
          (data ?? []).forEach((p: any) => {
            names.set(p.id, p.role === "supervisor" ? (isRTL ? "الإدارة" : "Admin") : (p.name || ""));
          });
        }
        setConvos(list.map((c) => ({ ...c, partnerName: names.get(c.partnerId) || (isRTL ? "الإدارة" : "Admin") })));
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id, allowed, isRTL]);

  if (!allowed) {
    return isLoading ? (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="text-muted-foreground">{isRTL ? "جاري التحقق..." : "Checking..."}</span>
      </div>
    ) : null;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10" dir={isRTL ? "rtl" : "ltr"}>
      <h1 className="text-3xl font-black flex items-center gap-2">
        <MessageSquare className="h-7 w-7 text-gold" />
        {isRTL ? "الرسائل" : "Messages"}
      </h1>

      <Card className="mt-6">
        <CardContent className="pt-6">
          {loading ? (
            <p className="text-muted-foreground text-sm">{isRTL ? "جارٍ التحميل..." : "Loading..."}</p>
          ) : convos.length === 0 ? (
            <p className="text-muted-foreground text-sm py-6 text-center">
              {isRTL ? "لا توجد محادثات" : "No conversations yet"}
            </p>
          ) : (
            <ul className="divide-y">
              {convos.map((c) => (
                <li key={c.partnerId}>
                  <Link
                    to="/office/chat/$id"
                    params={{ id: c.partnerId }}
                    className="flex items-center justify-between py-3 hover:bg-muted/50 rounded-lg px-2"
                  >
                    <div>
                      <div className="font-medium">{c.partnerName}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">{c.lastMessage}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(c.lastAt).toLocaleString()}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
