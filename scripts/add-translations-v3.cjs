// Shton perkthime per VehicleDetailPage dhe ekrane te tjera klienti
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'i18n', 'locales');

function T(sq, en, de) { return { sq, en, de }; }

const KEYS = {
  vehicleDetail: {
    backToVehicles: T('Te gjitha automjetet', 'All vehicles', 'Alle Fahrzeuge'),
    backToVehicle: T('Kthehu te automjeti', 'Back to vehicle', 'Zurück zum Fahrzeug'),
    backToInvoice: T('Kthehu te fatura', 'Back to invoice', 'Zurück zur Rechnung'),
    notFound: T('Automjeti nuk u gjet', 'Vehicle not found', 'Fahrzeug nicht gefunden'),
    perDay: T('per dite', 'per day', 'pro Tag'),
    transmission: T('Transmisioni', 'Transmission', 'Getriebe'),
    transmissionAutomatic: T('Automatike', 'Automatic', 'Automatik'),
    transmissionManual: T('Manuale', 'Manual', 'Schaltgetriebe'),
    fuel: T('Karburanti', 'Fuel', 'Kraftstoff'),
    seats: T('Vendet', 'Seats', 'Sitze'),
    seatsCount: T('{{count}} vende', '{{count}} seats', '{{count}} Sitze'),
    doors: T('Dyert', 'Doors', 'Türen'),
    doorsCount: T('{{count}} dyer', '{{count}} doors', '{{count}} Türen'),
    features: T('Pajisjet', 'Features', 'Ausstattung'),
    reviewsTitle: T('Vleresimet e klienteve', 'Customer reviews', 'Kundenbewertungen'),
    companyTitle: T('Kompania', 'Company', 'Unternehmen'),
    bookNow: T('Rezervo tani', 'Book now', 'Jetzt buchen'),
    pickup: T('Marrja', 'Pickup', 'Abholung'),
    return: T('Kthimi', 'Return', 'Rückgabe'),
    deposit: T('Depozita', 'Deposit', 'Kaution'),
    total: T('Totali', 'Total', 'Gesamt'),
    loginToBook: T('Kycu per te rezervuar', 'Sign in to book', 'Zum Buchen anmelden'),
    checkingAvailability: T('Duke kontrolluar...', 'Checking...', 'Wird geprüft...'),
    book: T('Rezervo', 'Book', 'Buchen'),
    freeCancellation: T('Anulim falas deri ne 48 ore para marrjes', 'Free cancellation up to 48 hours before pickup', 'Kostenlose Stornierung bis 48 Stunden vor Abholung'),
    pickReturnDates: T('Zgjidhni datat e marrjes dhe kthimit.', 'Select pickup and return dates.', 'Wählen Sie Abhol- und Rückgabedatum.'),
    returnAfterPickup: T('Data e kthimit duhet te jete pas dates se marrjes.', 'Return date must be after pickup date.', 'Rückgabedatum muss nach dem Abholdatum liegen.'),
    docsRequired: T('Duhet te ngarkoni patenten dhe ta verifikoni para se te rezervoni. Shkoni te profili juaj per te ngarkuar dokumentet.', 'You must upload and verify your license before booking. Go to your profile to upload documents.', 'Sie müssen Ihren Führerschein hochladen und verifizieren, bevor Sie buchen können. Gehen Sie zu Ihrem Profil, um Dokumente hochzuladen.'),
    vehicleUnavailable: T('Automjeti eshte i rezervuar per keto data. Ju lutem zgjidhni data te tjera.', 'Vehicle is booked for these dates. Please choose different dates.', 'Fahrzeug ist für diese Daten gebucht. Bitte wählen Sie andere Daten.'),
    bookingError: T('Dicka shkoi keq. Provoni perseri.', 'Something went wrong. Please try again.', 'Etwas ist schief gelaufen. Bitte erneut versuchen.'),
    back: T('Kthehu', 'Back', 'Zurück'),
    continueToPayment: T('Vazhdo me pagesen', 'Continue to payment', 'Weiter zur Zahlung'),
    confirming: T('Duke perfunduar...', 'Confirming...', 'Wird abgeschlossen...'),
    confirmBooking: T('Konfirmo rezervimin', 'Confirm booking', 'Buchung bestätigen'),
    cashHoldTitle: T('Garanci për pagesën me kesh', 'Guarantee for cash payment', 'Garantie für Barzahlung'),
    cashHoldDesc: T("Per te konfirmuar rezervimin me pagese ne lokal, na duhet nje karte si garanci. Asnje shume nuk do t'ju merret realisht — kompania e liron pas pages kesh.", "To confirm a booking with cash payment, we need a card as a guarantee. No amount will actually be charged — the company releases it after cash payment.", "Um eine Buchung mit Barzahlung zu bestätigen, benötigen wir eine Karte als Sicherheit. Kein Betrag wird tatsächlich abgebucht — das Unternehmen gibt sie nach Barzahlung frei."),
    successTitle: T('Rezervimi u krye me sukses!', 'Booking completed successfully!', 'Buchung erfolgreich abgeschlossen!'),
    successDesc: T("Faleminderit per rezervimin tuaj. Kompania do t'ju konfirmoje brenda 24 oreve.", 'Thank you for your booking. The company will confirm within 24 hours.', 'Danke für Ihre Buchung. Das Unternehmen wird innerhalb von 24 Stunden bestätigen.'),
    successCash: T('Pagesa do te kryhet ne momentin e marrjes se automjetit.', 'Payment will be made when you pick up the vehicle.', 'Die Zahlung erfolgt bei Abholung des Fahrzeugs.'),
    successBank: T('Ju lutem kryeni transferin bankar sipas detajeve te dhena. Rezervimi konfirmohet pas verifikimit.', 'Please complete the bank transfer with the details provided. Booking is confirmed after verification.', 'Bitte überweisen Sie gemäß den angegebenen Details. Die Buchung wird nach der Überprüfung bestätigt.'),
    successOnline: T('Pagesa juaj u regjistrua. Do te njoftoheni kur te procesohet.', 'Your payment was registered. You will be notified when it is processed.', 'Ihre Zahlung wurde registriert. Sie werden benachrichtigt, sobald sie bearbeitet wird.'),
    summary: T('Permbledhje', 'Summary', 'Zusammenfassung'),
    vehicle: T('Automjeti', 'Vehicle', 'Fahrzeug'),
    period: T('Periudha', 'Period', 'Zeitraum'),
    daysCount: T('{{count}} dite', '{{count}} days', '{{count}} Tage'),
    paymentMethod: T('Metoda e pageses', 'Payment method', 'Zahlungsmethode'),
    myBookings: T('Shiko rezervimet e mia', 'View my bookings', 'Meine Buchungen ansehen'),
    browseOthers: T('Shfleto automjete te tjera', 'Browse other vehicles', 'Andere Fahrzeuge durchsuchen'),
    pendingApproval: T('Në pritje të aprovimit', 'Pending approval', 'Warten auf Genehmigung'),
    notifBookingCreatedTitle: T('Rezervimi u krye', 'Booking created', 'Buchung erstellt'),
    notifBookingCreatedClient: T('Rezervimi juaj per {{vehicle}} u krye me sukses. Kompania do ta shqyrtoje brenda 24 oreve.', 'Your booking for {{vehicle}} was completed. The company will review within 24 hours.', 'Ihre Buchung für {{vehicle}} wurde abgeschlossen. Das Unternehmen wird sie innerhalb von 24 Stunden prüfen.'),
    notifBookingCreatedCompany: T('Rezervim i ri', 'New booking', 'Neue Buchung'),
    notifBookingCreatedCompanyMsg: T('{{name}} ka bere nje rezervim te ri per {{vehicle}}. Shqyrtojeni ne dashboard.', '{{name}} made a new booking for {{vehicle}}. Review it in the dashboard.', '{{name}} hat eine neue Buchung für {{vehicle}} vorgenommen. Bitte im Dashboard prüfen.'),
    stripeFailed: T('Rezervimi u krijua, por pagesa deshtoi: {{err}}. Mund ta provoni perseri nga dashboardi.', 'Booking created, but payment failed: {{err}}. You can retry from the dashboard.', 'Buchung erstellt, aber Zahlung fehlgeschlagen: {{err}}. Sie können es vom Dashboard aus erneut versuchen.'),
    paypalFailed: T('Rezervimi u krijua, por pagesa PayPal deshtoi: {{err}}. Mund ta provoni perseri nga dashboardi.', 'Booking created, but PayPal payment failed: {{err}}. You can retry from the dashboard.', 'Buchung erstellt, aber PayPal-Zahlung fehlgeschlagen: {{err}}. Sie können es vom Dashboard aus erneut versuchen.'),
  },
  paymentLabel: {
    stripe: T('Karte krediti/debiti', 'Credit/Debit card', 'Kredit-/Debitkarte'),
    paypal: T('PayPal', 'PayPal', 'PayPal'),
    bank: T('Transfer bankar', 'Bank transfer', 'Banküberweisung'),
    cash: T('Kesh / Ne lokal', 'Cash / On site', 'Bar / Vor Ort'),
  },
  steps: {
    dates: T('Datat', 'Dates', 'Daten'),
    invoice: T('Fatura', 'Invoice', 'Rechnung'),
    payment: T('Pagesa', 'Payment', 'Zahlung'),
  },
};

function buildLang(obj, lang) {
  const out = {};
  for (const k in obj) {
    const v = obj[k];
    if (v && typeof v === 'object' && 'sq' in v && 'en' in v && 'de' in v) {
      out[k] = v[lang];
    } else if (v && typeof v === 'object') {
      out[k] = buildLang(v, lang);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function deepMerge(target, src) {
  for (const k in src) {
    if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k])) {
      target[k] = target[k] || {};
      deepMerge(target[k], src[k]);
    } else {
      target[k] = src[k];
    }
  }
  return target;
}

for (const lang of ['sq', 'en', 'de']) {
  const file = path.join(LOCALES_DIR, `${lang}.json`);
  const cur = JSON.parse(fs.readFileSync(file, 'utf-8'));
  const additions = buildLang(KEYS, lang);
  deepMerge(cur, additions);
  fs.writeFileSync(file, JSON.stringify(cur, null, 2) + '\n', 'utf-8');
}

function listKeys(obj, prefix = '') {
  const out = [];
  for (const k in obj) {
    const v = obj[k];
    if (v && typeof v === 'object' && 'sq' in v) {
      out.push(prefix + k);
    } else if (v && typeof v === 'object') {
      out.push(...listKeys(v, prefix + k + '.'));
    }
  }
  return out;
}

console.log('Added keys:');
listKeys(KEYS).forEach(k => console.log('  ' + k));
