/*
  # Tighten review_helpful_votes SELECT policy

  Policy aktuale "Read helpful votes" perdor `USING (true)` per anon dhe
  authenticated — ekspozon votimet individuale te cdo useri (kush ka
  votuar cilen review). Kjo eshte privacy leak: aggregate count gjendet
  ne `reviews.helpful_count` qe perdoret per UI.

  Useri ka nevoje vetem te shohe nese ai vete ka votuar (per toggle ne UI).

  Ndryshimi:
   - Drop policy `USING (true)`
   - Krijim policy te re: vetem rreshtat me `user_id = auth.uid()`
   - Anon nuk ka me akses (s'mund te votojne pa qene loguar)
*/

DROP POLICY IF EXISTS "Read helpful votes" ON public.review_helpful_votes;

CREATE POLICY "Read own helpful votes" ON public.review_helpful_votes
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
