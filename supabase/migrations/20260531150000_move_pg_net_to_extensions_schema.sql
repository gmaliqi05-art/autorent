-- Lëvizja e pg_net nga schema `public` në schema `extensions`.
--
-- pg_net nuk është relocatable (extrelocatable=false), prandaj ALTER EXTENSION
-- SET SCHEMA nuk funksionon. I vetmi opsion: DROP + CREATE.
--
-- Pas DROP CASCADE:
-- - Schema `net` dhe gjithë përmbajtja e saj hiqen
-- - Tabelat `net.http_request_queue` dhe `net._http_response` zbrazen (humbje e
--   pranueshme; janë thjesht queue dhe log për HTTP asinkrone)
-- - Funksionet `net.http_post`, `net.http_get`, etj. hiqen
--
-- Pas CREATE WITH SCHEMA extensions:
-- - Ekstensioni regjistrohet në `extensions` schema (katalog)
-- - Schema `net` dhe gjithë objektet (funksione, tabela) krijohen përsëri
--   (kjo është hardcoded në control file të pg_net)
-- - Cron job-i `scheduled-tasks-every-15min` vazhdon punimët në ekzekutimin
--   tjetër 15-min, sepse referencon `net.http_post` (jo `public.http_post`)
--
-- Roll-back manual (nëse nëvojitet):
--   DROP EXTENSION pg_net CASCADE;
--   CREATE EXTENSION pg_net WITH SCHEMA public;

BEGIN;

DROP EXTENSION IF EXISTS pg_net CASCADE;
CREATE EXTENSION pg_net WITH SCHEMA extensions;

COMMIT;
