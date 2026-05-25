// Shton perkthime per AdminHomepage, AdminInvoices dhe AdminInvoiceSettings
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'i18n', 'locales');

function T(sq, en, de) { return { sq, en, de }; }

const KEYS = {
  adminDash: {
    homepage: {
      // Page header
      title: T('Menaxhimi i Ballines', 'Homepage Management', 'Startseiten-Verwaltung'),
      subtitle: T('Kontrollo komplet Homepage-in, logon, navigimin dhe seksionet', 'Fully control the homepage, logo, navigation and sections', 'Steuern Sie die Startseite, das Logo, die Navigation und die Abschnitte vollständig'),
      editingLanguage: T('Po editon ne gjuhen: <strong>{{lang}}</strong>. Ndrysho gjuhen nga Navbar per te edituar gjuhe tjeter.', 'Editing in language: <strong>{{lang}}</strong>. Change the language from the navbar to edit another language.', 'Sie bearbeiten in der Sprache: <strong>{{lang}}</strong>. Ändern Sie die Sprache in der Navigationsleiste, um eine andere Sprache zu bearbeiten.'),
      // Save button
      saving: T('Duke ruajtur...', 'Saving...', 'Wird gespeichert...'),
      savedShort: T('U ruajt!', 'Saved!', 'Gespeichert!'),
      saveChanges: T('Ruaj ndryshimet', 'Save changes', 'Änderungen speichern'),
      saveError: T('Gabim: {{msg}}', 'Error: {{msg}}', 'Fehler: {{msg}}'),

      // Tabs
      sectionsLabel: T('Seksionet', 'Sections', 'Abschnitte'),
      tabHero: T('Hero / Balline', 'Hero / Homepage', 'Hero / Startseite'),
      tabHeroDesc: T('Imazhi, titulli, butoni i kerkimit', 'Image, title, search button', 'Bild, Titel, Suchschaltfläche'),
      tabLogo: T('Logo & Emri', 'Logo & Name', 'Logo & Name'),
      tabLogoDesc: T('Logo e platformes ne te gjitha vendet', 'Platform logo across all locations', 'Plattform-Logo an allen Orten'),
      tabNavbar: T('Shiriti Kryesor', 'Main Navbar', 'Hauptnavigation'),
      tabNavbarDesc: T('Lidhjet dhe butonat e navigimit', 'Navigation links and buttons', 'Navigationslinks und Schaltflächen'),
      tabSections: T('Seksionet', 'Sections', 'Abschnitte'),
      tabSectionsDesc: T('Visibility dhe titujt e seksioneve', 'Visibility and section titles', 'Sichtbarkeit und Abschnittstitel'),
      tabCategories: T('Kategorite e Automjeteve', 'Vehicle Categories', 'Fahrzeugkategorien'),
      tabCategoriesDesc: T('Menaxho kategorite qe shfaqen ne homepage', 'Manage categories shown on the homepage', 'Kategorien verwalten, die auf der Startseite angezeigt werden'),

      // Hero editor
      heroBackgroundImage: T('Imazhi i Sfondit', 'Background Image', 'Hintergrundbild'),
      changeImage: T('Ndrysho imazhin', 'Change image', 'Bild ändern'),
      noImageUploaded: T('Nuk ka imazh te ngarkuar', 'No image uploaded', 'Kein Bild hochgeladen'),
      uploading: T('Duke ngarkuar...', 'Uploading...', 'Wird hochgeladen...'),
      uploadPhoto: T('Ngarko foto', 'Upload photo', 'Foto hochladen'),
      orEnterImageUrl: T('ose vendos URL te imazhit...', 'or enter image URL...', 'oder geben Sie die Bild-URL ein...'),
      overlayOpacity: T('Errësia e sfondit: {{value}}%', 'Background overlay: {{value}}%', 'Hintergrund-Verdunkelung: {{value}}%'),
      overlayMin: T('0% (transparent)', '0% (transparent)', '0% (transparent)'),
      overlayMax: T('95% (shume i errët)', '95% (very dark)', '95% (sehr dunkel)'),
      imagePositionDesktop: T('Pozicioni i imazhit (Desktop)', 'Image position (Desktop)', 'Bildposition (Desktop)'),
      posCenter: T('Qendër', 'Center', 'Mitte'),
      posLeft: T('Majtas', 'Left', 'Links'),
      posRight: T('Djathtas', 'Right', 'Rechts'),
      posTop: T('Lart', 'Top', 'Oben'),
      posBottom: T('Poshtë', 'Bottom', 'Unten'),
      pos30Left: T('30% nga e majta', '30% from left', '30% von links'),
      pos50Center: T('Qendër (50%)', 'Center (50%)', 'Mitte (50%)'),
      pos70Left: T('70% nga e majta', '70% from left', '70% von links'),
      pos70LeftRecommended: T('70% nga e majta (rekomandohet)', '70% from left (recommended)', '70% von links (empfohlen)'),
      posCenterTop: T('Qendër lart', 'Center top', 'Mitte oben'),
      posCenterBottom: T('Qendër poshtë', 'Center bottom', 'Mitte unten'),

      mobileImageTitle: T('Imazhi për Mobile / Tablet', 'Mobile / Tablet Image', 'Bild für Mobile / Tablet'),
      mobileImageDesc: T('Ngarko një foto të dedikuar për ekrane më të vogla (vertikale ose katror funksionon më mirë). Nëse e lë bosh, do të përdoret foto kryesore me pozicionim të rregulluar.', 'Upload a dedicated photo for smaller screens (vertical or square works best). If left empty, the main photo with adjusted positioning will be used.', 'Laden Sie ein spezielles Foto für kleinere Bildschirme hoch (vertikal oder quadratisch funktioniert am besten). Wenn leer gelassen, wird das Hauptfoto mit angepasster Positionierung verwendet.'),
      change: T('Ndrysho', 'Change', 'Ändern'),
      noMobilePhoto: T('Nuk ka foto mobile', 'No mobile photo', 'Kein Mobilfoto'),
      noMobilePhotoDesc: T('Do të përdoret foto kryesore me pozicionin e rregulluar', 'The main photo with adjusted position will be used', 'Das Hauptfoto mit angepasster Position wird verwendet'),
      uploadMobilePhoto: T('Ngarko foto mobile', 'Upload mobile photo', 'Mobilfoto hochladen'),
      imagePositionMobile: T('Pozicioni i imazhit (Mobile / Tablet)', 'Image position (Mobile / Tablet)', 'Bildposition (Mobile / Tablet)'),
      mobilePositionHelp: T('Përcakton se cila pjesë e fotos qëndron e dukshme në ekrane të vogla.', 'Determines which part of the photo remains visible on small screens.', 'Bestimmt, welcher Teil des Fotos auf kleinen Bildschirmen sichtbar bleibt.'),

      titleSubtitleSection: T('Titulli dhe Nëntitulli', 'Title and Subtitle', 'Titel und Untertitel'),
      titleLine1: T('Titulli - Rreshti 1', 'Title - Line 1', 'Titel - Zeile 1'),
      titleLine2: T('Titulli - Rreshti 2 (gradient)', 'Title - Line 2 (gradient)', 'Titel - Zeile 2 (Gradient)'),
      subtitleLabel: T('Nëntitulli', 'Subtitle', 'Untertitel'),
      badgeTextLabel: T('Badge text (opsional, shfaqet mbi titull)', 'Badge text (optional, shown above title)', 'Badge-Text (optional, über dem Titel angezeigt)'),
      titleLine1Placeholder: T('Udhetoni me stil,', 'Travel in style,', 'Reisen Sie mit Stil,'),
      titleLine2Placeholder: T('rezervoni me lehte.', 'book with ease.', 'einfach buchen.'),
      badgePlaceholder: T('p.sh: #1 Platforma ne Kosove', 'e.g.: #1 Platform in Kosovo', 'z. B.: Plattform Nr. 1 im Kosovo'),

      searchFormSection: T('Forma e Kerkimit', 'Search Form', 'Suchformular'),
      placeholderCity: T('Placeholder - Qyteti', 'Placeholder - City', 'Platzhalter - Stadt'),
      labelPickupDate: T('Label - Data e marrjes', 'Label - Pickup date', 'Bezeichnung - Abholdatum'),
      labelReturnDate: T('Label - Data e kthimit', 'Label - Return date', 'Bezeichnung - Rückgabedatum'),
      searchButtonText: T('Teksti i butonit Kerko', 'Search button text', 'Text der Suchschaltfläche'),

      trustBadgesSection: T('Trust Badges', 'Trust Badges', 'Vertrauens-Badges'),
      showTrustBadges: T('Shfaq buxhetat e besimit nen formen e kerkimit', 'Show trust badges below the search form', 'Vertrauens-Badges unter dem Suchformular anzeigen'),
      badge1Checkmark: T('Badge 1 (Checkmark)', 'Badge 1 (Checkmark)', 'Badge 1 (Häkchen)'),
      badge2Shield: T('Badge 2 (Shield)', 'Badge 2 (Shield)', 'Badge 2 (Schild)'),
      badge3Clock: T('Badge 3 (Clock)', 'Badge 3 (Clock)', 'Badge 3 (Uhr)'),
      badge4Heart: T('Badge 4 (Heart)', 'Badge 4 (Heart)', 'Badge 4 (Herz)'),

      heroPreviewLabel: T('Parashikim Hero', 'Hero Preview', 'Hero-Vorschau'),
      previewTitleLine1: T('Titulli i rreshtit 1', 'Title line 1', 'Titel Zeile 1'),
      previewTitleLine2: T('Titulli i rreshtit 2', 'Title line 2', 'Titel Zeile 2'),

      // Logo editor
      logoSectionTitle: T('Logo e Platformes', 'Platform Logo', 'Plattform-Logo'),
      currentLogo: T('Logo aktuale', 'Current logo', 'Aktuelles Logo'),
      noLogo: T('Pa logo', 'No logo', 'Kein Logo'),
      uploadLogo: T('Ngarko logon', 'Upload logo', 'Logo hochladen'),
      logoUploadHint: T('PNG me sfond transparent rekomandohet. Maks: 5MB', 'PNG with transparent background recommended. Max: 5MB', 'PNG mit transparentem Hintergrund empfohlen. Max: 5MB'),
      orLogoUrl: T('ose URL e logos', 'or logo URL', 'oder Logo-URL'),
      siteNameLabel: T('Emri i platformes (shfaqet prane logos)', 'Platform name (shown next to logo)', 'Plattformname (neben dem Logo angezeigt)'),
      showIcon: T('Shfaq ikonën / logon e ngarkuar', 'Show uploaded icon / logo', 'Hochgeladenes Symbol / Logo anzeigen'),
      showText: T('Shfaq emrin e platformes prane logos', 'Show platform name next to logo', 'Plattformname neben dem Logo anzeigen'),

      navbarPreview: T('Parashikim ne Navbar', 'Navbar Preview', 'Navbar-Vorschau'),
      previewTransparent: T('Transparent (mbi Hero)', 'Transparent (over Hero)', 'Transparent (über Hero)'),
      previewWhite: T('E bardhe (scroll)', 'White (scroll)', 'Weiß (Scroll)'),
      previewFooter: T('Footer', 'Footer', 'Fußzeile'),

      // Navbar editor
      navLinksSection: T('Lidhjet e Navigimit', 'Navigation Links', 'Navigationslinks'),
      showVehiclesLink: T("Shfaq linkun 'Automjetet'", "Show 'Vehicles' link", "'Fahrzeuge'-Link anzeigen"),
      linkText: T('Teksti i linkut', 'Link text', 'Link-Text'),
      authButtonsSection: T('Butonat e Hyrjes', 'Login Buttons', 'Anmelde-Schaltflächen'),
      loginButtonText: T('Teksti "Kycu"', '"Log in" text', '"Anmelden"-Text'),
      registerButtonText: T('Teksti "Regjistrohu"', '"Register" text', '"Registrieren"-Text'),
      registerButtonColor: T('Ngjyra e butonit Regjistrohu', 'Register button color', 'Farbe der Registrieren-Schaltfläche'),
      colorPrimary: T('Kaltërt (Primary)', 'Blue (Primary)', 'Blau (Primär)'),
      colorDark: T('E zezë (Dark)', 'Black (Dark)', 'Schwarz (Dunkel)'),
      colorAccent: T('Portokalli (Accent)', 'Orange (Accent)', 'Orange (Akzent)'),
      colorGreen: T('Gjelbërt', 'Green', 'Grün'),
      navbarPreviewLabel: T('Parashikim Navbar', 'Navbar Preview', 'Navbar-Vorschau'),

      // Sections editor
      sectionsVisibility: T('Visibility dhe Titujt e Seksioneve', 'Section Visibility and Titles', 'Sichtbarkeit und Titel der Abschnitte'),
      sectionCategories: T('Kategorite e automjeteve', 'Vehicle categories', 'Fahrzeugkategorien'),
      sectionFeatured: T('Automjetet e zgjedhura', 'Featured vehicles', 'Empfohlene Fahrzeuge'),
      sectionHowItWorks: T('Si funksionon', 'How it works', 'So funktioniert es'),
      sectionTestimonials: T('Pershtypjet e klienteve', 'Customer testimonials', 'Kundenstimmen'),
      sectionCompanyCta: T('Thirrja per kompanite (CTA)', 'Companies call to action (CTA)', 'Aufruf für Unternehmen (CTA)'),
      sectionTrustBanner: T('Baneri i Besimit (fund ballina)', 'Trust banner (homepage bottom)', 'Vertrauensbanner (unten auf der Startseite)'),
      mainTitle: T('Titulli kryesor', 'Main title', 'Haupttitel'),
      subtitleBadge: T('Nëntitulli (badge sipër)', 'Subtitle (badge above)', 'Untertitel (Badge darüber)'),
      changesNoticeTitle: T('Ndryshimet hyjnë menjëherë pas ruajtjes', 'Changes take effect immediately after saving', 'Änderungen werden sofort nach dem Speichern wirksam'),
      changesNoticeDesc: T('Seksionet e çaktivizuara fshihen nga Homepage. Titujt e perditesuar shfaqen menjëherë per vizituesit e rinj.', 'Disabled sections are hidden from the homepage. Updated titles appear immediately for new visitors.', 'Deaktivierte Abschnitte werden auf der Startseite ausgeblendet. Aktualisierte Titel werden für neue Besucher sofort angezeigt.'),

      // Categories editor
      categoriesTitle: T('Kategorite e Automjeteve', 'Vehicle Categories', 'Fahrzeugkategorien'),
      categoriesSubtitle: T('Cdo kategori e aktivizuar shfaqet ne homepage me numrin e automjeteve te publikuara dhe cmimin minimal te llogaritur automatikisht.', 'Each activated category appears on the homepage with the number of published vehicles and the minimum price calculated automatically.', 'Jede aktivierte Kategorie wird auf der Startseite mit der Anzahl der veröffentlichten Fahrzeuge und dem automatisch berechneten Mindestpreis angezeigt.'),
      addCategory: T('Shto kategori', 'Add category', 'Kategorie hinzufügen'),
      noRowUpdated: T('Nuk u perditesua asnje rresht. Kontrollo lejet (RLS) ose nese je i kyqur si super admin.', 'No row was updated. Check permissions (RLS) or whether you are logged in as super admin.', 'Keine Zeile wurde aktualisiert. Überprüfen Sie die Berechtigungen (RLS) oder ob Sie als Super-Administrator angemeldet sind.'),
      confirmDeleteCategory: T('Fshi kategorine "{{key}}"?', 'Delete category "{{key}}"?', 'Kategorie "{{key}}" löschen?'),
      keyValidationError: T('Celesi duhet vetem shkronja te vogla, numra ose underscore.', 'The key must contain only lowercase letters, numbers or underscores.', 'Der Schlüssel darf nur Kleinbuchstaben, Zahlen oder Unterstriche enthalten.'),
      newCategory: T('Kategori e re', 'New category', 'Neue Kategorie'),
      keyLabel: T('Celesi (lowercase, pa hapesira)', 'Key (lowercase, no spaces)', 'Schlüssel (Kleinbuchstaben, keine Leerzeichen)'),
      keyPlaceholder: T('p.sh. cabriolet', 'e.g. cabriolet', 'z. B. cabriolet'),
      imageUrl: T('URL e imazhit', 'Image URL', 'Bild-URL'),
      nameSq: T('Emri (Shqip)', 'Name (Albanian)', 'Name (Albanisch)'),
      nameEn: T('Emri (English)', 'Name (English)', 'Name (Englisch)'),
      nameDe: T('Emri (Deutsch)', 'Name (German)', 'Name (Deutsch)'),
      defaultMinPrice: T('Cmimi minimal default (EUR/dite)', 'Default minimum price (EUR/day)', 'Standard-Mindestpreis (EUR/Tag)'),
      defaultMinPriceShort: T('Cmimi minimal default (EUR)', 'Default minimum price (EUR)', 'Standard-Mindestpreis (EUR)'),
      saveBtn: T('Ruaj', 'Save', 'Speichern'),
      cancelBtn: T('Anulo', 'Cancel', 'Abbrechen'),
      publishedVehiclesCount: T('{{count}} automjete te publikuara', '{{count}} published vehicles', '{{count}} veröffentlichte Fahrzeuge'),
      activeLabel: T('Aktive', 'Active', 'Aktiv'),
      langSq: T('Shqip', 'Albanian', 'Albanisch'),
      langEn: T('English', 'English', 'Englisch'),
      langDe: T('Deutsch', 'German', 'Deutsch'),
      moveUp: T('Lart', 'Up', 'Hoch'),
      moveDown: T('Posht', 'Down', 'Runter'),
      deleteTooltip: T('Fshi', 'Delete', 'Löschen'),
      savedBtn: T('U ruajt', 'Saved', 'Gespeichert'),
      saveCategory: T('Ruaj kategorine', 'Save category', 'Kategorie speichern'),
    },

    invoices: {
      // Status
      statusDraft: T('Draft', 'Draft', 'Entwurf'),
      statusIssued: T('Leshuar', 'Issued', 'Ausgestellt'),
      statusPaid: T('Paguar', 'Paid', 'Bezahlt'),
      statusCancelled: T('Anuluar', 'Cancelled', 'Storniert'),

      // Page header
      title: T('Faturat', 'Invoices', 'Rechnungen'),
      subtitle: T('Menaxhimi i te gjitha faturave te platformes', 'Management of all platform invoices', 'Verwaltung aller Plattformrechnungen'),
      export: T('Eksporto', 'Export', 'Exportieren'),
      csvFilename: T('faturat', 'invoices', 'rechnungen'),

      // Stats
      statTotal: T('Totali', 'Total', 'Gesamt'),
      statPaid: T('Te paguara', 'Paid', 'Bezahlt'),
      statIssued: T('Leshuara', 'Issued', 'Ausgestellt'),
      statDraft: T('Draft', 'Draft', 'Entwurf'),

      // Filters
      searchPlaceholder: T('Nr. fature, klient, firma...', 'Invoice no., client, company...', 'Rechnungsnr., Kunde, Unternehmen...'),
      filterAll: T('Te gjitha ({{count}})', 'All ({{count}})', 'Alle ({{count}})'),
      filterStatus: T('{{label}} ({{count}})', '{{label}} ({{count}})', '{{label}} ({{count}})'),

      // Empty
      noInvoices: T('Nuk ka fatura', 'No invoices', 'Keine Rechnungen'),

      // Table headers
      thInvoiceNumber: T('Nr. Fature', 'Invoice No.', 'Rechnungsnr.'),
      thClient: T('Klienti', 'Client', 'Kunde'),
      thCompany: T('Firma', 'Company', 'Unternehmen'),
      thVehicle: T('Automjeti', 'Vehicle', 'Fahrzeug'),
      thTotal: T('Totali', 'Total', 'Gesamt'),
      thDate: T('Data', 'Date', 'Datum'),
      thStatus: T('Statusi', 'Status', 'Status'),

      // Detail modal
      detailInvoice: T('Fatura #{{number}}', 'Invoice #{{number}}', 'Rechnung Nr. {{number}}'),
      detailClient: T('Klienti', 'Client', 'Kunde'),
      detailCompany: T('Firma', 'Company', 'Unternehmen'),
      detailBookingTitle: T('Detajet e Rezervimit', 'Booking Details', 'Buchungsdetails'),
      detailVehicle: T('Automjeti', 'Vehicle', 'Fahrzeug'),
      detailPickup: T('Marrja', 'Pickup', 'Abholung'),
      detailReturn: T('Kthimi', 'Return', 'Rückgabe'),
      detailDays: T('Ditet', 'Days', 'Tage'),
      detailDaysValue: T('{{count}} dite', '{{count}} days', '{{count}} Tage'),
      detailPricePerDay: T('Cmimi per dite', 'Price per day', 'Preis pro Tag'),
      detailSubtotal: T('Nentotali', 'Subtotal', 'Zwischensumme'),
      detailDeposit: T('Depozita', 'Deposit', 'Kaution'),
      detailTotal: T('Totali', 'Total', 'Gesamt'),
      markAsPaid: T('Sheno si Paguar', 'Mark as Paid', 'Als bezahlt markieren'),
      cancelInvoice: T('Anulo Faturen', 'Cancel Invoice', 'Rechnung stornieren'),
    },

    invoiceSettings: {
      // Page header
      title: T('Cilesimet e Fatures', 'Invoice Settings', 'Rechnungseinstellungen'),
      subtitle: T('Konfiguroni formatin dhe te dhenat e faturave', 'Configure the format and details of invoices', 'Format und Details der Rechnungen konfigurieren'),
      saving: T('Duke ruajtur...', 'Saving...', 'Wird gespeichert...'),
      saved: T('U ruajt!', 'Saved!', 'Gespeichert!'),
      save: T('Ruaj', 'Save', 'Speichern'),

      // Tabs
      tabCompany: T('Te dhenat e firmes', 'Company details', 'Unternehmensdaten'),
      tabNumbering: T('Numerimi', 'Numbering', 'Nummerierung'),
      tabPayment: T('Pagesa & TVSH', 'Payment & VAT', 'Zahlung & MwSt.'),
      tabAppearance: T('Pamja', 'Appearance', 'Erscheinungsbild'),

      // Company tab
      companyTitle: T('Te dhenat e firmes emetuese', 'Issuing company details', 'Angaben des ausstellenden Unternehmens'),
      companyName: T('Emri i firmes', 'Company name', 'Firmenname'),
      companyNui: T('NUI / NIPT', 'Business ID / Tax ID', 'Steuernummer / USt-IdNr.'),
      companyVat: T('Nr. TVSH', 'VAT No.', 'USt-IdNr.'),
      companyEmail: T('Email', 'Email', 'E-Mail'),
      companyPhone: T('Telefon', 'Phone', 'Telefon'),
      companyWebsite: T('Website', 'Website', 'Webseite'),
      companyAddress: T('Adresa', 'Address', 'Adresse'),

      // Numbering tab
      numberingTitle: T('Numerimi i faturave', 'Invoice numbering', 'Rechnungsnummerierung'),
      prefix: T('Prefiksi', 'Prefix', 'Präfix'),
      startNumber: T('Numri fillestar', 'Starting number', 'Startnummer'),
      exampleInvoice: T('Shembull fature:', 'Example invoice:', 'Beispielrechnung:'),
      autoIssue: T('Leshim automatik', 'Auto-issue', 'Automatische Ausstellung'),
      autoIssueDesc: T('Fatura leshohet automatikisht pas konfirmimit te rezervimit', 'The invoice is issued automatically after the booking is confirmed', 'Die Rechnung wird nach der Bestätigung der Buchung automatisch ausgestellt'),

      // Payment tab
      paymentTitle: T('Kushtet e pagesave & TVSH', 'Payment terms & VAT', 'Zahlungsbedingungen & MwSt.'),
      currency: T('Valuta', 'Currency', 'Währung'),
      paymentTermsDays: T('Afati pageses (dite)', 'Payment terms (days)', 'Zahlungsfrist (Tage)'),
      vatActive: T('TVSH aktive', 'VAT active', 'MwSt. aktiv'),
      vatActiveDesc: T('Perfshij TVSH ne faturat', 'Include VAT on invoices', 'MwSt. auf Rechnungen einbeziehen'),
      vatRate: T('Norma TVSH (%)', 'VAT rate (%)', 'MwSt.-Satz (%)'),
      bankDetailsTitle: T('Te dhenat bankare (per faturat)', 'Bank details (for invoices)', 'Bankverbindung (für Rechnungen)'),
      bankName: T('Emri i bankes', 'Bank name', 'Bankname'),
      iban: T('IBAN', 'IBAN', 'IBAN'),
      swift: T('SWIFT/BIC', 'SWIFT/BIC', 'SWIFT/BIC'),

      // Appearance tab
      appearanceTitle: T('Pamja e fatures', 'Invoice appearance', 'Rechnungsdesign'),
      logoUrl: T('URL Logo (per fatura)', 'Logo URL (for invoices)', 'Logo-URL (für Rechnungen)'),
      footerText: T('Tekst ne fund te fatures', 'Invoice footer text', 'Fußzeilentext der Rechnung'),
      footerPlaceholder: T('Faleminderit per besimin tuaj!', 'Thank you for your trust!', 'Vielen Dank für Ihr Vertrauen!'),
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
