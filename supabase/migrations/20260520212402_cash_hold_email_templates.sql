/*
  # Email templates per cash hold (3 te reja)

  - cash_hold_authorized: kur klienti jep karten dhe garancia bllokohet
  - cash_hold_released: kur kompania liron garancin pas pages kesh
  - cash_hold_captured: kur kompania kape garancin si penalitet (no-show)

  Variables (templateData):
   - recipientName, vehicleName, companyName, supportEmail
   - holdAmount (per authorized + released)
   - capturedAmount, reason (per captured)
   - pickupDate, returnDate (per authorized)
*/

INSERT INTO public.email_templates (template_key, description, subject_template, html_template, text_template, is_active)
VALUES
(
  'cash_hold_authorized',
  'Notification kur klienti autorizon garancin per pagese kesh',
  'Garancia {{holdAmount}} EUR u bllokua per rezervimin tuaj',
  '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto;padding:20px}.box{background:#fff8e1;border:1px solid #ffd54f;border-radius:12px;padding:20px;margin:20px 0}.amount{font-size:28px;font-weight:bold;color:#0066ff}.muted{color:#666;font-size:14px}</style></head><body><h2>Pershendetje {{recipientName}},</h2><p>Karta juaj u autorizua me sukses si garanci per rezervimin <strong>{{vehicleName}}</strong> nga <strong>{{companyName}}</strong>.</p><div class="box"><p style="margin:0">Shuma e bllokuar:</p><p class="amount">{{holdAmount}} EUR</p><p class="muted" style="margin:8px 0 0">Datat: {{pickupDate}} - {{returnDate}}</p></div><h3>Cfare ndodh tani?</h3><ul><li><strong>Shuma NUK u debituar</strong> nga karta juaj — vetem e <strong>bllokuar</strong> si garanci.</li><li>Kur te merrni veturen, paguani pjesen e mbetur kesh ne lokal.</li><li>Pas pages kesh, kompania do te <strong>liroje garancin</strong> menjehere dhe asnje shume nuk u terhiqet realisht.</li><li>Nese garancia nuk liroet brenda 7 diteve, ajo skadon vetem.</li></ul><p><strong>Vetem ne rast se nuk shfaqeni</strong> ne diten e marrjes pa lajmeruar paraprakisht, kompania mund ta kape kete shume si penalitet.</p><p>Faleminderit qe perdorni RentaKar!</p><p class="muted">Per pyetje: {{supportEmail}}</p></body></html>',
  'Pershendetje {{recipientName}}, Karta juaj u autorizua si garanci {{holdAmount}} EUR per rezervimin {{vehicleName}} nga {{companyName}}. Shuma nuk u debituar - vetem u bllokua. Pas pages kesh ne lokal, kompania liron garancin. Datat: {{pickupDate}} - {{returnDate}}. Per pyetje: {{supportEmail}}',
  true
),
(
  'cash_hold_released',
  'Notification kur kompania liron garancin pas pages kesh',
  'Garancia {{holdAmount}} EUR u lirua - faleminderit per pagesen!',
  '<!DOCTYPE html>...',
  'Pershendetje {{recipientName}}, Garancia {{holdAmount}} EUR u lirua nga {{companyName}}.',
  true
),
(
  'cash_hold_captured',
  'Notification kur kompania kap garancin si penalitet',
  'Penalitet {{capturedAmount}} EUR i terhequr nga karta juaj',
  '<!DOCTYPE html>...',
  'Pershendetje {{recipientName}}, {{companyName}} ka kapur {{capturedAmount}} EUR si penalitet.',
  true
)
ON CONFLICT (template_key) DO UPDATE SET
  subject_template = EXCLUDED.subject_template,
  html_template = EXCLUDED.html_template,
  text_template = EXCLUDED.text_template,
  updated_at = now();
