/*
  # Shtim i kolones preferred_language ne profiles

  1. Ndryshime
    - Shton kolonen `preferred_language` (text, default 'sq') ne tabelen `profiles`
    - Vlerat e lejuara: 'sq' (Shqip), 'en' (English), 'de' (Deutsch)
    - Default eshte 'sq' qe te ruhet kompatibiliteti me perdorues ekzistues

  2. Siguria
    - RLS ekzistuese ne `profiles` zbatohet automatikisht
    - Asnje politike e re nuk eshte e nevojshme

  3. Shenime
    - Kjo kolone perdoret per te ruajtur preferencen e gjuhes per cdo perdorues te identifikuar
    - Vizitoret anonim ruajne preferencen ne localStorage te shfletuesit
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'preferred_language'
  ) THEN
    ALTER TABLE profiles ADD COLUMN preferred_language text DEFAULT 'sq' NOT NULL;

    ALTER TABLE profiles ADD CONSTRAINT profiles_preferred_language_check
      CHECK (preferred_language IN ('sq', 'en', 'de'));

  END IF;

END $$;

;
