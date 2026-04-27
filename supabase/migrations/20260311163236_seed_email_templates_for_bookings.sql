/*
  # Seed email templates for booking notifications

  1. Templates Added
    - booking_confirmation_client - Sent to client when booking is created
    - booking_confirmation_company - Sent to company when new booking arrives
    - booking_approved - Sent to client when company approves booking
    - booking_rejected - Sent to client when company rejects booking
    - booking_completed - Sent to client when booking is completed
    - booking_invoice - Sent to client with invoice details
    - welcome_client - Welcome email for new clients
    - welcome_company - Welcome email for new companies
*/

INSERT INTO email_templates (template_key, subject_template, html_template, text_template, description, is_active)
VALUES
(
  'booking_confirmation_client',
  'Rezervimi juaj u krye - {{vehicleName}}',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden"><div style="background:#1a1a2e;padding:24px 32px"><h1 style="color:#fff;margin:0;font-size:20px">RentaKar</h1></div><div style="padding:32px"><h2 style="color:#1a1a2e;margin:0 0 8px">Rezervimi juaj u krye!</h2><p style="color:#6b7280;margin:0 0 24px">Faleminderit {{clientName}}! Rezervimi juaj eshte ne pritje te konfirmimit nga kompania.</p><div style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:24px"><table style="width:100%;border-collapse:collapse"><tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Automjeti</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#1a1a2e;font-size:14px">{{vehicleName}}</td></tr><tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Kompania</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#1a1a2e;font-size:14px">{{companyName}}</td></tr><tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Data e marrjes</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#1a1a2e;font-size:14px">{{pickupDate}}</td></tr><tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Data e kthimit</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#1a1a2e;font-size:14px">{{returnDate}}</td></tr><tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Ditë</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#1a1a2e;font-size:14px">{{totalDays}}</td></tr><tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Metoda e pageses</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#1a1a2e;font-size:14px">{{paymentMethod}}</td></tr><tr style="border-top:2px solid #e5e7eb"><td style="padding:12px 0;color:#1a1a2e;font-weight:700;font-size:16px">Totali</td><td style="padding:12px 0;text-align:right;font-weight:700;color:#2563eb;font-size:16px">{{totalPrice}} EUR</td></tr></table></div><p style="color:#6b7280;font-size:14px">Statusi: <strong style="color:#d97706">{{status}}</strong></p><a href="{{dashboardUrl}}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-top:16px">Shiko rezervimet e mia</a></div><div style="border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center;color:#9ca3af;font-size:12px">RentaKar - Platforma e qerase se automjeteve</div></div>',
  'Rezervimi juaj u krye! Automjeti: {{vehicleName}}, Kompania: {{companyName}}, Data: {{pickupDate}} - {{returnDate}}, Totali: {{totalPrice}} EUR. Statusi: {{status}}',
  'Email konfirmimi i rezervimit per klientin',
  true
),
(
  'booking_confirmation_company',
  'Rezervim i ri - {{vehicleName}} nga {{clientName}}',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden"><div style="background:#1a1a2e;padding:24px 32px"><h1 style="color:#fff;margin:0;font-size:20px">RentaKar - Rezervim i Ri</h1></div><div style="padding:32px"><h2 style="color:#1a1a2e;margin:0 0 8px">Keni nje rezervim te ri!</h2><p style="color:#6b7280;margin:0 0 24px">Nje klient ka bere nje rezervim te ri per automjetin tuaj.</p><div style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:24px"><table style="width:100%;border-collapse:collapse"><tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Klienti</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#1a1a2e;font-size:14px">{{clientName}}</td></tr><tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Email</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#1a1a2e;font-size:14px">{{clientEmail}}</td></tr><tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Telefoni</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#1a1a2e;font-size:14px">{{clientPhone}}</td></tr><tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Automjeti</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#1a1a2e;font-size:14px">{{vehicleName}}</td></tr><tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Data</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#1a1a2e;font-size:14px">{{pickupDate}} - {{returnDate}}</td></tr><tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Pagesa</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#1a1a2e;font-size:14px">{{paymentMethod}}</td></tr><tr style="border-top:2px solid #e5e7eb"><td style="padding:12px 0;font-weight:700;font-size:16px;color:#1a1a2e">Totali</td><td style="padding:12px 0;text-align:right;font-weight:700;color:#2563eb;font-size:16px">{{totalPrice}} EUR</td></tr></table></div><a href="{{dashboardUrl}}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Menaxho rezervimet</a></div></div>',
  'Rezervim i ri nga {{clientName}} per {{vehicleName}}. Data: {{pickupDate}} - {{returnDate}}. Totali: {{totalPrice}} EUR.',
  'Njoftim per kompanine per rezervim te ri',
  true
),
(
  'booking_approved',
  'Rezervimi juaj u aprovua - {{vehicleName}}',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden"><div style="background:#059669;padding:24px 32px"><h1 style="color:#fff;margin:0;font-size:20px">Rezervimi u Aprovua!</h1></div><div style="padding:32px"><h2 style="color:#1a1a2e;margin:0 0 8px">Lajm i mire, {{clientName}}!</h2><p style="color:#6b7280;margin:0 0 24px">Kompania {{companyName}} aprovoi rezervimin tuaj.</p><div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin-bottom:24px"><table style="width:100%;border-collapse:collapse"><tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Automjeti</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#1a1a2e;font-size:14px">{{vehicleName}}</td></tr><tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Data e marrjes</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#1a1a2e;font-size:14px">{{pickupDate}}</td></tr><tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Data e kthimit</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#1a1a2e;font-size:14px">{{returnDate}}</td></tr><tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Vendndodhja</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#1a1a2e;font-size:14px">{{pickupLocation}}</td></tr><tr style="border-top:2px solid #bbf7d0"><td style="padding:12px 0;font-weight:700;font-size:16px;color:#1a1a2e">Totali</td><td style="padding:12px 0;text-align:right;font-weight:700;color:#059669;font-size:16px">{{totalPrice}} EUR</td></tr></table></div><p style="color:#6b7280;font-size:14px;margin-bottom:8px">Kontakti i kompanise:</p><p style="color:#1a1a2e;font-size:14px;margin:0">Email: {{companyEmail}}<br>Tel: {{companyPhone}}</p><a href="{{dashboardUrl}}" style="display:inline-block;background:#059669;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-top:20px">Shiko detajet</a></div></div>',
  'Rezervimi juaj per {{vehicleName}} u aprovua nga {{companyName}}! Data: {{pickupDate}} - {{returnDate}}. Totali: {{totalPrice}} EUR.',
  'Email njoftimi kur kompania aprovon rezervimin',
  true
),
(
  'booking_rejected',
  'Rezervimi juaj u refuzua - {{vehicleName}}',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden"><div style="background:#dc2626;padding:24px 32px"><h1 style="color:#fff;margin:0;font-size:20px">Rezervimi u Refuzua</h1></div><div style="padding:32px"><h2 style="color:#1a1a2e;margin:0 0 8px">Na vjen keq, {{clientName}}</h2><p style="color:#6b7280;margin:0 0 24px">Fatkeqesisht, rezervimi juaj per {{vehicleName}} u refuzua.</p><div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:20px;margin-bottom:24px"><p style="color:#6b7280;font-size:14px;margin:0 0 4px">Arsyeja:</p><p style="color:#dc2626;font-weight:600;font-size:14px;margin:0">{{rejectionReason}}</p></div><p style="color:#6b7280;font-size:14px;margin-bottom:20px">Mund te kerkoni automjete te tjera te disponueshme.</p><a href="{{searchUrl}}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Kerko automjete</a></div></div>',
  'Rezervimi juaj per {{vehicleName}} u refuzua. Arsyeja: {{rejectionReason}}',
  'Email njoftimi kur kompania refuzon rezervimin',
  true
),
(
  'booking_completed',
  'Rezervimi juaj perfundoi - {{vehicleName}}',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden"><div style="background:#1a1a2e;padding:24px 32px"><h1 style="color:#fff;margin:0;font-size:20px">Rezervimi Perfundoi</h1></div><div style="padding:32px"><h2 style="color:#1a1a2e;margin:0 0 8px">Faleminderit, {{clientName}}!</h2><p style="color:#6b7280;margin:0 0 24px">Rezervimi juaj per {{vehicleName}} ka perfunduar. Shpresojme qe patet nje pervojë te kendsme!</p><a href="{{searchUrl}}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Rezervo perseri</a></div></div>',
  'Rezervimi juaj per {{vehicleName}} perfundoi. Faleminderit qe perdoret RentaKar!',
  'Email njoftimi kur rezervimi perfundon',
  true
),
(
  'booking_invoice',
  'Fatura e Rezervimit - {{invoiceNumber}}',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden"><div style="background:#1a1a2e;padding:24px 32px"><h1 style="color:#fff;margin:0;font-size:20px">Fatura - {{invoiceNumber}}</h1></div><div style="padding:32px"><p style="color:#6b7280;margin:0 0 24px">I/E nderuar {{clientName}}, bashkelidhur gjeni faturen per rezervimin tuaj.</p><div style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:16px"><table style="width:100%;border-collapse:collapse"><tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Kompania</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#1a1a2e;font-size:13px">{{companyName}}</td></tr><tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Automjeti</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#1a1a2e;font-size:13px">{{vehicleName}}</td></tr><tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Periudha</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#1a1a2e;font-size:13px">{{pickupDate}} - {{returnDate}}</td></tr><tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Ditë</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#1a1a2e;font-size:13px">{{totalDays}}</td></tr><tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Cmimi/ditë</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#1a1a2e;font-size:13px">{{pricePerDay}} EUR</td></tr><tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Depozita</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#1a1a2e;font-size:13px">{{deposit}} EUR</td></tr><tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Pagesa</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#1a1a2e;font-size:13px">{{paymentMethod}}</td></tr><tr style="border-top:2px solid #e5e7eb"><td style="padding:12px 0;font-weight:700;font-size:16px;color:#1a1a2e">Totali</td><td style="padding:12px 0;text-align:right;font-weight:700;color:#2563eb;font-size:16px">{{totalPrice}} EUR</td></tr></table></div><a href="{{dashboardUrl}}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Shiko faturat e mia</a></div></div>',
  'Fatura {{invoiceNumber}} per rezervimin tuaj. Automjeti: {{vehicleName}}, Totali: {{totalPrice}} EUR.',
  'Email me faturen e rezervimit',
  true
),
(
  'welcome_client',
  'Mire se vini ne RentaKar!',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden"><div style="background:#2563eb;padding:24px 32px"><h1 style="color:#fff;margin:0;font-size:20px">Mire se vini ne RentaKar!</h1></div><div style="padding:32px"><h2 style="color:#1a1a2e;margin:0 0 8px">Pershendetje, {{clientName}}!</h2><p style="color:#6b7280;margin:0 0 24px">Llogaria juaj u krijua me sukses. Tani mund te kerkoni dhe rezervoni automjete.</p><a href="{{searchUrl}}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Shfleto automjetet</a></div></div>',
  'Mire se vini ne RentaKar, {{clientName}}!',
  'Email mireseardhje per klient te ri',
  true
),
(
  'welcome_company',
  'Mire se vini ne RentaKar - {{companyName}}',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden"><div style="background:#2563eb;padding:24px 32px"><h1 style="color:#fff;margin:0;font-size:20px">RentaKar - Partner i Ri</h1></div><div style="padding:32px"><h2 style="color:#1a1a2e;margin:0 0 8px">Mire se vini, {{companyName}}!</h2><p style="color:#6b7280;margin:0 0 24px">Kompania juaj u regjistrua me sukses. Mund te filloni duke shtuar automjetet tuaja.</p><a href="{{dashboardUrl}}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Hap dashboard-in</a></div></div>',
  'Mire se vini ne RentaKar, {{companyName}}! Filloni duke shtuar automjetet.',
  'Email mireseardhje per kompani te re',
  true
)
ON CONFLICT (template_key) DO UPDATE SET
  subject_template = EXCLUDED.subject_template,
  html_template = EXCLUDED.html_template,
  text_template = EXCLUDED.text_template,
  description = EXCLUDED.description,
  is_active = true;