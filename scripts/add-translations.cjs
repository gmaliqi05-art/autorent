/* Add missing translation keys to sq/en/de JSON files. Run once: node scripts/add-translations.cjs */
const fs = require('fs');
const path = require('path');

const sq = require(path.join(__dirname, '..', 'src/i18n/locales/sq.json'));
const en = require(path.join(__dirname, '..', 'src/i18n/locales/en.json'));
const de = require(path.join(__dirname, '..', 'src/i18n/locales/de.json'));

const additions = {
  cookies: {
    title: { sq: 'Ne perdorim cookies', en: 'We use cookies', de: 'Wir verwenden Cookies' },
    accept: { sq: 'Prano te gjitha', en: 'Accept all', de: 'Alle akzeptieren' },
    decline: { sq: 'Refuzo', en: 'Decline', de: 'Ablehnen' },
    policyLink: { sq: 'Politika e cookies', en: 'Cookie policy', de: 'Cookie-Richtlinie' },
  },
  auth: {
    captchaRequired: { sq: 'Plotesoni verifikimin CAPTCHA', en: 'Please complete the CAPTCHA verification', de: 'Bitte schliessen Sie die CAPTCHA-Verifizierung ab' },
  },
  vehicles: {
    pickupDate: { sq: 'Data e marrjes', en: 'Pickup date', de: 'Abholdatum' },
    returnDate: { sq: 'Data e kthimit', en: 'Return date', de: 'Rueckgabedatum' },
  },
  companyDash: {
    bookings: {
      conflictError: { sq: 'Konflikt rezervimi: vetura eshte e zene per kete periudhe', en: 'Booking conflict: vehicle is already booked for this period', de: 'Buchungskonflikt: Fahrzeug ist bereits fuer diesen Zeitraum gebucht' },
      csvDate: { sq: 'Data', en: 'Date', de: 'Datum' },
      csvClient: { sq: 'Klienti', en: 'Client', de: 'Kunde' },
      csvEmail: { sq: 'Email', en: 'Email', de: 'E-Mail' },
      csvPhone: { sq: 'Telefoni', en: 'Phone', de: 'Telefon' },
      csvVehicle: { sq: 'Automjeti', en: 'Vehicle', de: 'Fahrzeug' },
      csvPlate: { sq: 'Targa', en: 'Plate', de: 'Kennzeichen' },
      csvPickup: { sq: 'Marrja', en: 'Pickup', de: 'Abholung' },
      csvReturn: { sq: 'Kthimi', en: 'Return', de: 'Rueckgabe' },
      csvDays: { sq: 'Dite', en: 'Days', de: 'Tage' },
      csvStatus: { sq: 'Statusi', en: 'Status', de: 'Status' },
      csvPayment: { sq: 'Metoda e pageses', en: 'Payment method', de: 'Zahlungsmethode' },
      csvAmount: { sq: 'Shuma', en: 'Amount', de: 'Betrag' },
      exportCsv: { sq: 'Eksporto CSV', en: 'Export CSV', de: 'CSV exportieren' },
      searchPlaceholder: { sq: 'Kerko per klient, automjet ose targa...', en: 'Search by client, vehicle or plate...', de: 'Nach Kunde, Fahrzeug oder Kennzeichen suchen...' },
      from: { sq: 'Nga', en: 'From', de: 'Von' },
      to: { sq: 'Deri', en: 'To', de: 'Bis' },
      internalNotes: { sq: 'Shenime te brendshme', en: 'Internal notes', de: 'Interne Notizen' },
      rejectReasonLabel: { sq: 'Arsyeja e refuzimit (opsionale)', en: 'Rejection reason (optional)', de: 'Ablehnungsgrund (optional)' },
      internalNotesTitle: { sq: 'Shenime te brendshme per kete rezervim', en: 'Internal notes for this booking', de: 'Interne Notizen fuer diese Buchung' },
      internalNotesHint: { sq: 'Vetem ekipi yt i sheh keto', en: 'Only your team sees these', de: 'Nur Ihr Team sieht diese' },
      internalNotesPlaceholder: { sq: 'Shtoni shenime per kete rezervim...', en: 'Add notes for this booking...', de: 'Notizen fuer diese Buchung hinzufuegen...' },
    },
    overview: {
      completedRevenue: { sq: 'Te ardhura te kompletuara', en: 'Completed revenue', de: 'Abgeschlossene Einnahmen' },
      activeRevenueNote: { sq: 'Vetem nga rezervimet te kompletuara me sukses', en: 'Only from successfully completed bookings', de: 'Nur aus erfolgreich abgeschlossenen Buchungen' },
    },
    payments: {
      periodCustom: { sq: 'I personalizuar', en: 'Custom', de: 'Benutzerdefiniert' },
    },
    settings: {
      logo: { sq: 'Logo', en: 'Logo', de: 'Logo' },
      logoHint: { sq: 'PNG / JPG / WebP. Max 2MB. Sfond transparent rekomandohet.', en: 'PNG / JPG / WebP. Max 2MB. Transparent background recommended.', de: 'PNG / JPG / WebP. Max. 2 MB. Transparenter Hintergrund empfohlen.' },
      cover: { sq: 'Imazh i kopertines', en: 'Cover image', de: 'Titelbild' },
      coverHint: { sq: 'Imazhi i madh qe shfaqet ne profilin tend. Max 5MB.', en: 'Large image shown on your profile. Max 5MB.', de: 'Grosses Bild, das in Ihrem Profil angezeigt wird. Max. 5 MB.' },
      sectionHours: { sq: 'Orari i punes', en: 'Working hours', de: 'Oeffnungszeiten' },
      hoursHint: { sq: 'Caktoni orarin per cdo dite te javes', en: 'Set hours for each day of the week', de: 'Stunden fuer jeden Wochentag festlegen' },
      closed: { sq: 'I mbyllur', en: 'Closed', de: 'Geschlossen' },
      open: { sq: 'I hapur', en: 'Open', de: 'Geoeffnet' },
    },
    subscription: {
      downgradeBlocked: { sq: 'Nuk mund te zbresesh ne nje plan me te ulet me kete numer veturash aktive', en: 'Cannot downgrade to a lower plan with this number of active vehicles', de: 'Kann nicht zu einem niedrigeren Plan mit dieser Anzahl aktiver Fahrzeuge wechseln' },
    },
    vehicles: {
      galleryMax: { sq: 'Maksimumi 5 imazhe shtese', en: 'Maximum 5 additional images', de: 'Maximal 5 zusaetzliche Bilder' },
      validationImage: { sq: 'Imazhi kryesor eshte i detyrueshem', en: 'Main image is required', de: 'Hauptbild ist erforderlich' },
      validationBrand: { sq: 'Marka eshte e detyrueshme', en: 'Brand is required', de: 'Marke ist erforderlich' },
      validationModel: { sq: 'Modeli eshte i detyrueshem', en: 'Model is required', de: 'Modell ist erforderlich' },
      validationPlate: { sq: 'Targa eshte e detyrueshme', en: 'Plate is required', de: 'Kennzeichen ist erforderlich' },
      validationPrice: { sq: 'Cmimi duhet te jete me i madh se 0', en: 'Price must be greater than 0', de: 'Preis muss groesser als 0 sein' },
      validationPublish: { sq: 'Plotesoni te gjitha fushat para publikimit', en: 'Fill all fields before publishing', de: 'Alle Felder vor der Veroeffentlichung ausfuellen' },
      deleteBlockedActive: { sq: 'Nuk mund te fshish nje vetur me rezervime aktive', en: 'Cannot delete a vehicle with active bookings', de: 'Fahrzeug mit aktiven Buchungen kann nicht geloescht werden' },
      searchPlaceholder: { sq: 'Kerko per marke, model ose targa...', en: 'Search by brand, model or plate...', de: 'Nach Marke, Modell oder Kennzeichen suchen...' },
      gallery: { sq: 'Galeria e imazheve', en: 'Image gallery', de: 'Bildergalerie' },
      addImages: { sq: 'Shto imazhe', en: 'Add images', de: 'Bilder hinzufuegen' },
      features: { sq: 'Karakteristikat', en: 'Features', de: 'Ausstattung' },
      publishImmediately: { sq: 'Publiko menjehere', en: 'Publish immediately', de: 'Sofort veroeffentlichen' },
      available: { sq: 'I disponueshem', en: 'Available', de: 'Verfuegbar' },
      noResults: { sq: 'Nuk u gjeten automjete', en: 'No vehicles found', de: 'Keine Fahrzeuge gefunden' },
      noResultsDesc: { sq: 'Provo te ndryshosh filtrat ose shto nje automjet te ri', en: 'Try changing filters or add a new vehicle', de: 'Filter aendern oder neues Fahrzeug hinzufuegen' },
      unpublish: { sq: 'Cpubliko', en: 'Unpublish', de: 'Veroeffentlichung aufheben' },
      publish: { sq: 'Publiko', en: 'Publish', de: 'Veroeffentlichen' },
      clone: { sq: 'Klono', en: 'Clone', de: 'Klonen' },
    },
  },
};

function buildLang(obj, lang) {
  const out = {};
  for (const k of Object.keys(obj)) {
    if (obj[k] && typeof obj[k] === 'object' && obj[k][lang] !== undefined) {
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
    } else if (target[k] === undefined) {
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

const verify = require(path.join(__dirname, '..', 'src/i18n/locales/sq.json'));
console.log('Added translations.');
console.log('Verify companyDash.settings.cover:', verify.companyDash && verify.companyDash.settings && verify.companyDash.settings.cover);
console.log('Verify auth.captchaRequired:', verify.auth && verify.auth.captchaRequired);
console.log('Verify cookies.title:', verify.cookies && verify.cookies.title);
