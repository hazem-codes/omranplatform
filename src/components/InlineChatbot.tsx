import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { aiService } from '@/services/aiService';
import type { ChatMessage } from '@/types';
import ReactMarkdown from 'react-markdown';

interface InlineChatbotProps {
  headline?: string;
  subheadline?: string;
}

export function InlineChatbot({ headline, subheadline }: InlineChatbotProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const greeting = isRTL
    ? 'أهلًا بك في منصة عمران 👋 أنا عمران الذكي. كيف يمكنني مساعدتك في مشروعك اليوم؟'
    : "Welcome to Omran 👋 I'm Omran AI. How can I help with your project today?";

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: greeting, timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const suggestions = isRTL
    ? ['كيف أبدأ مشروعي؟', 'كم تكلفة بناء فيلا؟', 'كيف أختار المكتب المناسب؟']
    : ['How do I start a project?', 'How much does a villa cost?', 'How to pick the right office?'];

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    try {
      const response = await aiService.chat([...messages, userMsg], i18n.language as 'ar' | 'en');
      setMessages((prev) => [...prev, { role: 'assistant', content: response, timestamp: new Date() }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: isRTL ? 'عذراً، حدث خطأ. حاول مرة أخرى.' : 'Sorry, something went wrong. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl rounded-3xl border border-white/20 bg-white/10 p-2 shadow-2xl backdrop-blur-md" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="overflow-hidden rounded-2xl bg-card">
        {/* Header */}
        <div className="bg-gradient-navy px-6 py-5 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-gold shadow-gold">
              <Bot className="h-5 w-5 text-gold-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold leading-tight">
                  {headline ?? (isRTL ? 'مساعد عمران الذكي' : 'Omran AI Assistant')}
                </h3>
                <Sparkles className="h-4 w-4 text-gold" />
              </div>
              {subheadline && <p className="mt-0.5 text-sm text-white/75">{subheadline}</p>}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="h-[340px] space-y-3 overflow-y-auto bg-muted/30 p-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-gold/20 text-gold'
                }`}
              >
                {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border text-foreground'
                }`}
              >
                <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:m-0">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/20 text-gold">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl border bg-card px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && !isLoading && (
          <div className="flex flex-wrap gap-2 border-t bg-card px-4 pt-3">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="rounded-full border border-gold/40 bg-gold/5 px-3 py-1.5 text-xs font-medium text-gold transition-colors hover:bg-gold hover:text-gold-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2 border-t bg-card p-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('chatbot.placeholder')}
            className="flex-1 rounded-full border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/50"
            dir="auto"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="h-10 w-10 rounded-full bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

export default InlineChatbot;
