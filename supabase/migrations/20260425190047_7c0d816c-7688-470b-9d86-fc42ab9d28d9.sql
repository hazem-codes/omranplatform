CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  conversation_key TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON public.messages(conversation_key, created_at);
CREATE INDEX idx_messages_recipient ON public.messages(recipient_id);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Anyone in the conversation (sender or recipient) can read; supervisors can read all
CREATE POLICY "messages_select_participant"
ON public.messages FOR SELECT
TO authenticated
USING (sender_id = auth.uid() OR recipient_id = auth.uid() OR public.is_supervisor());

-- Sender can insert their own messages (must be a supervisor or an office)
CREATE POLICY "messages_insert_self"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid());