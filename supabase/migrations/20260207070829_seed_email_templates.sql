/*
  # Seed Email Templates
  
  This migration seeds all email templates used throughout the platform.
  
  Templates include:
  1. booking_confirmation_client - When client creates a booking
  2. booking_confirmation_company - When company receives a new booking
  3. booking_approved - When company approves a booking
  4. booking_rejected - When company rejects a booking
  5. booking_completed - When rental is completed
  6. booking_cancelled - When booking is cancelled
  7. pickup_reminder - 24h before pickup time
  8. review_request - After booking completion
  9. company_approved - When admin approves company
  10. company_rejected - When admin rejects company
  11. company_suspended - When admin suspends company
  12. welcome_client - Welcome email for new clients
  13. welcome_company - Welcome email for new companies
  14. booking_invoice - Invoice email with payment details
*/

-- Insert all email templates
INSERT INTO email_templates (template_key, subject_template, html_template, text_template, description, is_active) VALUES

-- 1. Booking Confirmation for Client
('booking_confirmation_client', 
'Konfirmimi i Rezervimit - {{vehicleName}}',
'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
    .details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .detail-label { font-weight: bold; color: #555; }
    .footer { background: #333; color: #fff; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .total { font-size: 24px; font-weight: bold; color: #667eea; text-align: right; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Rezervimi Juaj u Konfirmua!</h1>
    </div>
    <div class="content">
      <p>Përshëndetje <strong>{{clientName}}</strong>,</p>
      <p>Faleminderit që zgjodhët shërbimin tonë! Rezervimi juaj është regjistruar me sukses dhe është në pritje të aprovimit nga kompania.</p>
      
      <div class="details">
        <h3 style="margin-top: 0; color: #667eea;">Detajet e Rezervimit</h3>
        <div class="detail-row">
          <span class="detail-label">Numri i Rezervimit:</span>
          <span>{{bookingId}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Automjeti:</span>
          <span>{{vehicleName}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Kompania:</span>
          <span>{{companyName}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Data e Marrjes:</span>
          <span>{{pickupDate}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Data e Kthimit:</span>
          <span>{{returnDate}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Ditë Gjithsej:</span>
          <span>{{totalDays}} ditë</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Çmimi për Ditë:</span>
          <span>{{pricePerDay}} EUR</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Depozitë:</span>
          <span>{{deposit}} EUR</span>
        </div>
        <div class="detail-row" style="border-bottom: none;">
          <span class="detail-label">Metoda e Pagesës:</span>
          <span>{{paymentMethod}}</span>
        </div>
        <div class="total">
          Total: {{totalPrice}} EUR
        </div>
      </div>

      <p><strong>Statusi:</strong> {{status}}</p>
      <p>Do të merrni një njoftim tjetër sapo kompania të aprovoje rezervimin tuaj.</p>
      
      <center>
        <a href="{{dashboardUrl}}" class="button">Shiko Rezervimin</a>
      </center>
    </div>
    <div class="footer">
      <p>© 2024 Car Rental Platform. Të gjitha të drejtat e rezervuara.</p>
      <p>Nëse keni pyetje, na kontaktoni në {{supportEmail}}</p>
    </div>
  </div>
</body>
</html>',
'Përshëndetje {{clientName}},

Faleminderit që zgjodhët shërbimin tonë! Rezervimi juaj është regjistruar me sukses.

DETAJET E REZERVIMIT
--------------------
Numri: {{bookingId}}
Automjeti: {{vehicleName}}
Kompania: {{companyName}}
Data e Marrjes: {{pickupDate}}
Data e Kthimit: {{returnDate}}
Ditë Gjithsej: {{totalDays}} ditë
Çmimi për Ditë: {{pricePerDay}} EUR
Depozitë: {{deposit}} EUR
Metoda e Pagesës: {{paymentMethod}}
Total: {{totalPrice}} EUR

Statusi: {{status}}

Do të merrni një njoftim tjetër sapo kompania të aprovoje rezervimin tuaj.

Shiko rezervimin: {{dashboardUrl}}

© 2024 Car Rental Platform',
'Confirmation email sent to client after booking creation',
true),

-- 2. Booking Notification for Company
('booking_confirmation_company',
'Rezervim i Ri - {{vehicleName}}',
'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
    .details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #f5576c; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .detail-label { font-weight: bold; color: #555; }
    .footer { background: #333; color: #fff; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚗 Rezervim i Ri!</h1>
    </div>
    <div class="content">
      <p>Përshëndetje <strong>{{companyName}}</strong>,</p>
      <p>Keni marrë një rezervim të ri për automjetin tuaj!</p>
      
      <div class="alert">
        <strong>⚠️ Veprim i Nevojshëm:</strong> Ju lutemi shqyrtoni dhe aprovoni ose refuzoni këtë rezervim sa më shpejt.
      </div>

      <div class="details">
        <h3 style="margin-top: 0; color: #f5576c;">Detajet e Rezervimit</h3>
        <div class="detail-row">
          <span class="detail-label">Numri i Rezervimit:</span>
          <span>{{bookingId}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Automjeti:</span>
          <span>{{vehicleName}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Klienti:</span>
          <span>{{clientName}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email i Klientit:</span>
          <span>{{clientEmail}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Telefon:</span>
          <span>{{clientPhone}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Data e Marrjes:</span>
          <span>{{pickupDate}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Data e Kthimit:</span>
          <span>{{returnDate}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Ditë Gjithsej:</span>
          <span>{{totalDays}} ditë</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Total:</span>
          <span><strong>{{totalPrice}} EUR</strong></span>
        </div>
        <div class="detail-row" style="border-bottom: none;">
          <span class="detail-label">Metoda e Pagesës:</span>
          <span>{{paymentMethod}}</span>
        </div>
      </div>

      <center>
        <a href="{{dashboardUrl}}" class="button">Shqyrtoje Rezervimin</a>
      </center>
    </div>
    <div class="footer">
      <p>© 2024 Car Rental Platform. Të gjitha të drejtat e rezervuara.</p>
    </div>
  </div>
</body>
</html>',
'Përshëndetje {{companyName}},

Keni marrë një rezervim të ri!

DETAJET E REZERVIMIT
--------------------
Numri: {{bookingId}}
Automjeti: {{vehicleName}}
Klienti: {{clientName}}
Email: {{clientEmail}}
Telefon: {{clientPhone}}
Data e Marrjes: {{pickupDate}}
Data e Kthimit: {{returnDate}}
Ditë Gjithsej: {{totalDays}} ditë
Total: {{totalPrice}} EUR
Metoda e Pagesës: {{paymentMethod}}

⚠️ Ju lutemi shqyrtoni dhe aprovoni ose refuzoni këtë rezervim sa më shpejt.

Shqyrtoje rezervimin: {{dashboardUrl}}

© 2024 Car Rental Platform',
'Notification sent to company when new booking is created',
true),

-- 3. Booking Approved
('booking_approved',
'Rezervimi Juaj u Aprovua! - {{vehicleName}}',
'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
    .details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #38ef7d; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .detail-label { font-weight: bold; color: #555; }
    .footer { background: #333; color: #fff; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 12px 30px; background: #38ef7d; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 5px; color: #155724; }
    .instructions { background: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Rezervimi u Aprovua!</h1>
    </div>
    <div class="content">
      <p>Përshëndetje <strong>{{clientName}}</strong>,</p>
      
      <div class="success-box">
        <strong>✓ Lajme të Mira!</strong> Rezervimi juaj u aprovua nga kompania <strong>{{companyName}}</strong>.
      </div>

      <div class="details">
        <h3 style="margin-top: 0; color: #38ef7d;">Detajet e Rezervimit</h3>
        <div class="detail-row">
          <span class="detail-label">Numri i Rezervimit:</span>
          <span>{{bookingId}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Automjeti:</span>
          <span>{{vehicleName}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Data e Marrjes:</span>
          <span>{{pickupDate}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Data e Kthimit:</span>
          <span>{{returnDate}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Lokacioni i Marrjes:</span>
          <span>{{pickupLocation}}</span>
        </div>
        <div class="detail-row" style="border-bottom: none;">
          <span class="detail-label">Total për Paguar:</span>
          <span><strong>{{totalPrice}} EUR</strong></span>
        </div>
      </div>

      <div class="instructions">
        <h4 style="margin-top: 0;">📋 Hapat e Ardhshëm:</h4>
        <ol>
          <li>Sigurohuni që të keni patentën tuaj të vlefshme</li>
          <li>Merrni me vete një kartë identiteti</li>
          <li>Arrini në kohë në lokacionin e marrjes</li>
          <li>Kompania do t''ju kontaktojë për detaje të tjera</li>
        </ol>
      </div>

      <p><strong>Informacioni i Kontaktit të Kompanisë:</strong><br>
      Email: {{companyEmail}}<br>
      Telefon: {{companyPhone}}</p>
      
      <center>
        <a href="{{dashboardUrl}}" class="button">Shiko Rezervimin</a>
      </center>
    </div>
    <div class="footer">
      <p>© 2024 Car Rental Platform. Të gjitha të drejtat e rezervuara.</p>
      <p>Nëse keni pyetje, na kontaktoni në {{supportEmail}}</p>
    </div>
  </div>
</body>
</html>',
'Përshëndetje {{clientName}},

🎉 LAJME TË MIRA! Rezervimi juaj u aprovua nga {{companyName}}.

DETAJET E REZERVIMIT
--------------------
Numri: {{bookingId}}
Automjeti: {{vehicleName}}
Data e Marrjes: {{pickupDate}}
Data e Kthimit: {{returnDate}}
Lokacioni: {{pickupLocation}}
Total: {{totalPrice}} EUR

HAPAT E ARDHSHËM:
1. Sigurohuni që të keni patentën tuaj të vlefshme
2. Merrni me vete një kartë identiteti
3. Arrini në kohë në lokacionin e marrjes
4. Kompania do t''ju kontaktojë për detaje të tjera

INFORMACIONI I KONTAKTIT:
Email: {{companyEmail}}
Telefon: {{companyPhone}}

Shiko rezervimin: {{dashboardUrl}}

© 2024 Car Rental Platform',
'Email sent to client when company approves their booking',
true),

-- 4. Booking Rejected
('booking_rejected',
'Rezervimi Nuk u Aprovua - {{vehicleName}}',
'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
    .details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #fc4a1a; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .detail-label { font-weight: bold; color: #555; }
    .footer { background: #333; color: #fff; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Rezervimi Nuk u Aprovua</h1>
    </div>
    <div class="content">
      <p>Përshëndetje <strong>{{clientName}}</strong>,</p>
      
      <div class="warning-box">
        Na vjen keq, por rezervimi juaj për <strong>{{vehicleName}}</strong> nuk u aprovua nga kompania.
      </div>

      <div class="details">
        <h3 style="margin-top: 0; color: #fc4a1a;">Detajet e Rezervimit</h3>
        <div class="detail-row">
          <span class="detail-label">Numri i Rezervimit:</span>
          <span>{{bookingId}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Automjeti:</span>
          <span>{{vehicleName}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Data e Marrjes:</span>
          <span>{{pickupDate}}</span>
        </div>
        <div class="detail-row" style="border-bottom: none;">
          <span class="detail-label">Data e Kthimit:</span>
          <span>{{returnDate}}</span>
        </div>
      </div>

      <p><strong>Arsyeja:</strong> {{rejectionReason}}</p>

      <p>Mos u shqetësoni! Kemi shumë automjete të tjera të disponueshme që mund t''ju pëlqejnë.</p>
      
      <center>
        <a href="{{searchUrl}}" class="button">Shfleto Automjete të Tjera</a>
      </center>
    </div>
    <div class="footer">
      <p>© 2024 Car Rental Platform. Të gjitha të drejtat e rezervuara.</p>
      <p>Nëse keni pyetje, na kontaktoni në {{supportEmail}}</p>
    </div>
  </div>
</body>
</html>',
'Përshëndetje {{clientName}},

Na vjen keq, por rezervimi juaj për {{vehicleName}} nuk u aprovua nga kompania.

DETAJET
-------
Numri: {{bookingId}}
Automjeti: {{vehicleName}}
Data e Marrjes: {{pickupDate}}
Data e Kthimit: {{returnDate}}

Arsyeja: {{rejectionReason}}

Mos u shqetësoni! Kemi shumë automjete të tjera të disponueshme.

Shfleto automjete: {{searchUrl}}

© 2024 Car Rental Platform',
'Email sent to client when company rejects their booking',
true),

-- 5. Booking Completed
('booking_completed',
'Faleminderit për Qiranë - {{vehicleName}}',
'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
    .details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .footer { background: #333; color: #fff; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
    .thank-you { text-align: center; font-size: 24px; color: #667eea; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Qiraja u Përfundua</h1>
    </div>
    <div class="content">
      <p>Përshëndetje <strong>{{clientName}}</strong>,</p>
      
      <div class="thank-you">
        🎉 Faleminderit që zgjodhët shërbimin tonë!
      </div>

      <p>Qiraja juaj për <strong>{{vehicleName}}</strong> u përfundua me sukses. Shpresojmë që të keni pasur një përvojë të këndshme!</p>

      <div class="details">
        <h3 style="margin-top: 0;">Detajet e Qirasë</h3>
        <p><strong>Numri i Rezervimit:</strong> {{bookingId}}<br>
        <strong>Data e Marrjes:</strong> {{pickupDate}}<br>
        <strong>Data e Kthimit:</strong> {{returnDate}}<br>
        <strong>Automjeti:</strong> {{vehicleName}}</p>
      </div>

      <p>Mendimi juaj është shumë i rëndësishëm për ne! A do të doninit të ndani përvojën tuaj?</p>
      
      <center>
        <a href="{{reviewUrl}}" class="button">Lëre një Vlerësim</a>
        <a href="{{searchUrl}}" class="button">Qiraje Përsëri</a>
      </center>
    </div>
    <div class="footer">
      <p>© 2024 Car Rental Platform. Të gjitha të drejtat e rezervuara.</p>
      <p>Shpresojmë t''ju shohim sërish së shpejti!</p>
    </div>
  </div>
</body>
</html>',
'Përshëndetje {{clientName}},

Qiraja juaj për {{vehicleName}} u përfundua me sukses!

DETAJET
-------
Numri: {{bookingId}}
Data e Marrjes: {{pickupDate}}
Data e Kthimit: {{returnDate}}

Faleminderit që zgjodhët shërbimin tonë!

Mendimi juaj është i rëndësishëm për ne. Lëre një vlerësim: {{reviewUrl}}

© 2024 Car Rental Platform',
'Email sent when rental is completed',
true),

-- 6. Booking Cancelled
('booking_cancelled',
'Rezervimi u Anulua - {{vehicleName}}',
'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #868f96 0%, #596164 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
    .details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .footer { background: #333; color: #fff; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Rezervimi u Anulua</h1>
    </div>
    <div class="content">
      <p>Përshëndetje <strong>{{clientName}}</strong>,</p>
      
      <p>Rezervimi juaj për <strong>{{vehicleName}}</strong> është anuluar me sukses.</p>

      <div class="details">
        <h3 style="margin-top: 0;">Detajet</h3>
        <p><strong>Numri i Rezervimit:</strong> {{bookingId}}<br>
        <strong>Automjeti:</strong> {{vehicleName}}<br>
        <strong>Data e Anulimit:</strong> {{cancelDate}}</p>
      </div>

      <p>Nëse keni anuluar gabimisht, ose dëshironi të rezervoni sërish, ju lutemi vizitoni faqen tonë.</p>
      
      <center>
        <a href="{{searchUrl}}" class="button">Shfleto Automjete</a>
      </center>
    </div>
    <div class="footer">
      <p>© 2024 Car Rental Platform. Të gjitha të drejtat e rezervuara.</p>
    </div>
  </div>
</body>
</html>',
'Përshëndetje {{clientName}},

Rezervimi juaj për {{vehicleName}} është anuluar me sukses.

DETAJET
-------
Numri: {{bookingId}}
Data e Anulimit: {{cancelDate}}

Shfleto automjete: {{searchUrl}}

© 2024 Car Rental Platform',
'Email sent when booking is cancelled',
true),

-- 7. Pickup Reminder (24h before)
('pickup_reminder',
'Kujtesë: Marrja e Automjetit Nesër - {{vehicleName}}',
'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
    .details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #4facfe; }
    .checklist { background: #e7f3ff; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .footer { background: #333; color: #fff; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 12px 30px; background: #4facfe; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Kujtesë: Marrja Nesër!</h1>
    </div>
    <div class="content">
      <p>Përshëndetje <strong>{{clientName}}</strong>,</p>
      
      <p>Ky është një kujtesë se qiraja juaj fillon <strong>nesër</strong>!</p>

      <div class="details">
        <h3 style="margin-top: 0; color: #4facfe;">Detajet e Marrjes</h3>
        <p><strong>Data & Ora:</strong> {{pickupDate}} {{pickupTime}}<br>
        <strong>Lokacioni:</strong> {{pickupLocation}}<br>
        <strong>Automjeti:</strong> {{vehicleName}}<br>
        <strong>Kompania:</strong> {{companyName}}<br>
        <strong>Telefon Kompanisë:</strong> {{companyPhone}}</p>
      </div>

      <div class="checklist">
        <h4 style="margin-top: 0;">✓ Lista e Kontrollimit:</h4>
        <ul style="list-style: none; padding-left: 0;">
          <li>☐ Patentë e vlefshme</li>
          <li>☐ Kartë identiteti</li>
          <li>☐ Depozita ({{deposit}} EUR)</li>
          <li>☐ Metoda e pagesës e gatshme</li>
          <li>☐ Konfirmimi i rezervimit ({{bookingId}})</li>
        </ul>
      </div>

      <p><strong>💡 Këshillë:</strong> Arrini 10-15 minuta më herët për të përfunduar dokumentacionin.</p>
      
      <center>
        <a href="{{dashboardUrl}}" class="button">Shiko Detajet</a>
      </center>
    </div>
    <div class="footer">
      <p>© 2024 Car Rental Platform. Të gjitha të drejtat e rezervuara.</p>
      <p>Udhëtim të mbarë! 🚗</p>
    </div>
  </div>
</body>
</html>',
'Përshëndetje {{clientName}},

⏰ KUJTESË: Qiraja juaj fillon NESËR!

DETAJET E MARRJES
-----------------
Data & Ora: {{pickupDate}} {{pickupTime}}
Lokacioni: {{pickupLocation}}
Automjeti: {{vehicleName}}
Kompania: {{companyName}}
Telefon: {{companyPhone}}

LISTA E KONTROLLIMIT:
☐ Patentë e vlefshme
☐ Kartë identiteti
☐ Depozita ({{deposit}} EUR)
☐ Metoda e pagesës
☐ Konfirmimi ({{bookingId}})

Arrini 10-15 minuta më herët!

Shiko detajet: {{dashboardUrl}}

Udhëtim të mbarë! 🚗

© 2024 Car Rental Platform',
'Reminder sent 24 hours before pickup time',
true),

-- 8. Review Request
('review_request',
'Si ishte përvoja juaj? Lëre një Vlerësim',
'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
    .footer { background: #333; color: #fff; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .stars { text-align: center; font-size: 48px; margin: 30px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Ndani Përvojën Tuaj</h1>
    </div>
    <div class="content">
      <p>Përshëndetje <strong>{{clientName}}</strong>,</p>
      
      <p>Faleminderit që përdorët shërbimin tonë për qiranë e <strong>{{vehicleName}}</strong>!</p>

      <div class="stars">⭐⭐⭐⭐⭐</div>

      <p style="text-align: center; font-size: 18px;">Si ishte përvoja juaj?</p>

      <p>Mendimi juaj na ndihmon të përmirësohemi dhe ndihmon klientë të tjerë të bëjnë zgjedhjen e duhur. Ju lutemi merrni një moment për të ndarë përvojën tuaj.</p>
      
      <center>
        <a href="{{reviewUrl}}" class="button">Lëre një Vlerësim</a>
      </center>

      <p style="text-align: center; color: #888; font-size: 14px;">Merr vetëm 1 minutë ⏱️</p>
    </div>
    <div class="footer">
      <p>© 2024 Car Rental Platform. Të gjitha të drejtat e rezervuara.</p>
      <p>Faleminderit për mbështetjen tuaj! 💙</p>
    </div>
  </div>
</body>
</html>',
'Përshëndetje {{clientName}},

Faleminderit që përdorët shërbimin tonë për {{vehicleName}}!

⭐⭐⭐⭐⭐

Si ishte përvoja juaj?

Mendimi juaj na ndihmon të përmirësohemi dhe ndihmon klientë të tjerë të bëjnë zgjedhjen e duhur.

Lëre një vlerësim: {{reviewUrl}}

(Merr vetëm 1 minutë)

© 2024 Car Rental Platform',
'Request for review sent after booking completion',
true),

-- 9. Company Approved
('company_approved',
'Lajme të Mira! Kompania Juaj u Aprovua',
'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
    .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .next-steps { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #38ef7d; }
    .footer { background: #333; color: #fff; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 12px 30px; background: #38ef7d; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Mirë se vini në Platformë!</h1>
    </div>
    <div class="content">
      <p>Përshëndetje <strong>{{companyName}}</strong>,</p>
      
      <div class="success-box">
        <h3 style="margin-top: 0;">✓ Kompania Juaj u Aprovua!</h3>
        <p>Jemi të kënaqur t''ju njoftojmë që aplikimi juaj është aprovuar. Tani mund të filloni të shtoni automjete dhe të pranoni rezervime!</p>
      </div>

      <div class="next-steps">
        <h3 style="margin-top: 0; color: #38ef7d;">Hapat e Ardhshëm:</h3>
        <ol>
          <li><strong>Plotësoni Profilin Tuaj</strong> - Shtoni informacion për kompaninë tuaj</li>
          <li><strong>Shtoni Automjete</strong> - Filloni të listoni automjetet tuaja</li>
          <li><strong>Vendosni Çmimet</strong> - Përcaktoni çmimet për çdo automjet</li>
          <li><strong>Aktivizoni Listimin</strong> - Bëni automjetet tuaja të dukshme për klientët</li>
          <li><strong>Menaxhoni Rezervimet</strong> - Filloni të pranoni rezervime</li>
        </ol>
      </div>

      <p>Nëse keni pyetje ose keni nevojë për ndihmë, ekipi ynë i mbështetjes është këtu për t''ju ndihmuar.</p>
      
      <center>
        <a href="{{dashboardUrl}}" class="button">Hyrni në Dashboard</a>
      </center>
    </div>
    <div class="footer">
      <p>© 2024 Car Rental Platform. Të gjitha të drejtat e rezervuara.</p>
      <p>Email Mbështetje: {{supportEmail}} | Telefon: {{supportPhone}}</p>
    </div>
  </div>
</body>
</html>',
'Përshëndetje {{companyName}},

🎉 LAJME TË MIRA! Kompania juaj u aprovua!

Tani mund të filloni të shtoni automjete dhe të pranoni rezervime.

HAPAT E ARDHSHËM:
1. Plotësoni profilin tuaj
2. Shtoni automjete
3. Vendosni çmimet
4. Aktivizoni listimin
5. Menaxhoni rezervimet

Hyrni në dashboard: {{dashboardUrl}}

Mbështetje: {{supportEmail}} | {{supportPhone}}

© 2024 Car Rental Platform',
'Email sent when admin approves a company',
true),

-- 10. Company Rejected
('company_rejected',
'Aplikimi Juaj për Kompani',
'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
    .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .footer { background: #333; color: #fff; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Aplikimi Juaj për Kompani</h1>
    </div>
    <div class="content">
      <p>Përshëndetje <strong>{{companyName}}</strong>,</p>
      
      <div class="warning-box">
        <p>Na vjen keq, por aplikimi juaj për t''u regjistruar si kompani në platformën tonë nuk është aprovuar në këtë moment.</p>
      </div>

      <p><strong>Arsyeja:</strong> {{rejectionReason}}</p>

      <p>Nëse besoni se kjo është një gabim ose dëshironi të diskutoni më tej, ju lutemi na kontaktoni direkt.</p>
      
      <center>
        <a href="mailto:{{supportEmail}}" class="button">Na Kontaktoni</a>
      </center>
    </div>
    <div class="footer">
      <p>© 2024 Car Rental Platform. Të gjitha të drejtat e rezervuara.</p>
      <p>Email: {{supportEmail}} | Telefon: {{supportPhone}}</p>
    </div>
  </div>
</body>
</html>',
'Përshëndetje {{companyName}},

Na vjen keq, por aplikimi juaj për kompani nuk është aprovuar.

ARSYEJA:
{{rejectionReason}}

Nëse keni pyetje, na kontaktoni në:
Email: {{supportEmail}}
Telefon: {{supportPhone}}

© 2024 Car Rental Platform',
'Email sent when admin rejects a company application',
true),

-- 11. Company Suspended
('company_suspended',
'Njoftim: Akaunti Juaj është Pezulluar',
'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ed213a 0%, #93291e 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
    .alert-box { background: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; margin: 20px 0; border-radius: 5px; color: #721c24; }
    .footer { background: #333; color: #fff; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 12px 30px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Akaunti i Pezulluar</h1>
    </div>
    <div class="content">
      <p>Përshëndetje <strong>{{companyName}}</strong>,</p>
      
      <div class="alert-box">
        <h3 style="margin-top: 0;">Akaunti Juaj është Pezulluar</h3>
        <p>Akaunti i kompanisë suaj është pezulluar përkohësisht. Gjatë kësaj kohe, nuk do të mund të merrni rezervime të reja.</p>
      </div>

      <p><strong>Arsyeja e Pezullimit:</strong> {{suspensionReason}}</p>

      <p><strong>Çfarë Ndodh Tani?</strong></p>
      <ul>
        <li>Rezervimet ekzistuese do të vazhdojnë normalisht</li>
        <li>Nuk mund të shtoni automjete të reja</li>
        <li>Listimi juaj nuk do të jetë i dukshëm për klientët</li>
      </ul>

      <p>Për të diskutuar këtë pezullim ose për të marrë informacion se si të rivendoseni, ju lutemi na kontaktoni menjëherë.</p>
      
      <center>
        <a href="mailto:{{supportEmail}}" class="button">Kontaktoni Mbështetjen</a>
      </center>
    </div>
    <div class="footer">
      <p>© 2024 Car Rental Platform. Të gjitha të drejtat e rezervuara.</p>
      <p>Email: {{supportEmail}} | Telefon: {{supportPhone}}</p>
    </div>
  </div>
</body>
</html>',
'Përshëndetje {{companyName}},

⚠️ AKAUNTI I PEZULLUAR

Akaunti i kompanisë suaj është pezulluar përkohësisht.

ARSYEJA:
{{suspensionReason}}

ÇFARË NDODH TANI:
- Rezervimet ekzistuese vazhdojnë normalisht
- Nuk mund të shtoni automjete të reja
- Listimi nuk është i dukshëm

Kontaktoni mbështetjen:
Email: {{supportEmail}}
Telefon: {{supportPhone}}

© 2024 Car Rental Platform',
'Email sent when admin suspends a company',
true),

-- 12. Welcome Client
('welcome_client',
'Mirë se Vini në Platformën Tonë!',
'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
    .features { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .feature-item { padding: 15px 0; border-bottom: 1px solid #eee; }
    .footer { background: #333; color: #fff; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚗 Mirë se Vini!</h1>
    </div>
    <div class="content">
      <p>Përshëndetje <strong>{{clientName}}</strong>,</p>
      
      <p>Mirë se vini në platformën tonë të qirasë së automjeteve! Jemi të lumtur që jeni këtu.</p>

      <div class="features">
        <h3 style="margin-top: 0; color: #667eea;">Çfarë Mund të Bëni:</h3>
        
        <div class="feature-item">
          <strong>🔍 Kërkoni Automjete</strong><br>
          Gjeni automjetin perfekt nga mijëra opsione të disponueshme.
        </div>
        
        <div class="feature-item">
          <strong>📅 Rezervoni Lehtë</strong><br>
          Rezervoni në vetëm disa klikime dhe merrni konfirmim të menjëhershëm.
        </div>
        
        <div class="feature-item">
          <strong>💳 Pagesa të Sigurta</strong><br>
          Zgjidhni nga metoda të ndryshme pagese - Stripe, PayPal, bankë ose cash.
        </div>
        
        <div class="feature-item" style="border-bottom: none;">
          <strong>⭐ Vlerësimet</strong><br>
          Lexoni vlerësimet nga klientë të tjerë dhe ndani përvojën tuaj.
        </div>
      </div>

      <p style="text-align: center;">Gati për t''u nisur?</p>
      
      <center>
        <a href="{{searchUrl}}" class="button">Shfleto Automjetet</a>
      </center>
    </div>
    <div class="footer">
      <p>© 2024 Car Rental Platform. Të gjitha të drejtat e rezervuara.</p>
      <p>Nëse keni pyetje, na kontaktoni në {{supportEmail}}</p>
    </div>
  </div>
</body>
</html>',
'Përshëndetje {{clientName}},

Mirë se vini në platformën tonë të qirasë së automjeteve!

ÇFARË MUND TË BËNI:

🔍 Kërkoni Automjete
Gjeni automjetin perfekt nga mijëra opsione.

📅 Rezervoni Lehtë
Rezervoni në vetëm disa klikime.

💳 Pagesa të Sigurta
Zgjidhni nga metoda të ndryshme pagese.

⭐ Vlerësimet
Lexoni dhe ndani përvojat.

Shfleto automjetet: {{searchUrl}}

© 2024 Car Rental Platform',
'Welcome email sent to new clients after registration',
true),

-- 13. Welcome Company
('welcome_company',
'Mirë se Vini - Filloni të Qirani Automjetet Tuaja!',
'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
    .info-box { background: #e7f3ff; border-left: 4px solid #2196F3; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .steps { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .footer { background: #333; color: #fff; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Mirë se Vini, Partneri Ynë!</h1>
    </div>
    <div class="content">
      <p>Përshëndetje <strong>{{companyName}}</strong>,</p>
      
      <p>Faleminderit që aplikuat për t''u bashkuar me platformën tonë! Aplikimi juaj po shqyrtohet nga ekipi ynë.</p>

      <div class="info-box">
        <strong>ℹ️ Çfarë Ndodh Tani?</strong><br>
        Ekipi ynë do të shqyrtojë aplikimin tuaj brenda 1-2 ditëve të punës. Do të merrni një njoftim sapo akaunti juaj të aprovohet.
      </div>

      <div class="steps">
        <h3 style="margin-top: 0; color: #f5576c;">Përgatituni për Sukses:</h3>
        <ol>
          <li>Sigurohuni që informacioni i kompanisë është i plotë</li>
          <li>Përgatitni foto të cilësisë së lartë të automjeteve tuaja</li>
          <li>Përcaktoni çmimet konkurruese</li>
          <li>Shkruani përshkrime tërheqëse për automjetet</li>
          <li>Vendosni politikat e qirasë së kompanisë suaj</li>
        </ol>
      </div>

      <p>Sapo të aprovoheni, do të mund të filloni të shtoni automjetet tuaja dhe të pranoni rezervime!</p>
      
      <center>
        <a href="{{dashboardUrl}}" class="button">Shkoni te Dashboard</a>
      </center>
    </div>
    <div class="footer">
      <p>© 2024 Car Rental Platform. Të gjitha të drejtat e rezervuara.</p>
      <p>Mbështetje: {{supportEmail}} | {{supportPhone}}</p>
    </div>
  </div>
</body>
</html>',
'Përshëndetje {{companyName}},

Faleminderit që aplikuat në platformën tonë!

ÇFARË NDODH TANI?
Ekipi ynë do të shqyrtojë aplikimin tuaj brenda 1-2 ditëve. Do të merrni njoftim sapo të aprovoheni.

PËRGATITUNI PËR SUKSES:
1. Sigurohuni që informacioni është i plotë
2. Përgatitni foto të cilësisë së lartë
3. Përcaktoni çmimet konkurruese
4. Shkruani përshkrime tërheqëse
5. Vendosni politikat e qirasë

Dashboard: {{dashboardUrl}}

Mbështetje: {{supportEmail}}

© 2024 Car Rental Platform',
'Welcome email sent to new companies after registration',
true),

-- 14. Booking Invoice
('booking_invoice',
'Fatura - Rezervimi #{{bookingId}}',
'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
    .invoice { background: white; padding: 30px; margin: 20px 0; border-radius: 8px; border: 2px solid #667eea; }
    .invoice-header { border-bottom: 2px solid #667eea; padding-bottom: 15px; margin-bottom: 20px; }
    .invoice-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .invoice-total { font-size: 24px; font-weight: bold; color: #667eea; text-align: right; margin-top: 20px; padding-top: 20px; border-top: 3px solid #667eea; }
    .footer { background: #333; color: #fff; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📄 Fatura e Qirasë</h1>
    </div>
    <div class="content">
      <div class="invoice">
        <div class="invoice-header">
          <h2 style="margin: 0; color: #667eea;">FATURË</h2>
          <p style="margin: 5px 0;"><strong>Numri:</strong> {{bookingId}}<br>
          <strong>Data:</strong> {{invoiceDate}}</p>
        </div>

        <div style="margin: 20px 0;">
          <p><strong>Klienti:</strong><br>
          {{clientName}}<br>
          {{clientEmail}}<br>
          {{clientPhone}}</p>

          <p><strong>Kompania:</strong><br>
          {{companyName}}<br>
          {{companyEmail}}<br>
          {{companyPhone}}</p>
        </div>

        <h3 style="color: #667eea; border-bottom: 1px solid #eee; padding-bottom: 10px;">Detajet e Qirasë</h3>
        
        <div class="invoice-row">
          <span>Automjeti:</span>
          <span><strong>{{vehicleName}}</strong></span>
        </div>
        <div class="invoice-row">
          <span>Data e Marrjes:</span>
          <span>{{pickupDate}}</span>
        </div>
        <div class="invoice-row">
          <span>Data e Kthimit:</span>
          <span>{{returnDate}}</span>
        </div>
        <div class="invoice-row">
          <span>Ditë Gjithsej:</span>
          <span>{{totalDays}} ditë</span>
        </div>
        <div class="invoice-row">
          <span>Çmimi për Ditë:</span>
          <span>{{pricePerDay}} EUR</span>
        </div>
        <div class="invoice-row">
          <span>Nëntotal:</span>
          <span>{{subtotal}} EUR</span>
        </div>
        <div class="invoice-row">
          <span>Depozitë (e kthyeshme):</span>
          <span>{{deposit}} EUR</span>
        </div>
        <div class="invoice-row" style="border-bottom: none;">
          <span>Metoda e Pagesës:</span>
          <span>{{paymentMethod}}</span>
        </div>

        <div class="invoice-total">
          TOTAL: {{totalPrice}} EUR
        </div>

        <p style="margin-top: 30px; font-size: 12px; color: #666;">
          <strong>Shënime:</strong><br>
          - Depozita do të kthehet pas inspektimit të automjetit<br>
          - Ju lutemi arrini 15 minuta para kohës së caktuar<br>
          - Merrni me vete patentë të vlefshme dhe kartë identiteti
        </p>
      </div>

      <center>
        <a href="{{invoiceUrl}}" class="button">Shkarko Faturën (PDF)</a>
      </center>
    </div>
    <div class="footer">
      <p>© 2024 Car Rental Platform. Të gjitha të drejtat e rezervuara.</p>
      <p>Për pyetje: {{supportEmail}} | {{supportPhone}}</p>
    </div>
  </div>
</body>
</html>',
'FATURË
------
Numri: {{bookingId}}
Data: {{invoiceDate}}

KLIENTI:
{{clientName}}
{{clientEmail}}
{{clientPhone}}

KOMPANIA:
{{companyName}}
{{companyEmail}}
{{companyPhone}}

DETAJET E QIRASË
----------------
Automjeti: {{vehicleName}}
Data e Marrjes: {{pickupDate}}
Data e Kthimit: {{returnDate}}
Ditë Gjithsej: {{totalDays}} ditë
Çmimi për Ditë: {{pricePerDay}} EUR
Nëntotal: {{subtotal}} EUR
Depozitë: {{deposit}} EUR
Metoda e Pagesës: {{paymentMethod}}

TOTAL: {{totalPrice}} EUR

SHËNIME:
- Depozita do të kthehet pas inspektimit
- Arrini 15 minuta para kohës
- Merrni patentë dhe kartë identiteti

Shkarko faturën: {{invoiceUrl}}

© 2024 Car Rental Platform',
'Invoice email sent after booking confirmation',
true)

ON CONFLICT (template_key) DO NOTHING;