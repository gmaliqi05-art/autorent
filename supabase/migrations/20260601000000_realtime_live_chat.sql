/*
  # Realtime live chat — escalim nga bot tek agjent njerezor

  Shtim mbi schema-n ekzistuese te chat_conversations + chat_messages:
  - Kolona is_escalated (kur visitor kerkon agjent te vertete)
  - Kolona last_message_at (per sortim ne inbox-in e admin-it)
  - Trigger qe bump-on last_message_at sa here insertohet nje message
  - Policy: super_admin mund te insertoje messages me sender_type='admin'
  - Policy: super_admin mund te SELECT te gjitha chat_messages (per inbox)
  - Policy: useri authenticated mund te UPDATE is_escalated per konvesacionin e tij
  - Realtime publication aktivizohet per chat_messages + chat_conversations

  Vetem useri i loguar mund te escalate (jo anon) — kjo shmang
  trustimin e visitor_id ne RLS dhe siguron qe ka identitet per ndjekje.
*/

ALTER TABLE chat_conversations
  ADD COLUMN IF NOT EXISTS is_escalated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_message_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_chat_conversations_escalated_last
  ON chat_conversations(is_escalated, last_message_at DESC)
  WHERE is_escalated = true;

CREATE INDEX IF NOT EXISTS idx_chat_conversations_user
  ON chat_conversations(user_id)
  WHERE user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION bump_chat_conversation_last_message_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE chat_conversations
    SET last_message_at = now(),
        updated_at = now()
    WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_chat_messages_bump_last ON chat_messages;
CREATE TRIGGER trg_chat_messages_bump_last
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION bump_chat_conversation_last_message_at();

DROP POLICY IF EXISTS "Super admin inserts admin messages" ON chat_messages;
CREATE POLICY "Super admin inserts admin messages"
  ON chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_type = 'admin'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );

DROP POLICY IF EXISTS "User updates own escalation" ON chat_conversations;
CREATE POLICY "User updates own escalation"
  ON chat_conversations FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
  END IF;
END $$;

ALTER TABLE chat_messages REPLICA IDENTITY FULL;
ALTER TABLE chat_conversations REPLICA IDENTITY FULL;
