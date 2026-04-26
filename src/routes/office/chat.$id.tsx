import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { messageService } from "@/services/messageService";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/office/chat/$id")({
  component: OfficeChatPage,
});

type Msg = { id: string; sender_id: string; recipient_id: string; content: string; created_at: string };

function OfficeChatPage() {
  const { allowed, isLoading } = useAuthGuard("engineering_office");
  const { id: partnerId } = Route.useParams();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const navigate = useNavigate();
  const { user } = useAuth();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [partnerName, setPartnerName] = useState<string>(isRTL ? "الإدارة" : "Admin");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  const load = async () => {
    if (!user?.id) return;
    try {
      const data = await messageService.getConversation(user.id, partnerId);
      setMessages(data as Msg[]);
    } catch (err: any) {
      console.error("office chat load error =>", err);
    }
  };

  useEffect(() => {
    if (!allowed) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("name, role").eq("id", partnerId).maybeSingle();
      if (data) {
        setPartnerName(data.role === "supervisor" ? (isRTL ? "الإدارة" : "Admin") : (data.name || ""));
      }
    })();
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [partnerId, user?.id, allowed]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const send = async () => {
    const content = text.trim();
    if (!content || !user?.id) return;
    try {
      setSending(true);
      const senderLabel = user.name || (isRTL ? "المكتب" : "Office");
      await messageService.send(user.id, partnerId, content, senderLabel);
      setText("");
      await load();
    } catch (err: any) {
      console.error("send error =>", err);
      toast.error(err?.message || (isRTL ? "تعذر الإرسال" : "Failed to send"));
    } finally {
      setSending(false);
    }
  };

  if (!allowed) {
    return isLoading ? (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="text-muted-foreground">{isRTL ? "جاري التحقق..." : "Checking..."}</span>
      </div>
    ) : null;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => navigate({ to: "/office/messages" })}>
          <BackIcon className="me-1 h-4 w-4" />
          {isRTL ? "رجوع" : "Back"}
        </Button>
        <h1 className="text-xl font-bold">{partnerName}</h1>
        <span />
      </div>

      <Card className="mt-4">
        <CardContent className="p-0">
          <div ref={scrollRef} className="h-[60vh] overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-12">
                {isRTL ? "لا توجد رسائل بعد" : "No messages yet"}
              </p>
            ) : (
              messages.map((m) => {
                const mine = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                        mine ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <div className="text-[11px] opacity-70 mb-0.5">
                        {mine ? (user?.name || (isRTL ? "المكتب" : "Office")) : partnerName}
                        {" · "}
                        {new Date(m.created_at).toLocaleString()}
                      </div>
                      <div className="whitespace-pre-wrap break-words">{m.content}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="flex items-center gap-2 border-t p-3">
            <Input
              placeholder={isRTL ? "اكتب رسالة..." : "Type a message..."}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <Button onClick={send} disabled={sending || !text.trim()}>
              <Send className="me-1 h-4 w-4" />
              {isRTL ? "إرسال" : "Send"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
