/*
  # Seed 4-tier subscription plans

  ## Overview
  Replaces any existing plans with the 4 official tiers:
  1. Free          – 0 EUR/month,  max 3 vehicles
  2. Standard      – 29 EUR/month, max 5 vehicles
  3. Premium       – 59 EUR/month, max 10 vehicles (popular)
  4. Super Premium – 99 EUR/month, unlimited vehicles & bookings

  ## Changes
  - Adds yearly_discount_percent and is_popular columns if missing
  - Deletes all existing plans and re-inserts the 4 canonical ones
  - features stored as jsonb array (cast from JSON literal)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans' AND column_name = 'yearly_discount_percent'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN yearly_discount_percent integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans' AND column_name = 'is_popular'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN is_popular boolean DEFAULT false;
  END IF;
END $$;

DELETE FROM subscription_plans;

INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, max_vehicles, max_bookings_monthly, features, is_active, sort_order, yearly_discount_percent, is_popular) VALUES
(
  'Free',
  'Per kompanite qe fillojne',
  0, 0, 3, 20,
  '["Deri ne 3 automjete aktive","Deri ne 20 rezervime ne muaj","Dashboard bazik","Menaxhim i rezervimeve","Profil i kompanise","Support komunitar"]'::jsonb,
  true, 1, 0, false
),
(
  'Standard',
  'Per kompanite ne rritje',
  29, 278, 5, 100,
  '["Deri ne 5 automjete aktive","Deri ne 100 rezervime ne muaj","Dashboard i avancuar","Menaxhim i plote i rezervimeve","Raporte financiare bazike","Ngarkimi i fotove per automjete","Profil i kompanise me logo","Email notifications","Support me email"]'::jsonb,
  true, 2, 20, false
),
(
  'Premium',
  'Per kompanite profesionale',
  59, 566, 10, -1,
  '["Deri ne 10 automjete aktive","Rezervime pa limit","Dashboard i plote me analitike","Raporte financiare te detajuara","Fatura automatike per klientet","Ngarkimi i fotove multiple per automjet","Profil premium i kompanise","Pozicionim prioritar ne kerkime","Email & SMS notifications","Support prioritar 24/7","Eksportim i te dhenave CSV"]'::jsonb,
  true, 3, 20, true
),
(
  'Super Premium',
  'Per flota te medha pa kufizime',
  99, 950, -1, -1,
  '["Automjete pa limit","Rezervime pa limit","Dashboard me analitike te avancuara","Raporte financiare te plota & eksportim","Fatura automatike & menaxhim kontratash","Galeri e pakufizuar fotosh","Profil VIP i kompanise","Pozicionim prioritar #1 ne kerkime","Reklamim preferencial ne homepage","API access per integrime","Manager personal i llogarise","Support VIP 24/7 me telefon","Onboarding dhe trajnim falas"]'::jsonb,
  true, 4, 20, false
);
