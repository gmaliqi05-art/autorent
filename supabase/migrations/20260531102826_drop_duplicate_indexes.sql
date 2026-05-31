-- Heq dy indeksa krejtësisht dublikate qe Supabase advisor po raporton:
--
--  1. public.partner_clicks: idx_partner_clicks_user dhe
--     partner_clicks_user_id_created_idx jane identike
--     ((user_id, created_at DESC) WHERE user_id IS NOT NULL).
--     `partner_clicks_user_id_created_idx` u krijua nga migration P0.1
--     (20260531120000_harden_partner_clicks_insert_rls.sql) pa u verifikuar qe
--     ekziston tashme; e heqim ate me te ri dhe mbajme origjinalin.
--
--  2. public.email_logs: idx_email_logs_recipient dhe idx_email_logs_recipient_email
--     jane identike (recipient_email). Hiqet ai me i ri.

DROP INDEX IF EXISTS public.partner_clicks_user_id_created_idx;
DROP INDEX IF EXISTS public.idx_email_logs_recipient_email;
