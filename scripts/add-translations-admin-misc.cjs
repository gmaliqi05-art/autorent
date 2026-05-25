// Shton perkthime per admin: PINSecurity, DiscountCodes, Ads, CreateAd, DailyOffers, BusinessPlan, Transactions
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'i18n', 'locales');

function T(sq, en, de) { return { sq, en, de }; }

const KEYS = {
  adminDash: {
    pinSecurity: {
      title: T('Fshirje e Sigurt (PIN)', 'Secure Deletion (PIN)', 'Sichere Löschung (PIN)'),
      subtitle: T('Menaxho kerkimet per fshirje llogarie dhe cilesimet e sigurise', 'Manage account deletion requests and security settings', 'Verwalten Sie Kontolöschungsanträge und Sicherheitseinstellungen'),
      statPending: T('Kerkesa ne pritje', 'Pending requests', 'Ausstehende Anfragen'),
      statApproved: T('Te aprovuara', 'Approved', 'Genehmigt'),
      statRejected: T('Te refuzuara', 'Rejected', 'Abgelehnt'),
      tabRequests: T('Kerkesa per Fshirje', 'Deletion requests', 'Löschungsanträge'),
      tabSettings: T('Cilesimet PIN', 'PIN settings', 'PIN-Einstellungen'),
      searchPlaceholder: T('Kerkoni perdorues...', 'Search users...', 'Benutzer suchen...'),
      emptyRequests: T('Nuk ka kerkesa per fshirje llogarie', 'No account deletion requests', 'Keine Kontolöschungsanträge'),
      noName: T('Pa emer', 'No name', 'Kein Name'),
      statusPending: T('Ne pritje', 'Pending', 'Ausstehend'),
      statusApproved: T('Aprovuar', 'Approved', 'Genehmigt'),
      statusRejected: T('Refuzuar', 'Rejected', 'Abgelehnt'),
      approve: T('Aprovo', 'Approve', 'Genehmigen'),
      reject: T('Refuzo', 'Reject', 'Ablehnen'),
      settingsTitle: T('Cilesimet e Sigurise PIN', 'PIN security settings', 'PIN-Sicherheitseinstellungen'),
      save: T('Ruaj', 'Save', 'Speichern'),
      saved: T('U ruajt!', 'Saved!', 'Gespeichert!'),
      requirePinLabel: T('Kerkoni PIN per fshirje llogarie', 'Require PIN for account deletion', 'PIN für Kontolöschung erforderlich'),
      requirePinDesc: T('Perdoruesit duhet te konfirmojne me PIN', 'Users must confirm with PIN', 'Benutzer müssen mit PIN bestätigen'),
      notifyAdminLabel: T('Njoftoni admin kur behet kerkesa', 'Notify admin when request is made', 'Admin benachrichtigen, wenn Anfrage gestellt wird'),
      notifyAdminDesc: T('Dergoni email tek super admin', 'Send email to super admin', 'E-Mail an Super-Admin senden'),
      requireReasonLabel: T('Kerkoni arsye per fshirje', 'Require reason for deletion', 'Grund für Löschung erforderlich'),
      requireReasonDesc: T('Perdoruesit duhet te japin arsyen', 'Users must provide a reason', 'Benutzer müssen einen Grund angeben'),
      pinExpiryLabel: T('Skadimi PIN (min)', 'PIN expiry (min)', 'PIN-Ablauf (Min.)'),
      maxAttemptsLabel: T('Tentativa max', 'Max attempts', 'Max. Versuche'),
      lockoutLabel: T('Bllokimi (min)', 'Lockout (min)', 'Sperrung (Min.)'),
    },
    discounts: {
      title: T('Kode Zbritjesh', 'Discount codes', 'Rabattcodes'),
      subtitle: T('Krijoni dhe menaxhoni kodet e zbritjes per klientet', 'Create and manage discount codes for customers', 'Rabattcodes für Kunden erstellen und verwalten'),
      newCode: T('Kode i ri', 'New code', 'Neuer Code'),
      statTotal: T('Total kode', 'Total codes', 'Codes gesamt'),
      statActive: T('Aktive', 'Active', 'Aktiv'),
      statUsedToday: T('Te perdorura sot', 'Used today', 'Heute verwendet'),
      statExpired: T('Skaduar', 'Expired', 'Abgelaufen'),
      formEditTitle: T('Ndrysho kodin', 'Edit code', 'Code bearbeiten'),
      formNewTitle: T('Kode i ri zbritjeje', 'New discount code', 'Neuer Rabattcode'),
      codeLabel: T('Kodi *', 'Code *', 'Code *'),
      codePlaceholder: T('P.sh. SUMMER20', 'e.g. SUMMER20', 'z. B. SUMMER20'),
      generate: T('Gjenero', 'Generate', 'Generieren'),
      descLabel: T('Pershkrim', 'Description', 'Beschreibung'),
      descPlaceholder: T('Pershkrim i shkurter...', 'Short description...', 'Kurze Beschreibung...'),
      typeLabel: T('Lloji', 'Type', 'Typ'),
      typePercent: T('Perqindje (%)', 'Percentage (%)', 'Prozent (%)'),
      typeFixed: T('Shume fikse (€)', 'Fixed amount (€)', 'Fester Betrag (€)'),
      valueLabel: T('Vlera *', 'Value *', 'Wert *'),
      minAmountLabel: T('Shuma minimale (€)', 'Minimum amount (€)', 'Mindestbetrag (€)'),
      maxUsesLabel: T('Perdorime max (0=pa limit)', 'Max uses (0=no limit)', 'Max. Nutzungen (0=kein Limit)'),
      expiresLabel: T('Skadon me (opsionale)', 'Expires on (optional)', 'Läuft ab am (optional)'),
      activeNow: T('Aktiv menjëherë', 'Active immediately', 'Sofort aktiv'),
      cancel: T('Anulo', 'Cancel', 'Abbrechen'),
      saveChanges: T('Ruaj ndryshimet', 'Save changes', 'Änderungen speichern'),
      createCode: T('Krijo kodin', 'Create code', 'Code erstellen'),
      searchPlaceholder: T('Kerkoni kode...', 'Search codes...', 'Codes suchen...'),
      emptyState: T('Nuk ka kode zbritjesh', 'No discount codes', 'Keine Rabattcodes'),
      thCode: T('Kodi', 'Code', 'Code'),
      thDiscount: T('Zbritja', 'Discount', 'Rabatt'),
      thUsed: T('Perdoruar', 'Used', 'Verwendet'),
      thLimit: T('Limiti', 'Limit', 'Limit'),
      thExpires: T('Skadon', 'Expires', 'Läuft ab'),
      thStatus: T('Statusi', 'Status', 'Status'),
      usedTimes: T('{{count}} here', '{{count}} times', '{{count}} Mal'),
      noLimit: T('Pa limit', 'No limit', 'Kein Limit'),
      noExpiry: T('Pa skadim', 'No expiry', 'Kein Ablauf'),
      statusActive: T('Aktiv', 'Active', 'Aktiv'),
      statusInactive: T('Joaktiv', 'Inactive', 'Inaktiv'),
      statusExpired: T('Skaduar', 'Expired', 'Abgelaufen'),
      minPrefix: T('min', 'min', 'min'),
    },
    ads: {
      pageTitle: T('Menaxhimi i reklamave', 'Ad management', 'Anzeigenverwaltung'),
      pageSubtitle: T('Krijoni dhe menaxhoni reklamat ne platforme', 'Create and manage ads on the platform', 'Anzeigen auf der Plattform erstellen und verwalten'),
      newAd: T('Reklame e re', 'New ad', 'Neue Anzeige'),
      statTotalViews: T('Shikime gjithsej', 'Total views', 'Aufrufe gesamt'),
      statTotalClicks: T('Klikime gjithsej', 'Total clicks', 'Klicks gesamt'),
      statAvgCtr: T('CTR mesatar', 'Average CTR', 'Durchschnittliche CTR'),
      newAdTitle: T('Reklame e re', 'New ad', 'Neue Anzeige'),
      editAdTitle: T('Ndrysho reklamen', 'Edit ad', 'Anzeige bearbeiten'),
      title: T('Titulli', 'Title', 'Titel'),
      titlePlaceholder: T('p.sh. Oferte speciale vere 2026', 'e.g. Summer 2026 special offer', 'z. B. Sommer-2026-Sonderangebot'),
      position: T('Pozicioni', 'Position', 'Position'),
      description: T('Pershkrimi', 'Description', 'Beschreibung'),
      imageLabel: T('Imazhi i reklames', 'Ad image', 'Anzeigenbild'),
      uploadImage: T('Ngarko imazhin', 'Upload image', 'Bild hochladen'),
      linkUrl: T('Link URL', 'Link URL', 'Link-URL'),
      startDate: T('Data e fillimit', 'Start date', 'Startdatum'),
      endDate: T('Data e perfundimit', 'End date', 'Enddatum'),
      active: T('Aktive', 'Active', 'Aktiv'),
      inactive: T('Joaktive', 'Inactive', 'Inaktiv'),
      inactiveBadge: T('JOAKTIVE', 'INACTIVE', 'INAKTIV'),
      save: T('Ruaj', 'Save', 'Speichern'),
      cancel: T('Anulo', 'Cancel', 'Abbrechen'),
      viewsShort: T('{{count}} shikime', '{{count}} views', '{{count}} Aufrufe'),
      clicksShort: T('{{count}} klikime', '{{count}} clicks', '{{count}} Klicks'),
      fromDate: T('Nga: {{date}}', 'From: {{date}}', 'Ab: {{date}}'),
      confirmDelete: T('Fshij kete reklame?', 'Delete this ad?', 'Diese Anzeige löschen?'),
      emptyState: T('Nuk ka reklama. Klikoni "Reklame e re" per te filluar.', 'No ads. Click "New ad" to get started.', 'Keine Anzeigen. Klicken Sie auf „Neue Anzeige", um zu beginnen.'),
      posHomepageBanner: T('Baneri kryesor', 'Main banner', 'Haupt-Banner'),
      posHomepageMiddle: T('Mes te faqes', 'Middle of page', 'Seitenmitte'),
      posSidebar: T('Sidebar', 'Sidebar', 'Seitenleiste'),
      posVehicleList: T('Lista automjeteve', 'Vehicle list', 'Fahrzeugliste'),
      posBookingConfirm: T('Konfirmim rezervimi', 'Booking confirmation', 'Buchungsbestätigung'),
    },
    createAd: {
      pageTitle: T('Krijo Reklame', 'Create Ad', 'Anzeige erstellen'),
      heading: T('Krijo Reklame te Re', 'Create new ad', 'Neue Anzeige erstellen'),
      subtitle: T('Shto nje reklame te re ne platforme', 'Add a new ad to the platform', 'Neue Anzeige zur Plattform hinzufügen'),
      preview: T('Preview', 'Preview', 'Vorschau'),
      saving: T('Duke ruajtur...', 'Saving...', 'Wird gespeichert...'),
      saved: T('U ruajt!', 'Saved!', 'Gespeichert!'),
      publish: T('Publiko', 'Publish', 'Veröffentlichen'),
      content: T('Permbajtja', 'Content', 'Inhalt'),
      titleLabel: T('Titulli i Reklames *', 'Ad title *', 'Anzeigentitel *'),
      titlePlaceholder: T('P.sh. Oferte speciale - 20% zbritje...', 'e.g. Special offer - 20% off...', 'z. B. Sonderangebot - 20% Rabatt...'),
      descLabel: T('Pershkrim', 'Description', 'Beschreibung'),
      descPlaceholder: T('Pershkrim i shkurter i reklames...', 'Short description of the ad...', 'Kurze Beschreibung der Anzeige...'),
      imageLabel: T('Imazhi i reklames', 'Ad image', 'Anzeigenbild'),
      uploadImage: T('Ngarko imazhin e reklames', 'Upload ad image', 'Anzeigenbild hochladen'),
      linkUrlLabel: T('URL destinacioni (ku shkon klikimi)', 'Destination URL (where clicks lead)', 'Ziel-URL (wohin Klicks führen)'),
      period: T('Periudha', 'Period', 'Zeitraum'),
      startsAt: T('Fillon me', 'Starts on', 'Beginnt am'),
      expiresAt: T('Skadon me', 'Expires on', 'Läuft ab am'),
      publishNowTitle: T('Publiko menjëherë', 'Publish immediately', 'Sofort veröffentlichen'),
      publishNowDesc: T('Reklama do shfaqet ne platforme menjëherë', 'The ad will appear on the platform immediately', 'Die Anzeige erscheint sofort auf der Plattform'),
      positionTitle: T('Pozicioni', 'Position', 'Position'),
      previewTitle: T('Preview', 'Preview', 'Vorschau'),
      noImage: T('Pa imazh', 'No image', 'Kein Bild'),
      active: T('Aktive', 'Active', 'Aktiv'),
      inactive: T('Joaktive', 'Inactive', 'Inaktiv'),
      posHomepageBannerLabel: T('Banner kryesor i Ballines', 'Homepage main banner', 'Hauptbanner Startseite'),
      posHomepageBannerDesc: T('Vendoset ne kryefaqe, shume vizibel', 'Placed on homepage, highly visible', 'Auf der Startseite platziert, gut sichtbar'),
      posHomepageMiddleLabel: T('Mes i Ballines', 'Homepage middle', 'Startseitenmitte'),
      posHomepageMiddleDesc: T('Banner ne mes te faqes kryesore', 'Banner in the middle of the homepage', 'Banner in der Mitte der Startseite'),
      posSidebarLabel: T('Sidebar', 'Sidebar', 'Seitenleiste'),
      posSidebarDesc: T('Paneli anesore i faqeve', 'Page side panel', 'Seitliches Panel der Seiten'),
      posVehicleListLabel: T('Lista e Automjeteve', 'Vehicle list', 'Fahrzeugliste'),
      posVehicleListDesc: T('Midis listimit te automjeteve', 'Between vehicle listings', 'Zwischen Fahrzeuglisten'),
      posBookingConfirmLabel: T('Konfirmim Rezervimi', 'Booking confirmation', 'Buchungsbestätigung'),
      posBookingConfirmDesc: T('Pas konfirmimit te rezervimit', 'After booking confirmation', 'Nach Buchungsbestätigung'),
    },
    dailyOffers: {
      pageTitle: T('Oferta Ditore', 'Daily offers', 'Tagesangebote'),
      subtitle: T('Krijoni oferta speciale dhe zbritje te kufizuara ne kohe', 'Create special offers and time-limited discounts', 'Sonderangebote und zeitlich begrenzte Rabatte erstellen'),
      newOffer: T('Oferte e re', 'New offer', 'Neues Angebot'),
      statTotal: T('Total oferta', 'Total offers', 'Angebote gesamt'),
      statActiveNow: T('Aktive tani', 'Active now', 'Jetzt aktiv'),
      statUpcoming: T('Ardhshme', 'Upcoming', 'Bevorstehend'),
      statExpired: T('Skaduar', 'Expired', 'Abgelaufen'),
      activeNowTitle: T('Ofertat aktive tani ({{count}})', 'Currently active offers ({{count}})', 'Derzeit aktive Angebote ({{count}})'),
      expiresOn: T('Skadon: {{date}}', 'Expires: {{date}}', 'Läuft ab: {{date}}'),
      editTitle: T('Ndrysho oferten', 'Edit offer', 'Angebot bearbeiten'),
      newOfferTitle: T('Oferte e re ditore', 'New daily offer', 'Neues Tagesangebot'),
      titleLabel: T('Titulli *', 'Title *', 'Titel *'),
      titlePlaceholder: T('P.sh. Oferte e fundjaves...', 'e.g. Weekend offer...', 'z. B. Wochenendangebot...'),
      descLabel: T('Pershkrim', 'Description', 'Beschreibung'),
      discountLabel: T('Zbritja (%)', 'Discount (%)', 'Rabatt (%)'),
      startsAt: T('Fillon me *', 'Starts on *', 'Beginnt am *'),
      endsAt: T('Skadon me *', 'Ends on *', 'Endet am *'),
      vehicleLabel: T('Automjet specifik (opsionale)', 'Specific vehicle (optional)', 'Bestimmtes Fahrzeug (optional)'),
      allVehicles: T('Te gjithe automjetet', 'All vehicles', 'Alle Fahrzeuge'),
      imageLabel: T('Imazhi i ofertes (opsional)', 'Offer image (optional)', 'Angebotsbild (optional)'),
      uploadImage: T('Ngarko imazhin', 'Upload image', 'Bild hochladen'),
      activeNow: T('Aktive menjëherë', 'Active immediately', 'Sofort aktiv'),
      cancel: T('Anulo', 'Cancel', 'Abbrechen'),
      saveChanges: T('Ruaj ndryshimet', 'Save changes', 'Änderungen speichern'),
      createOffer: T('Krijo oferten', 'Create offer', 'Angebot erstellen'),
      searchPlaceholder: T('Kerkoni oferta...', 'Search offers...', 'Angebote suchen...'),
      emptyState: T('Nuk ka oferta ditore', 'No daily offers', 'Keine Tagesangebote'),
      vehicleLine: T('Automjet: {{name}}', 'Vehicle: {{name}}', 'Fahrzeug: {{name}}'),
      companyLine: T('Firma: {{name}}', 'Company: {{name}}', 'Unternehmen: {{name}}'),
      statusActive: T('Aktive', 'Active', 'Aktiv'),
      statusExpired: T('Skaduar', 'Expired', 'Abgelaufen'),
      statusUpcoming: T('E ardhshme', 'Upcoming', 'Bevorstehend'),
    },
    businessPlan: {
      pageTitle: T('Business Plan & Financat', 'Business plan & finances', 'Geschäftsplan & Finanzen'),
      subtitle: T('Planifikimi financiar dhe projeksionet e biznesit', 'Financial planning and business projections', 'Finanzplanung und Geschäftsprognosen'),
      refresh: T('Perditeso', 'Refresh', 'Aktualisieren'),
      export: T('Eksporto', 'Export', 'Exportieren'),
      statRevenue: T('Te ardhura totale', 'Total revenue', 'Gesamtumsatz'),
      statBookings: T('Rezervime totale', 'Total bookings', 'Buchungen gesamt'),
      statCompanies: T('Firma te regjistruara', 'Registered companies', 'Registrierte Unternehmen'),
      statUsers: T('Perdorues total', 'Total users', 'Benutzer gesamt'),
      statVehicles: T('Automjete total', 'Total vehicles', 'Fahrzeuge gesamt'),
      statSubRevenue: T('Te ardhura nga abonim', 'Subscription revenue', 'Abonnement-Einnahmen'),
      projections: T('Projeksionet', 'Projections', 'Prognosen'),
      monthlyEst: T('Te ardhura mujore (est.)', 'Monthly revenue (est.)', 'Monatlicher Umsatz (geschätzt)'),
      yearlyProjection: T('Projeksioni vjetor', 'Yearly projection', 'Jahresprognose'),
      growthVsLastMonth: T('{{prefix}}{{value}}% krahasuar me muajin e kaluar', '{{prefix}}{{value}}% vs. last month', '{{prefix}}{{value}}% gegenüber Vormonat'),
      revenueByMonth: T('Te ardhurat sipas muajit (6 muajt e fundit)', 'Revenue by month (last 6 months)', 'Umsatz nach Monat (letzte 6 Monate)'),
      monthlyDetails: T('Detajet mujore', 'Monthly details', 'Monatliche Details'),
      thMonth: T('Muaji', 'Month', 'Monat'),
      thRevenue: T('Te Ardhura', 'Revenue', 'Umsatz'),
      thBookings: T('Rezervime', 'Bookings', 'Buchungen'),
      thNewCompanies: T('Firma te reja', 'New companies', 'Neue Unternehmen'),
      thNewUsers: T('Perdorues te rinj', 'New users', 'Neue Benutzer'),
    },
    transactions: {
      pageTitle: T('Transaksionet', 'Transactions', 'Transaktionen'),
      subtitle: T('Te gjitha pagesat dhe transaksionet ne platforme', 'All payments and transactions on the platform', 'Alle Zahlungen und Transaktionen auf der Plattform'),
      statVolume: T('Volumet total', 'Total volume', 'Gesamtvolumen'),
      statSuccessRate: T('Success rate', 'Success rate', 'Erfolgsrate'),
      statAvgValue: T('Vlera mesatare', 'Average value', 'Durchschnittswert'),
      statFailed: T('Pagesa te deshtuara', 'Failed payments', 'Fehlgeschlagene Zahlungen'),
      filters: T('Filtra', 'Filters', 'Filter'),
      filterSearchLabel: T('Kerko', 'Search', 'Suchen'),
      filterSearchPlaceholder: T('Klienti, email, kompania...', 'Client, email, company...', 'Kunde, E-Mail, Unternehmen...'),
      filterCompany: T('Kompania', 'Company', 'Unternehmen'),
      filterMethod: T('Metoda e pageses', 'Payment method', 'Zahlungsmethode'),
      filterStatus: T('Statusi i pageses', 'Payment status', 'Zahlungsstatus'),
      filterAll: T('Te gjitha', 'All', 'Alle'),
      transactionsCount: T('Transaksionet ({{count}})', 'Transactions ({{count}})', 'Transaktionen ({{count}})'),
      exportCsv: T('Exporto ne CSV', 'Export to CSV', 'Als CSV exportieren'),
      thIdDate: T('ID & Data', 'ID & Date', 'ID & Datum'),
      thInvoice: T('Fatura', 'Invoice', 'Rechnung'),
      thClient: T('Klienti', 'Client', 'Kunde'),
      thCompany: T('Kompania', 'Company', 'Unternehmen'),
      thVehicle: T('Automjeti', 'Vehicle', 'Fahrzeug'),
      thMethod: T('Metoda', 'Method', 'Methode'),
      thStatus: T('Statusi', 'Status', 'Status'),
      thAmount: T('Shuma', 'Amount', 'Betrag'),
      emptyState: T('Nuk ka transaksione me keto kritere', 'No transactions match these criteria', 'Keine Transaktionen entsprechen diesen Kriterien'),
      daysLabel: T('{{count}} dite', '{{count}} days', '{{count}} Tage'),
      depositLabel: T('Depozite: {{amount}} EUR', 'Deposit: {{amount}} EUR', 'Kaution: {{amount}} EUR'),
      methodStripe: T('Karte Krediti', 'Credit card', 'Kreditkarte'),
      methodPaypal: T('PayPal', 'PayPal', 'PayPal'),
      methodBank: T('Transfer Bankar', 'Bank transfer', 'Banküberweisung'),
      methodCash: T('Kesh', 'Cash', 'Bar'),
      statusPaid: T('Paguar', 'Paid', 'Bezahlt'),
      statusPending: T('Ne pritje', 'Pending', 'Ausstehend'),
      statusFailed: T('Deshtuar', 'Failed', 'Fehlgeschlagen'),
      csvId: T('ID', 'ID', 'ID'),
      csvInvoice: T('Fatura', 'Invoice', 'Rechnung'),
      csvDate: T('Data', 'Date', 'Datum'),
      csvClient: T('Klienti', 'Client', 'Kunde'),
      csvEmail: T('Email', 'Email', 'E-Mail'),
      csvCompany: T('Kompania', 'Company', 'Unternehmen'),
      csvVehicle: T('Automjeti', 'Vehicle', 'Fahrzeug'),
      csvDays: T('Dite', 'Days', 'Tage'),
      csvMethod: T('Metoda', 'Method', 'Methode'),
      csvStatus: T('Statusi', 'Status', 'Status'),
      csvAmount: T('Shuma', 'Amount', 'Betrag'),
      csvFilename: T('transaksionet', 'transactions', 'transaktionen'),
    },
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
