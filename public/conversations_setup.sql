-- =====================================================================
-- Conversations + extend messages (run once in Supabase SQL Editor)
-- Additive: keeps existing legacy messages flow (sender_id/recipient_id/
-- conversation_key) fully working. Adds a richer conversations model
-- on top, used by the new role-based inbox + ChatWindow.
-- =====================================================================

-- 1) conversations table -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type            text NOT NULL CHECK (type IN (
                    'service_request',
                    'project_request',
                    'template_purchase',
                    'pre_bid_inquiry',
                    'supervisor_office',
                    'supervisor_client'
                  )),
  reference_id    uuid,
  reference_title text,
  client_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  office_id       uuid REFERENCES public.engineering_offices(id) ON DELETE SET NULL,
  supervisor_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  status          text NOT NULL DEFAULT 'active'
);

CREATE INDEX IF NOT EXISTS idx_conversations_client      ON public.conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_office      ON public.conversations(office_id);
CREATE INDEX IF NOT EXISTS idx_conversations_supervisor  ON public.conversations(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_conversations_type_ref    ON public.conversations(type, reference_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_msg    ON public.conversations(last_message_at DESC);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_select_participant"  ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_participant"  ON public.conversations;
DROP POLICY IF EXISTS "conversations_update_participant"  ON public.conversations;

CREATE POLICY "conversations_select_participant"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (
    client_id     = auth.uid()
    OR office_id  = auth.uid()
    OR supervisor_id = auth.uid()
    OR public.is_supervisor()
  );

CREATE POLICY "conversations_insert_participant"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id     = auth.uid()
    OR office_id  = auth.uid()
    OR supervisor_id = auth.uid()
    OR public.is_supervisor()
  );

CREATE POLICY "conversations_update_participant"
  ON public.conversations FOR UPDATE
  TO authenticated
  USING (
    client_id     = auth.uid()
    OR office_id  = auth.uid()
    OR supervisor_id = auth.uid()
    OR public.is_supervisor()
  );

-- 2) Extend messages table additively ----------------------------------
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id
  ON public.messages(conversation_id, created_at);

DROP POLICY IF EXISTS "messages_select_conversation_participant" ON public.messages;
CREATE POLICY "messages_select_conversation_participant"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    conversation_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = public.messages.conversation_id
        AND (
          c.client_id     = auth.uid()
          OR c.office_id  = auth.uid()
          OR c.supervisor_id = auth.uid()
          OR public.is_supervisor()
        )
    )
  );

DROP POLICY IF EXISTS "messages_insert_conversation_participant" ON public.messages;
CREATE POLICY "messages_insert_conversation_participant"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = public.messages.conversation_id
        AND (
          c.client_id     = auth.uid()
          OR c.office_id  = auth.uid()
          OR c.supervisor_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS "messages_update_mark_read" ON public.messages;
CREATE POLICY "messages_update_mark_read"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (
    conversation_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = public.messages.conversation_id
        AND (
          c.client_id     = auth.uid()
          OR c.office_id  = auth.uid()
          OR c.supervisor_id = auth.uid()
        )
    )
  )
  WITH CHECK (
    conversation_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = public.messages.conversation_id
        AND (
          c.client_id     = auth.uid()
          OR c.office_id  = auth.uid()
          OR c.supervisor_id = auth.uid()
        )
    )
  );

-- 3) Bump last_message_at when a new message is inserted ---------------
CREATE OR REPLACE FUNCTION public.touch_conversation_last_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.conversation_id IS NOT NULL THEN
    UPDATE public.conversations
       SET last_message_at = NEW.created_at
     WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_messages_touch_conversation ON public.messages;
CREATE TRIGGER trg_messages_touch_conversation
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_conversation_last_message();

-- 4) Realtime ----------------------------------------------------------
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.messages      REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'conversations'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.messages';
  END IF;
END$$;
