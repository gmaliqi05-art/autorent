/*
  # Add Super Admin Feature Tables

  1. New Tables
    - `chat_responses` - Pre-configured AI chatbot responses with keyword matching
    - `homepage_content` - Editable homepage section content for CMS
    - `platform_ads` - Advertisements/promotions management
    - `chat_conversations` - Chat session tracking
    - `chat_messages` - Individual chat messages in conversations
    - `platform_settings` - Global platform configuration

  2. Security
    - RLS enabled on all tables
    - Super admin has full CRUD access on management tables
    - Chat responses readable by all (authenticated + anon)
    - Homepage content and ads publicly readable
    - Platform settings readable by authenticated users

  3. Indexes
    - Performance indexes on frequently queried columns
*/

CREATE TABLE IF NOT EXISTS chat_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'pergjithshme',
  keywords jsonb NOT NULL DEFAULT '[]'::jsonb,
  question text NOT NULL,
  answer text NOT NULL,
  language text NOT NULL DEFAULT 'sq',
  priority integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  usage_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE chat_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chat responses readable by authenticated"
  ON chat_responses FOR SELECT TO authenticated
  USING (is_active = true OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Chat responses readable by anon"
  ON chat_responses FOR SELECT TO anon
  USING (is_active = true);

CREATE POLICY "Super admin inserts chat responses"
  ON chat_responses FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Super admin updates chat responses"
  ON chat_responses FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Super admin deletes chat responses"
  ON chat_responses FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE TABLE IF NOT EXISTS homepage_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  title text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  image_url text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE homepage_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homepage content readable by anon"
  ON homepage_content FOR SELECT TO anon
  USING (is_active = true);

CREATE POLICY "Homepage content readable by authenticated"
  ON homepage_content FOR SELECT TO authenticated
  USING (is_active = true OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Super admin inserts homepage content"
  ON homepage_content FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Super admin updates homepage content"
  ON homepage_content FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Super admin deletes homepage content"
  ON homepage_content FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE TABLE IF NOT EXISTS platform_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  link_url text NOT NULL DEFAULT '',
  position text NOT NULL DEFAULT 'homepage_banner',
  is_active boolean NOT NULL DEFAULT true,
  start_date timestamptz,
  end_date timestamptz,
  click_count integer NOT NULL DEFAULT 0,
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE platform_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ads readable by anon"
  ON platform_ads FOR SELECT TO anon
  USING (is_active = true);

CREATE POLICY "Ads readable by authenticated"
  ON platform_ads FOR SELECT TO authenticated
  USING (is_active = true OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Super admin inserts ads"
  ON platform_ads FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Super admin updates ads"
  ON platform_ads FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Super admin deletes ads"
  ON platform_ads FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text NOT NULL DEFAULT '',
  user_id uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own conversations"
  ON chat_conversations FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Anon creates conversations"
  ON chat_conversations FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Authenticated creates conversations"
  ON chat_conversations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Super admin updates conversations"
  ON chat_conversations FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES chat_conversations(id),
  sender_type text NOT NULL DEFAULT 'visitor',
  message text NOT NULL,
  matched_response_id uuid REFERENCES chat_responses(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own conversation messages"
  ON chat_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND (chat_conversations.user_id = auth.uid()
        OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
    )
  );

CREATE POLICY "Anon inserts messages"
  ON chat_messages FOR INSERT TO anon
  WITH CHECK (sender_type = 'visitor');

CREATE POLICY "Authenticated inserts messages"
  ON chat_messages FOR INSERT TO authenticated
  WITH CHECK (sender_type IN ('visitor', 'bot'));

CREATE TABLE IF NOT EXISTS platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings readable by authenticated"
  ON platform_settings FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Super admin inserts settings"
  ON platform_settings FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Super admin updates settings"
  ON platform_settings FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

DROP POLICY IF EXISTS "Super admin inserts subscription plans" ON subscription_plans;
CREATE POLICY "Super admin inserts subscription plans"
  ON subscription_plans FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

DROP POLICY IF EXISTS "Super admin updates subscription plans" ON subscription_plans;
CREATE POLICY "Super admin updates subscription plans"
  ON subscription_plans FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

DROP POLICY IF EXISTS "Super admin deletes subscription plans" ON subscription_plans;
CREATE POLICY "Super admin deletes subscription plans"
  ON subscription_plans FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE INDEX IF NOT EXISTS idx_chat_responses_category ON chat_responses(category);
CREATE INDEX IF NOT EXISTS idx_chat_responses_active ON chat_responses(is_active);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_platform_ads_position ON platform_ads(position);
CREATE INDEX IF NOT EXISTS idx_platform_ads_active ON platform_ads(is_active);
CREATE INDEX IF NOT EXISTS idx_homepage_content_section ON homepage_content(section_key);

INSERT INTO homepage_content (section_key, title, subtitle, content, sort_order)
VALUES
  ('hero', 'Udhetoni me stil, rezervoni me lehte.', 'Qindra automjete premium nga kompanite me te besueshme ne Kosove, Shqiperi dhe Maqedoni te Veriut.', '{"badge": "Platforma lider per qirane automjetesh", "search_enabled": true}'::jsonb, 1),
  ('trust_banner', 'Statistikat tona', 'Numrat flasin per ne', '{"stats": [{"value": "500+", "label": "Automjete"}, {"value": "10,000+", "label": "Kliente te kenaqur"}, {"value": "50+", "label": "Kompani te verifikuara"}, {"value": "4.8/5", "label": "Vleresimi mesatar"}]}'::jsonb, 2),
  ('categories', 'Gjeni automjetin qe ju pershtatet', 'Kategorite', '{}'::jsonb, 3),
  ('featured', 'Automjetet me te mira', 'Te zgjedhurat tona', '{}'::jsonb, 4),
  ('how_it_works', 'Si funksionon?', 'Procesi yne i thjeshte', '{"steps": [{"title": "Kerkoni automjetin", "desc": "Perdorni filtra per te gjetur automjetin ideal"}, {"title": "Beni rezervimin", "desc": "Zgjidhni daten dhe vendin e marrjes"}, {"title": "Merrni konfirmimin", "desc": "Kompania konfirmon brenda 24 oresh"}, {"title": "Merrni automjetin", "desc": "Paraqituni ne vendtakim dhe udhetoni!"}]}'::jsonb, 5),
  ('testimonials', 'Cfare thone klientet', 'Pershtypjet', '{}'::jsonb, 6),
  ('company_cta', 'Regjistroni kompanine tuaj sot', 'Jeni pronar i nje kompanie te qiranes? Bashkohuni me platformen me te madhe ne rajon.', '{}'::jsonb, 7)
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO platform_settings (key, value)
VALUES
  ('payment_methods', '{"stripe_enabled": false, "paypal_enabled": false, "bank_transfer_enabled": true, "stripe_public_key": "", "paypal_client_id": "", "bank_details": {"bank_name": "", "iban": "", "swift": "", "account_holder": ""}}'::jsonb),
  ('chat_settings', '{"enabled": true, "welcome_message": "Pershendetje! Si mund tu ndihmoj sot?", "offline_message": "Na vjen keq, nuk jemi online momentalisht.", "auto_response_delay_ms": 500}'::jsonb),
  ('platform_info', '{"name": "RentaKar", "company": "Booking Shpk", "nui": "812373174", "email": "info@rentakar.com", "phone": "+383 44 000 000", "address": "Rr. Epopeja e Jezercit Nr. 402, Ferizaj 70000, Kosove"}'::jsonb),
  ('seo_settings', '{"meta_title": "RentaKar - Platforma per Qirane Automjetesh", "meta_description": "Gjeni dhe rezervoni automjete ne Kosove, Shqiperi dhe Maqedoni te Veriut", "og_image": ""}'::jsonb)
ON CONFLICT (key) DO NOTHING;
