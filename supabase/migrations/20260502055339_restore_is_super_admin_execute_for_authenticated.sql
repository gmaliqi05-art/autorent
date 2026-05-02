/*
  # Rikthim i EXECUTE ne is_super_admin() per rolin authenticated

  1. Problemi
    - Ne migrimin e fundit te hardening-ut u hoq EXECUTE nga `anon` dhe
      `authenticated` per `public.is_super_admin()`.
    - Tabela `vehicles` ka politika RLS qe perdorin `is_super_admin()` ne
      klauzolen USING per SELECT/UPDATE/DELETE. Pa EXECUTE, cdo query SELECT
      nga nje perdorues i loguar deshton silently, dhe veturat e publikuara
      nuk shfaqen me pas login-it.

  2. Rregullimi
    - Jep EXECUTE vetem tek roli `authenticated`.
    - Mbaje te hequr nga `anon` dhe `PUBLIC`, per te mos e rihapur ne API-n
      publike pa autentikim.

  3. Siguria
    - Funksioni brenda verifikon `auth.uid()` kunder `profiles.role` dhe kthen
      thjesht boolean. Thirrja nga nje perdorues i loguar nuk rrjedh informacion.
    - Anon mbetet i bllokuar (nuk mund te thirret me /rest/v1/rpc pa login).
*/

REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
