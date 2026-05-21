/* Add comprehensive translations for new components + missing keys.
   Run: node scripts/add-translations-v2.cjs */
const fs = require('node:fs');
const path = require('node:path');

const sq = require(path.join(__dirname, '..', 'src/i18n/locales/sq.json'));
const en = require(path.join(__dirname, '..', 'src/i18n/locales/en.json'));
const de = require(path.join(__dirname, '..', 'src/i18n/locales/de.json'));

const T = (s, e, d) => ({ sq: s, en: e, de: d });

const additions = {
  common: {
    cancel: T('Anulo', 'Cancel', 'Abbrechen'),
    save: T('Ruaj', 'Save', 'Speichern'),
    saved: T('U ruajt', 'Saved', 'Gespeichert'),
    saving: T('Duke ruajtur...', 'Saving...', 'Speichert...'),
    delete: T('Fshi', 'Delete', 'Löschen'),
    remove: T('Hiq', 'Remove', 'Entfernen'),
    uploading: T('Duke ngarkuar...', 'Uploading...', 'Lädt hoch...'),
    authorizing: T('Duke autorizuar...', 'Authorizing...', 'Autorisiert...'),
    understood: T('E kuptova', 'Got it', 'Verstanden'),
    error: T('Gabim', 'Error', 'Fehler'),
    edit: T('Ndrysho', 'Edit', 'Bearbeiten'),
    confirm: T('Konfirmo', 'Confirm', 'Bestätigen'),
    close: T('Mbyll', 'Close', 'Schließen'),
  },
  nav: {
    home: T('Ballina', 'Home', 'Startseite'),
    vehicles: T('Veturat', 'Vehicles', 'Fahrzeuge'),
    bookings: T('Rezervime', 'Bookings', 'Buchungen'),
    about: T('Rreth', 'About', 'Über'),
    dashboard: T('Paneli', 'Dashboard', 'Dashboard'),
    companies: T('Kompani', 'Companies', 'Unternehmen'),
    settings: T('Cilësimet', 'Settings', 'Einstellungen'),
  },
  time: {
    justNow: T('tani', 'just now', 'gerade eben'),
    minutesAgo: T('{{count}} min', '{{count}} min', '{{count}} Min'),
    hoursAgo: T('{{count}} orë', '{{count}}h', '{{count}} Std'),
    daysAgo: T('{{count}} ditë', '{{count}}d', '{{count}} T'),
  },
  notifications: {
    title: T('Njoftime', 'Notifications', 'Benachrichtigungen'),
    markAllRead: T('Shëno të gjitha si lexuara', 'Mark all as read', 'Alle als gelesen markieren'),
    empty: T("S'ka njoftime", 'No notifications', 'Keine Benachrichtigungen'),
    markRead: T('Shëno si lexuar', 'Mark as read', 'Als gelesen markieren'),
    goDashboard: T('Shko te dashboardi', 'Go to dashboard', 'Zum Dashboard'),
  },
  calendar: {
    selected: T('Të zgjedhura', 'Selected', 'Ausgewählt'),
    booked: T('Të zëna', 'Booked', 'Belegt'),
    pastDate: T('Datë e kaluar', 'Past date', 'Vergangenes Datum'),
    selectPickup: T('Klikoni ditën e marrjes', 'Click to select pickup day', 'Abholtag wählen'),
    selectReturn: T('Klikoni ditën e kthimit', 'Click to select return day', 'Rückgabetag wählen'),
    clear: T('Pastro', 'Clear', 'Löschen'),
  },
  uploader: {
    emptyText: T('Kliko për të ngarkuar një imazh', 'Click to upload an image', 'Klicken zum Hochladen'),
    sizeTooLarge: T('Imazhi tejkalon {{max}} MB', 'Image exceeds {{max}} MB', 'Bild überschreitet {{max}} MB'),
    invalidType: T('Lloj i palejuar (vetëm JPG/PNG/WebP)', 'Invalid type (only JPG/PNG/WebP)', 'Ungültiger Typ (nur JPG/PNG/WebP)'),
    change: T('Ndrysho', 'Change', 'Ändern'),
    sizeNote: T('JPG / PNG / WebP, max {{max}} MB', 'JPG / PNG / WebP, max {{max}} MB', 'JPG / PNG / WebP, max {{max}} MB'),
  },
  payment: {
    failedDefault: T('Pagesa dështoi', 'Payment failed', 'Zahlung fehlgeschlagen'),
    unexpectedStatus: T('Status i papritur: {{status}}', 'Unexpected status: {{status}}', 'Unerwarteter Status: {{status}}'),
    cardLabel: T('Kartë krediti / debiti', 'Credit / debit card', 'Kredit-/Debitkarte'),
    cardDesc: T('Paguaj me Visa, Mastercard ose kartë tjetër', 'Pay with Visa, Mastercard or other card', 'Mit Visa, Mastercard oder anderer Karte bezahlen'),
    paypalLabel: T('PayPal', 'PayPal', 'PayPal'),
    paypalDesc: T('Paguaj përmes llogarisë PayPal', 'Pay through PayPal account', 'Über PayPal-Konto bezahlen'),
    bankLabel: T('Transfer bankar', 'Bank transfer', 'Banküberweisung'),
    bankDesc: T('Paguaj me transfer direkt në llogarinë bankare', 'Pay by direct bank transfer', 'Direkte Banküberweisung'),
    cashLabel: T('Paguaj në lokal (Kesh)', 'Pay in person (Cash)', 'Vor Ort bezahlen (Bargeld)'),
    cashDesc: T('Paguaj me para në dorë kur të merrni automjetin', 'Pay cash when picking up the vehicle', 'Bei Fahrzeugabholung in bar bezahlen'),
    selectMethod: T('Zgjidhni metodën e pagesës', 'Select payment method', 'Zahlungsmethode wählen'),
    selectMethodDesc: T('Zgjidhni si dëshironi të paguani për këtë rezervim', 'Choose how you want to pay for this booking', 'Wählen Sie, wie Sie für diese Buchung zahlen möchten'),
    bankDetailsTitle: T('Detajet e transferit bankar', 'Bank transfer details', 'Bankverbindung'),
    loadingDetails: T('Duke ngarkuar detajet...', 'Loading details...', 'Lädt Details...'),
    bankName: T('Banka', 'Bank', 'Bank'),
    iban: T('IBAN', 'IBAN', 'IBAN'),
    swift: T('SWIFT/BIC', 'SWIFT/BIC', 'SWIFT/BIC'),
    accountHolder: T('Përfituesi', 'Beneficiary', 'Empfänger'),
    currency: T('Valuta', 'Currency', 'Währung'),
    bankVerifyNote: T('Rezervimi do të konfirmohet pasi të verifikohet pagesa.', 'Booking will be confirmed after payment is verified.', 'Buchung wird nach Zahlungsprüfung bestätigt.'),
    noBankDetails: T('Detajet bankare nuk janë të konfiguruara ende. Ju lutem zgjidhni një metodë tjetër ose kontaktoni mbështetjen.', 'Bank details are not configured yet. Please choose another method or contact support.', 'Bankverbindung noch nicht konfiguriert. Bitte wählen Sie eine andere Methode oder kontaktieren Sie den Support.'),
    cashTitle: T('Pagesa në lokal', 'Cash payment', 'Barzahlung'),
    cashNote: T('Paguani direkt tek kompania kur të shkoni për të marrur automjetin. Sillni saktë shumën e faturës.', 'Pay directly at the company when you pick up the vehicle. Bring exact amount.', 'Bezahlen Sie direkt beim Unternehmen bei Abholung. Bringen Sie den genauen Betrag mit.'),
    cardTitle: T('Pagesa me kartë', 'Card payment', 'Kartenzahlung'),
    stripeNote: T('Do të ridrejtoheni në Stripe për të përfunduar pagesën me siguri. Pagesa procesohet menjëherë.', 'You will be redirected to Stripe to complete the payment securely. Payment processed instantly.', 'Sie werden zu Stripe weitergeleitet, um die Zahlung sicher abzuschließen. Zahlung wird sofort verarbeitet.'),
    paypalTitle: T('Pagesa me PayPal', 'PayPal payment', 'PayPal-Zahlung'),
    paypalNote: T('Do të ridrejtoheni në PayPal për të përfunduar pagesën. Pagesa procesohet menjëherë.', 'You will be redirected to PayPal to complete the payment. Processed instantly.', 'Sie werden zu PayPal weitergeleitet. Zahlung wird sofort verarbeitet.'),
    secureNote: T('Pagesa e sigurt përmes Stripe. Asnjë shumë nuk i merret realisht kartës tuaj — është vetëm një bllokim 7-ditor.', 'Secure payment via Stripe. No real charge to your card — only a 7-day hold.', 'Sichere Zahlung über Stripe. Keine echte Belastung — nur eine 7-tägige Reservierung.'),
  },
  cashHold: {
    creationFailed: T('Nuk u krijua hold-i', 'Hold creation failed', 'Sicherheitsleistung konnte nicht erstellt werden'),
    guaranteeFromCard: T('Garanci nga karta juaj: {{amount}} EUR', 'Guarantee from your card: {{amount}} EUR', 'Sicherheit von Ihrer Karte: {{amount}} EUR'),
    explanation: T('Shuma NUK do të debitohet — vetëm e bllokuar në kartën tuaj si garanci. Pas pagesës kesh në lokal, kompania e liron brenda 7 ditësh dhe asnjë shumë nuk u tërhiqet realisht.', 'Amount will NOT be charged — only blocked as guarantee. After cash payment, the company releases it within 7 days with no real charge.', 'Betrag wird NICHT abgebucht — nur als Sicherheit blockiert. Nach Barzahlung gibt das Unternehmen ihn innerhalb von 7 Tagen frei.'),
    successTitle: T('Garanci u autorizua me sukses', 'Guarantee authorized successfully', 'Sicherheit erfolgreich autorisiert'),
    blockedAmount: T('{{amount}} EUR e bllokuar në kartën tuaj', '{{amount}} EUR blocked on your card', '{{amount}} EUR auf Ihrer Karte blockiert'),
    authorizeButton: T('Autorizo garancinë {{amount}} EUR', 'Authorize {{amount}} EUR guarantee', '{{amount}} EUR Sicherheit autorisieren'),
    formIntro: T('Për të konfirmuar rezervimin me pagesë në lokal, na duhet një kartë si garanci. Asnjë shumë nuk do t\'ju merret realisht — kompania e liron pas pagesës kesh.', 'To confirm your booking with cash payment, we need a card as guarantee. No real charge — released after cash payment.', 'Zur Bestätigung der Buchung mit Barzahlung benötigen wir eine Karte als Sicherheit. Keine echte Belastung — Freigabe nach Barzahlung.'),
    formTitle: T('Garanci për pagesën me kesh', 'Guarantee for cash payment', 'Sicherheit für Barzahlung'),
  },
  cashHoldModal: {
    title: T('Si funksionon Cash Hold?', 'How does Cash Hold work?', 'Wie funktioniert Cash Hold?'),
    subtitle: T('Garanci automatike për pagesat me kesh', 'Automatic guarantee for cash payments', 'Automatische Sicherheit für Barzahlungen'),
    whatIs: T('Çfarë është Cash Hold?', 'What is Cash Hold?', 'Was ist Cash Hold?'),
    whatIsDesc: T('Kur një klient rezervon dhe zgjedh të paguajë "në lokal me kesh", ne i kërkojmë kartën e tij si garanci. Stripe-i autorizon (jo i tërheq!) një shumë të caktuar që mbetet e bllokuar deri sa ju ta lironi.', 'When a client books and chooses to pay "in person with cash", we ask for their card as guarantee. Stripe authorizes (does not charge!) an amount that stays blocked until you release it.', 'Wenn ein Kunde "vor Ort mit Bargeld" bezahlt, fragen wir nach seiner Karte als Sicherheit. Stripe autorisiert (belastet nicht!) einen Betrag, der blockiert bleibt, bis Sie ihn freigeben.'),
    hotelAnalogy: T('💡 Mendoje si depozitin e hotelit: hoteli "rezervon" një shumë në kartë kur bën check-in, por nuk e merr realisht; e liron kur klienti del pa probleme.', '💡 Think of it like a hotel deposit: the hotel "reserves" an amount on the card at check-in but doesn\'t actually charge; releases it when the guest leaves without issues.', '💡 Wie eine Hotelkaution: Das Hotel "reserviert" einen Betrag bei Check-in, belastet aber nicht tatsächlich; gibt ihn frei, wenn der Gast ohne Probleme auscheckt.'),
    stepsTitle: T('Çfarë ndodh hap pas hapi', 'What happens step by step', 'Was passiert Schritt für Schritt'),
    step1Title: T('Klienti zgjedh "Kesh në lokal"', 'Client chooses "Cash in person"', 'Kunde wählt "Bargeld vor Ort"'),
    step1Desc: T('Vendos kartën në Stripe — Stripe e autorizon (nuk debiten). Statusi: pending', 'Enters card in Stripe — Stripe authorizes (not charges). Status: pending', 'Gibt Karte bei Stripe ein — Stripe autorisiert (belastet nicht). Status: pending'),
    step2Title: T('Ju aprovoni rezervimin', 'You approve the booking', 'Sie genehmigen die Buchung'),
    step2Desc: T('Si zakonisht — booking kalon në confirmed. Garancia mbetet e bllokuar.', 'As usual — booking goes to confirmed. Guarantee stays blocked.', 'Wie üblich — Buchung wird bestätigt. Sicherheit bleibt blockiert.'),
    step3Title: T('Klienti vjen në lokal për veturen', 'Client comes to pick up the vehicle', 'Kunde kommt zur Fahrzeugabholung'),
    step3Desc: T('Paguan pjesën e mbetur kesh tek ju. Booking-u kalon në active.', 'Pays remaining amount cash. Booking goes to active.', 'Zahlt Restbetrag bar. Buchung wird aktiv.'),
    step4aTitle: T('Klikoni "Lësho [X]€" — garancia liroet', 'Click "Release [X]€" — guarantee is released', '"Freigeben [X]€" klicken — Sicherheit wird freigegeben'),
    step4aDesc: T('Stripe e anulon autorizimin. Klientit NUK i merren para. Banka e tij e zhduk nga lista brenda 1-5 ditësh.', 'Stripe cancels the authorization. Client is NOT charged. Their bank removes it from list within 1-5 days.', 'Stripe storniert die Autorisierung. Kunde wird NICHT belastet. Seine Bank entfernt sie innerhalb von 1-5 Tagen.'),
    step4bTitle: T('OSE klikoni "Kape" — penaliteti debiten', 'OR click "Capture" — penalty is charged', 'ODER "Erfassen" klicken — Strafe wird belastet'),
    step4bDesc: T('Nëse klienti nuk u shfaq ose nuk pagoi, ju mund të kapni garancinë si penalitet. Shuma debiten realisht.', 'If client did not show up or did not pay, you can capture the guarantee as penalty. Amount is actually charged.', 'Wenn Kunde nicht erschien oder nicht zahlte, können Sie die Sicherheit als Strafe erfassen. Betrag wird tatsächlich belastet.'),
    releaseWhen: T('Lëshoni hold-in kur:', 'Release the hold when:', 'Sicherheit freigeben wenn:'),
    releaseWhen1: T('Klienti pagoi kesh në lokal', 'Client paid cash in person', 'Kunde bar bezahlt hat'),
    releaseWhen2: T('Vetura u dorëzua pa probleme', 'Vehicle returned without issues', 'Fahrzeug ohne Probleme zurückgegeben wurde'),
    releaseWhen3: T('Klienti ndryshoi mendje e dha kartë në vend të kesh-it (atëherë merrni me kartë direkt)', 'Client changed mind and paid by card instead (then charge by card directly)', 'Kunde wechselte zur Kartenzahlung (dann direkt mit Karte belasten)'),
    captureWhen: T('Kapeni hold-in kur:', 'Capture the hold when:', 'Sicherheit erfassen wenn:'),
    captureWhen1: T('Klienti nuk u shfaq pa lajmëruar (no-show)', 'Client did not show up without notice (no-show)', 'Kunde ohne Mitteilung nicht erschien (No-Show)'),
    captureWhen2: T('Refuzoi të paguante në lokal', 'Refused to pay in person', 'Verweigerte Zahlung vor Ort'),
    captureWhen3: T('E ktheve veturen me dëme jashtë mbulesës', 'Returned vehicle with damages outside coverage', 'Fahrzeug mit Schäden außerhalb der Deckung zurückgegeben'),
    captureWhen4: T('Karburant i mangët, kohë vonesë, etj.', 'Insufficient fuel, late return, etc.', 'Zu wenig Kraftstoff, verspätete Rückgabe, usw.'),
    timingTitle: T('Vini re kohën', 'Note the timing', 'Achten Sie auf die Zeit'),
    timing1: T('Autorizimi qëndron i vlefshëm 7 ditë në kartën e klientit.', 'Authorization stays valid for 7 days on client\'s card.', 'Autorisierung bleibt 7 Tage auf der Kundenkarte gültig.'),
    timing2: T('Nëse nuk veproni brenda 7 ditësh, Stripe e expires automatikisht dhe klientit nuk i merren para.', 'If you do not act within 7 days, Stripe expires it automatically and client is not charged.', 'Wenn Sie nicht innerhalb von 7 Tagen handeln, läuft sie automatisch ab und Kunde wird nicht belastet.'),
    timing3: T('Mund të kapni edhe një shumë më të vogël se hold-i (psh nga 100€ kapni vetëm 50€).', 'You can capture less than the hold (e.g. from 100€ capture only 50€).', 'Sie können auch einen kleineren Betrag erfassen (z.B. von 100€ nur 50€).'),
    timing4: T('Klienti merr email automatik sa herë që ndryshon statusi (autorizuar / liruar / kapur).', 'Client gets automatic email whenever status changes (authorized / released / captured).', 'Kunde erhält automatische E-Mail bei jeder Statusänderung.'),
    faqTitle: T('Pyetje të shpeshta', 'Frequently asked questions', 'Häufig gestellte Fragen'),
    faq1Q: T('Çfarë ndodh nëse klienti tregon kartë jo-funksionale?', 'What if the client uses a non-functional card?', 'Was, wenn der Kunde eine nicht-funktionierende Karte verwendet?'),
    faq1A: T('Stripe nuk lejon autorizimin. Booking-u nuk konfirmohet dhe klienti detyrohet të provojë kartë tjetër ose metodë tjetër pagese.', 'Stripe does not allow the authorization. The booking is not confirmed and the client must try another card or payment method.', 'Stripe erlaubt die Autorisierung nicht. Die Buchung wird nicht bestätigt und der Kunde muss eine andere Karte oder Zahlungsmethode versuchen.'),
    faq2Q: T('A debiten ndonjë para nga karta kur shtyp "Lësho"?', 'Is any money charged when I press "Release"?', 'Wird Geld belastet, wenn ich "Freigeben" klicke?'),
    faq2A: T('Jo. Lëshimi është thjesht anulim i autorizimit. Klienti nuk humbet asnjë cent.', 'No. Release is simply a cancellation of the authorization. The client loses nothing.', 'Nein. Die Freigabe ist nur eine Stornierung der Autorisierung. Der Kunde verliert nichts.'),
    faq3Q: T('Kur duhet ta bëj kapjen?', 'When should I capture?', 'Wann sollte ich erfassen?'),
    faq3A: T('Sa më shpejt të jetë e mundur pas momentit ku konstaton që klienti ka shkelur kushtet. Idealisht brenda 24-48 orësh pas pickup-it të humbur. Pas 7 ditësh autorizimi skadon dhe nuk mund të kapni më.', 'As soon as possible after you realize the client breached terms. Ideally within 24-48 hours of the missed pickup. After 7 days the authorization expires and you cannot capture anymore.', 'So bald wie möglich, nachdem Sie feststellen, dass der Kunde gegen die Bedingungen verstoßen hat. Idealerweise innerhalb von 24-48 Stunden. Nach 7 Tagen läuft die Autorisierung ab.'),
    faq4Q: T('Si llogariten paratë e kapur?', 'How is the captured money calculated?', 'Wie wird das erfasste Geld berechnet?'),
    faq4A: T('Stripe i kalon në llogarinë tuaj Stripe pas zbritjes së komisionit standard (1.4% + 0.25€ për karta evropiane). Komisionin tuaj e shihni në Stripe Dashboard.', 'Stripe transfers it to your Stripe account after deducting standard commission (1.4% + 0.25€ for European cards). View your commission in Stripe Dashboard.', 'Stripe überweist es auf Ihr Stripe-Konto nach Abzug der Standardprovision (1,4% + 0,25€ für europäische Karten). Siehe Stripe Dashboard.'),
  },
  aboutPage: {
    metaTitle: T('Për Platformën — RentaKar', 'About the Platform — RentaKar', 'Über die Plattform — RentaKar'),
    metaDescription: T('Mëso si funksionon RentaKar — platforma kryesore e qirasë së automjeteve në Kosovë, Shqipëri dhe Maqedoni. Çmime, abonime për kompani, dhe çfarë thonë klientët.', 'Learn how RentaKar works — the leading car rental platform in Kosovo, Albania and Macedonia. Pricing, company subscriptions and customer reviews.', 'Erfahren Sie, wie RentaKar funktioniert — die führende Autovermietungsplattform in Kosovo, Albanien und Mazedonien. Preise, Firmenabonnements und Kundenbewertungen.'),
    badge: T('Për platformën', 'About the platform', 'Über die Plattform'),
    title: T('Si funksionon RentaKar', 'How RentaKar works', 'Wie RentaKar funktioniert'),
    desc: T('Platforma që lidh klientët me kompanitë më të mira të qirasë së automjeteve në Kosovë, Shqipëri dhe Maqedoni. Mëso si funksionon, sa kushton dhe çfarë thonë klientët.', 'The platform connecting customers with the best car rental companies in Kosovo, Albania and Macedonia. Learn how it works, pricing, and what customers say.', 'Die Plattform, die Kunden mit den besten Autovermietungen in Kosovo, Albanien und Mazedonien verbindet.'),
    registerCompany: T('Regjistro kompaninë', 'Register company', 'Unternehmen registrieren'),
  },
};

function buildLang(obj, lang) {
  const out = {};
  for (const k of Object.keys(obj)) {
    if (obj[k] && typeof obj[k] === 'object' && obj[k].sq !== undefined && obj[k].en !== undefined && obj[k].de !== undefined) {
      out[k] = obj[k][lang];
    } else if (typeof obj[k] === 'object') {
      out[k] = buildLang(obj[k], lang);
    } else {
      out[k] = obj[k];
    }
  }
  return out;
}

function deepMerge(target, source) {
  for (const k of Object.keys(source)) {
    if (source[k] && typeof source[k] === 'object' && !Array.isArray(source[k])) {
      target[k] = target[k] && typeof target[k] === 'object' ? target[k] : {};
      deepMerge(target[k], source[k]);
    } else {
      // Force overwrite to ensure consistency
      target[k] = source[k];
    }
  }
}

deepMerge(sq, buildLang(additions, 'sq'));
deepMerge(en, buildLang(additions, 'en'));
deepMerge(de, buildLang(additions, 'de'));

fs.writeFileSync(path.join(__dirname, '..', 'src/i18n/locales/sq.json'), JSON.stringify(sq, null, 2) + '\n');
fs.writeFileSync(path.join(__dirname, '..', 'src/i18n/locales/en.json'), JSON.stringify(en, null, 2) + '\n');
fs.writeFileSync(path.join(__dirname, '..', 'src/i18n/locales/de.json'), JSON.stringify(de, null, 2) + '\n');

console.log('✅ U shtuan/perditesuan key-t per:');
const summary = (obj, prefix = '') => {
  for (const k of Object.keys(obj)) {
    if (obj[k] && typeof obj[k] === 'object' && obj[k].sq !== undefined) {
      console.log(`   ${prefix}${k}`);
    } else if (typeof obj[k] === 'object') {
      summary(obj[k], prefix + k + '.');
    }
  }
};
summary(additions);
