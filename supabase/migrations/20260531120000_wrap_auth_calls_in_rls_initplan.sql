-- Optimizon RLS policies duke wrappuar auth.uid() / auth.role() / auth.jwt() ne
-- (SELECT auth.X()) qe Postgres ti evaluoje nje here per query (initplan) ne vend
-- te per cdo rresht. Referim: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
--
-- Supabase advisor po raportonte 33 polica me kete problem. Sjellja semantike
-- mbetet identike — vetem performanca ndryshon (planner-i e di tani qe shprehja
-- nuk varet nga rreshti).
--
-- Strategjia: nje DO-block qe identifikon te gjitha policat ne schema public me
-- thirrje te pa-wrappuara, dhe i ridefinon ato me ALTER POLICY duke perdorur
-- string replacement me sentinels qe te shmangim re-wrap-imin e atyre qe jane
-- tashme te wrappuara.

DO $$
DECLARE
  r record;
  new_qual text;
  new_check text;
  alter_stmt text;
  fixed_count int := 0;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        qual ~ 'auth\.(uid|role|jwt)\(\)'
        OR with_check ~ 'auth\.(uid|role|jwt)\(\)'
      )
  LOOP
    new_qual := r.qual;
    new_check := r.with_check;

    -- Wrap auth.uid()
    IF new_qual IS NOT NULL THEN
      new_qual := replace(new_qual, '( SELECT auth.uid())', '__WRAPPED_UID__');
      new_qual := replace(new_qual, '(SELECT auth.uid())', '__WRAPPED_UID__');
      new_qual := replace(new_qual, '( SELECT auth.role())', '__WRAPPED_ROLE__');
      new_qual := replace(new_qual, '(SELECT auth.role())', '__WRAPPED_ROLE__');
      new_qual := replace(new_qual, '( SELECT auth.jwt()', '__WRAPPED_JWT_OPEN__');
      new_qual := replace(new_qual, '(SELECT auth.jwt()', '__WRAPPED_JWT_OPEN__');

      new_qual := replace(new_qual, 'auth.uid()', '(SELECT auth.uid())');
      new_qual := replace(new_qual, 'auth.role()', '(SELECT auth.role())');
      new_qual := replace(new_qual, 'auth.jwt()', '(SELECT auth.jwt())');

      new_qual := replace(new_qual, '__WRAPPED_UID__', '(SELECT auth.uid())');
      new_qual := replace(new_qual, '__WRAPPED_ROLE__', '(SELECT auth.role())');
      new_qual := replace(new_qual, '__WRAPPED_JWT_OPEN__', '(SELECT auth.jwt()');
    END IF;

    IF new_check IS NOT NULL THEN
      new_check := replace(new_check, '( SELECT auth.uid())', '__WRAPPED_UID__');
      new_check := replace(new_check, '(SELECT auth.uid())', '__WRAPPED_UID__');
      new_check := replace(new_check, '( SELECT auth.role())', '__WRAPPED_ROLE__');
      new_check := replace(new_check, '(SELECT auth.role())', '__WRAPPED_ROLE__');
      new_check := replace(new_check, '( SELECT auth.jwt()', '__WRAPPED_JWT_OPEN__');
      new_check := replace(new_check, '(SELECT auth.jwt()', '__WRAPPED_JWT_OPEN__');

      new_check := replace(new_check, 'auth.uid()', '(SELECT auth.uid())');
      new_check := replace(new_check, 'auth.role()', '(SELECT auth.role())');
      new_check := replace(new_check, 'auth.jwt()', '(SELECT auth.jwt())');

      new_check := replace(new_check, '__WRAPPED_UID__', '(SELECT auth.uid())');
      new_check := replace(new_check, '__WRAPPED_ROLE__', '(SELECT auth.role())');
      new_check := replace(new_check, '__WRAPPED_JWT_OPEN__', '(SELECT auth.jwt()');
    END IF;

    -- Skip nese asgje nuk ndryshoi (mund te jete tashme i wrappuar dhe regex u shenoi false-positive)
    IF (new_qual IS NOT DISTINCT FROM r.qual) AND (new_check IS NOT DISTINCT FROM r.with_check) THEN
      CONTINUE;
    END IF;

    -- Ndertimi i ALTER POLICY
    IF new_qual IS NOT NULL AND new_check IS NOT NULL THEN
      alter_stmt := format(
        'ALTER POLICY %I ON %I.%I USING (%s) WITH CHECK (%s)',
        r.policyname, r.schemaname, r.tablename, new_qual, new_check
      );
    ELSIF new_qual IS NOT NULL THEN
      alter_stmt := format(
        'ALTER POLICY %I ON %I.%I USING (%s)',
        r.policyname, r.schemaname, r.tablename, new_qual
      );
    ELSIF new_check IS NOT NULL THEN
      alter_stmt := format(
        'ALTER POLICY %I ON %I.%I WITH CHECK (%s)',
        r.policyname, r.schemaname, r.tablename, new_check
      );
    ELSE
      CONTINUE;
    END IF;

    EXECUTE alter_stmt;
    fixed_count := fixed_count + 1;
    RAISE NOTICE 'Fixed: %.%', r.tablename, r.policyname;
  END LOOP;

  RAISE NOTICE 'Total policies optimized: %', fixed_count;
END $$;
