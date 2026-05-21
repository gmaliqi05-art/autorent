// Shton perkthime per AdminSubscriptions, AdminFinancials dhe AdminEmailTemplates
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'i18n', 'locales');

function T(sq, en, de) { return { sq, en, de }; }

const KEYS = {
  adminDash: {
    subscriptions: {
      // Page header
      title: T('Planet e Abonimit', 'Subscription Plans', 'Abonnementspläne'),
      subtitle: T(
        'Menaxhoni planet, cmimet dhe abonuesit e platformes',
        'Manage plans, pricing, and subscribers across the platform',
        'Verwalten Sie Pläne, Preise und Abonnenten der Plattform'
      ),
      exportCsv: T('Exporto CSV', 'Export CSV', 'CSV exportieren'),
      newPlan: T('Plan i ri', 'New plan', 'Neuer Plan'),

      // Stat cards
      monthlyRevenue: T('Te ardhura mujore', 'Monthly revenue', 'Monatlicher Umsatz'),
      yearlyProjection: T('Projeksion vjetor', 'Yearly projection', 'Jährliche Hochrechnung'),
      activeSubscribers: T('Abonues aktive', 'Active subscribers', 'Aktive Abonnenten'),
      expiringIn30: T('Skadojne 30 dite', 'Expiring in 30 days', 'Laufen in 30 Tagen ab'),

      // Tabs
      tabPlans: T('Planet ({{count}})', 'Plans ({{count}})', 'Pläne ({{count}})'),
      tabSubscribers: T('Abonuesit ({{count}})', 'Subscribers ({{count}})', 'Abonnenten ({{count}})'),

      // Edit form
      formTitleNew: T('Plan i ri', 'New plan', 'Neuer Plan'),
      formTitleEdit: T('Ndrysho planin', 'Edit plan', 'Plan bearbeiten'),
      labelName: T('Emri i planit', 'Plan name', 'Planname'),
      placeholderName: T('p.sh. Premium', 'e.g. Premium', 'z. B. Premium'),
      labelDescription: T('Pershkrimi', 'Description', 'Beschreibung'),
      placeholderDescription: T('Pershkrim i shkurter', 'Short description', 'Kurzbeschreibung'),
      labelPriceMonthly: T('Cmimi mujor (EUR)', 'Monthly price (EUR)', 'Monatspreis (EUR)'),
      labelPriceYearly: T('Cmimi vjetor (EUR)', 'Yearly price (EUR)', 'Jahrespreis (EUR)'),
      labelYearlyDiscount: T('Zbritja vjetore (%)', 'Yearly discount (%)', 'Jahresrabatt (%)'),
      labelMaxVehicles: T(
        'Max automjete (-1 = pa limit)',
        'Max vehicles (-1 = unlimited)',
        'Max. Fahrzeuge (-1 = unbegrenzt)'
      ),
      labelMaxBookings: T(
        'Max rezervime/muaj (-1 = pa limit)',
        'Max bookings/month (-1 = unlimited)',
        'Max. Buchungen/Monat (-1 = unbegrenzt)'
      ),
      labelSortOrder: T('Renditja', 'Sort order', 'Sortierreihenfolge'),
      toggleActive: T('Aktiv', 'Active', 'Aktiv'),
      togglePopular: T('I Popullarizuar', 'Popular', 'Beliebt'),
      labelFeatures: T('Vecorite e planit', 'Plan features', 'Planmerkmale'),
      placeholderAddFeature: T('Shto nje vecori...', 'Add a feature...', 'Funktion hinzufügen...'),
      addFeature: T('Shto', 'Add', 'Hinzufügen'),
      saving: T('Duke ruajtur...', 'Saving...', 'Wird gespeichert...'),
      save: T('Ruaj', 'Save', 'Speichern'),
      cancel: T('Anulo', 'Cancel', 'Abbrechen'),

      // Plan cards
      mostPopular: T('Plani me i Popullar', 'Most popular plan', 'Beliebtester Plan'),
      inactive: T('Joaktiv', 'Inactive', 'Inaktiv'),
      pricePerMonth: T('EUR/muaj', 'EUR/month', 'EUR/Monat'),
      pricePerYear: T('EUR/vit', 'EUR/year', 'EUR/Jahr'),
      pricePerYearBilled: T('{{price}} EUR faturim vjetor', '{{price}} EUR billed yearly', '{{price}} EUR jährlich abgerechnet'),
      free: T('Pa pagesë', 'Free', 'Kostenlos'),
      subscribersLabel: T('Abonues', 'Subscribers', 'Abonnenten'),
      revenuePerMonthShort: T('Te ardhura/muaj', 'Revenue/month', 'Umsatz/Monat'),
      vehiclesLabel: T('Automjete', 'Vehicles', 'Fahrzeuge'),
      unlimitedVehicles: T('Automjete pa limit', 'Unlimited vehicles', 'Unbegrenzte Fahrzeuge'),
      upToVehicles: T('Deri ne {{count}} automjete', 'Up to {{count}} vehicles', 'Bis zu {{count}} Fahrzeuge'),
      vehiclesCount: T('{{count}} automjete', '{{count}} vehicles', '{{count}} Fahrzeuge'),
      unlimitedBookings: T('Rezervime pa limit', 'Unlimited bookings', 'Unbegrenzte Buchungen'),
      bookingsPerMonth: T('{{count}} rezervime/muaj', '{{count}} bookings/month', '{{count}} Buchungen/Monat'),
      moreFeatures: T('+{{count}} vecori te tjera', '+{{count}} more features', '+{{count}} weitere Funktionen'),
      edit: T('Ndrysho', 'Edit', 'Bearbeiten'),

      // Confirm dialog
      confirmDelete: T(
        'Jeni te sigurt qe deshironi te fshini kete plan?',
        'Are you sure you want to delete this plan?',
        'Möchten Sie diesen Plan wirklich löschen?'
      ),

      // Subscribers table
      colCompany: T('Kompania', 'Company', 'Unternehmen'),
      colPlan: T('Plani', 'Plan', 'Plan'),
      colPrice: T('Cmimi', 'Price', 'Preis'),
      colStatus: T('Statusi', 'Status', 'Status'),
      colExpires: T('Skadon', 'Expires', 'Läuft ab'),
      colActions: T('Veprimet', 'Actions', 'Aktionen'),
      emptyCompanies: T(
        'Nuk ka kompani te regjistruara',
        'No registered companies',
        'Keine registrierten Unternehmen'
      ),
      noPlan: T('Pa plan', 'No plan', 'Kein Plan'),
      expiringSoon: T('Skadon se shpejti', 'Expires soon', 'Läuft bald ab'),

      // Subscription statuses
      statusActive: T('Aktiv', 'Active', 'Aktiv'),
      statusTrial: T('Prove', 'Trial', 'Testphase'),
      statusExpired: T('Skaduar', 'Expired', 'Abgelaufen'),
      statusCancelled: T('Anuluar', 'Cancelled', 'Gekündigt'),
      statusPending: T('Ne pritje', 'Pending', 'Ausstehend'),

      // Detail modal
      currentPlan: T('Plani aktual', 'Current plan', 'Aktueller Plan'),
      monthlyPriceLabel: T('Cmimi mujor', 'Monthly price', 'Monatspreis'),
      expiresOn: T('Skadon me', 'Expires on', 'Läuft ab am'),
      contact: T('Kontakti', 'Contact', 'Kontakt'),
      contactPhone: T('Tel: {{value}}', 'Phone: {{value}}', 'Tel.: {{value}}'),
      contactAddress: T('Adresa: {{value}}', 'Address: {{value}}', 'Adresse: {{value}}'),
      contactLicense: T('Licensa: {{value}}', 'License: {{value}}', 'Lizenz: {{value}}'),
      planLimits: T('Limitet e planit', 'Plan limits', 'Plan-Limits'),
      maxVehiclesShort: T('Automjete max', 'Max vehicles', 'Max. Fahrzeuge'),
      maxBookingsShort: T('Rezervime/muaj max', 'Max bookings/month', 'Max. Buchungen/Monat'),
      changePlan: T('Ndrysho planin', 'Change plan', 'Plan ändern'),

      // Assign plan modal
      assignTitle: T('Cakto plan abonimi', 'Assign subscription plan', 'Abonnementplan zuweisen'),
      assignSelectPlan: T('Zgjedh planin', 'Select plan', 'Plan auswählen'),
      assignPickPlan: T('-- Zgjedh planin --', '-- Select plan --', '-- Plan auswählen --'),
      assignBilling: T('Faturimi', 'Billing', 'Abrechnung'),
      billingMonthly: T('Mujor', 'Monthly', 'Monatlich'),
      billingYearly: T('Vjetor', 'Yearly', 'Jährlich'),
      billingMonthlyLabel: T('Faturim mujor', 'Monthly billing', 'Monatliche Abrechnung'),
      billingYearlyLabel: T('Faturim vjetor', 'Yearly billing', 'Jährliche Abrechnung'),
      perMonth: T('muaj', 'month', 'Monat'),
      perYear: T('vit', 'year', 'Jahr'),
      assignButton: T('Cakto planin', 'Assign plan', 'Plan zuweisen'),

      // Homepage preview
      previewTitle: T(
        'Pamja paraprake e planeve ne Homepage',
        'Homepage pricing preview',
        'Vorschau der Preise auf der Startseite'
      ),
      previewSubtitle: T(
        'Kjo eshte saktesisht si shfaqen planet ne faqen kryesore per vizitoret e ri.',
        'This is exactly how plans appear on the homepage for new visitors.',
        'So werden die Pläne neuen Besuchern auf der Startseite angezeigt.'
      ),
      previewDiscountBadge: T('-20%', '-20%', '-20%'),
      startFree: T('Fillo falas', 'Start free', 'Kostenlos starten'),
      subscribeNow: T('Abonohu tani', 'Subscribe now', 'Jetzt abonnieren'),
    },

    financials: {
      // Page header
      title: T('Raportet financiare', 'Financial reports', 'Finanzberichte'),
      subtitle: T(
        'Te ardhurat, abonimi, dhe statistikat e rezervimeve',
        'Revenue, subscriptions, and booking statistics',
        'Umsatz, Abonnements und Buchungsstatistiken'
      ),

      // Period filter
      periodWeek: T('Java', 'Week', 'Woche'),
      periodMonth: T('Muaji', 'Month', 'Monat'),
      periodYear: T('Viti', 'Year', 'Jahr'),
      periodAll: T('Gjithsej', 'All time', 'Gesamt'),

      // Top stat cards
      bookingRevenue: T('Te ardhura nga rezervimet', 'Booking revenue', 'Buchungsumsatz'),
      subscriptionRevenue: T('Te ardhura nga abonimet', 'Subscription revenue', 'Abonnement-Umsatz'),
      totalBookings: T('Gjithsej rezervime', 'Total bookings', 'Buchungen gesamt'),
      avgBookingValue: T('Vlera mesatare', 'Average value', 'Durchschnittswert'),
      successRate: T('Norma e suksesit', 'Success rate', 'Erfolgsquote'),
      revenueGrowth: T('Rritja e te ardhurave', 'Revenue growth', 'Umsatzwachstum'),
      conversionRate: T('Norma e konversionit', 'Conversion rate', 'Conversion-Rate'),
      cancelRate: T('Norma e anulimeve', 'Cancellation rate', 'Stornierungsquote'),
      revenuePerMonth: T('{{value}} EUR/muaj', '{{value}} EUR/month', '{{value}} EUR/Monat'),

      // Booking distribution
      bookingDistribution: T('Shperndarja e rezervimeve', 'Booking distribution', 'Buchungsverteilung'),
      statusCompleted: T('Perfunduara', 'Completed', 'Abgeschlossen'),
      statusActive: T('Aktive', 'Active', 'Aktiv'),
      statusConfirmed: T('Konfirmuara', 'Confirmed', 'Bestätigt'),
      statusPending: T('Ne pritje', 'Pending', 'Ausstehend'),
      statusCancelled: T('Anuluara', 'Cancelled', 'Storniert'),

      // Active subscriptions
      activeSubscriptions: T('Abonimet aktive', 'Active subscriptions', 'Aktive Abonnements'),
      planPricePerMonth: T('{{price}} EUR/muaj', '{{price}} EUR/month', '{{price}} EUR/Monat'),
      companiesLabel: T('kompani', 'companies', 'Unternehmen'),
      totalMonthlyRevenue: T('Gjithsej te ardhura mujore:', 'Total monthly revenue:', 'Monatsumsatz gesamt:'),

      // Payment methods
      paymentMethods: T('Metodat e pageses', 'Payment methods', 'Zahlungsmethoden'),
      noPaymentsForPeriod: T(
        'Nuk ka pagesa per kete periudhe',
        'No payments for this period',
        'Keine Zahlungen für diesen Zeitraum'
      ),
      paymentsCount: T('{{count}} pagesa', '{{count}} payments', '{{count}} Zahlungen'),
      pmStripe: T('Karte Krediti', 'Credit Card', 'Kreditkarte'),
      pmPaypal: T('PayPal', 'PayPal', 'PayPal'),
      pmBankTransfer: T('Transfer Bankar', 'Bank Transfer', 'Banküberweisung'),
      pmCash: T('Kesh', 'Cash', 'Bar'),

      // Payment status
      paymentStatus: T('Statusi i pagesave', 'Payment status', 'Zahlungsstatus'),
      psPaid: T('Paguar', 'Paid', 'Bezahlt'),
      psPending: T('Ne pritje', 'Pending', 'Ausstehend'),
      psFailed: T('Deshtuar', 'Failed', 'Fehlgeschlagen'),
      bookingsCount: T('{{count}} rezervime', '{{count}} bookings', '{{count}} Buchungen'),

      // Vehicles and categories
      topVehicles: T('Top 10 automjetet', 'Top 10 vehicles', 'Top 10 Fahrzeuge'),
      noDataForPeriod: T(
        'Nuk ka te dhena per kete periudhe',
        'No data for this period',
        'Keine Daten für diesen Zeitraum'
      ),
      categoryPerformance: T('Performanca sipas kategorise', 'Performance by category', 'Leistung nach Kategorie'),
      bookingsLabel: T('rezervime', 'bookings', 'Buchungen'),

      // Categories
      catEkonomike: T('Ekonomike', 'Economy', 'Economy'),
      catKompakte: T('Kompakte', 'Compact', 'Kompakt'),
      catSedan: T('Sedan', 'Sedan', 'Limousine'),
      catSuv: T('SUV', 'SUV', 'SUV'),
      catLuksoz: T('Luksoz', 'Luxury', 'Luxus'),
      catMinivan: T('Minivan', 'Minivan', 'Minivan'),
      catFurgon: T('Furgon', 'Van', 'Transporter'),

      // Clients and geographic
      topClients: T('Top 10 klientet', 'Top 10 clients', 'Top 10 Kunden'),
      geoDistribution: T('Shperndarja gjeografike', 'Geographic distribution', 'Geografische Verteilung'),

      // Invoices report
      invoicesReport: T('Raporti i faturave', 'Invoices report', 'Rechnungsbericht'),
      totalInvoices: T('Gjithsej fatura', 'Total invoices', 'Rechnungen gesamt'),
      paidInvoicesLabel: T('{{count}} fatura te paguara', '{{count}} paid invoices', '{{count}} bezahlte Rechnungen'),
      issuedInvoicesLabel: T('{{count}} fatura te leshuara', '{{count}} issued invoices', '{{count}} ausgestellte Rechnungen'),
      draftInvoicesLabel: T('{{count}} drafte', '{{count}} drafts', '{{count}} Entwürfe'),
      colInvoiceNumber: T('Nr. Fatures', 'Invoice no.', 'Rechnungsnr.'),
      colClient: T('Klienti', 'Client', 'Kunde'),
      colCompany: T('Kompania', 'Company', 'Unternehmen'),
      colInvoiceStatus: T('Statusi', 'Status', 'Status'),
      colAmount: T('Shuma', 'Amount', 'Betrag'),
      colDate: T('Data', 'Date', 'Datum'),
      invStatusDraft: T('Draft', 'Draft', 'Entwurf'),
      invStatusIssued: T('Leshuar', 'Issued', 'Ausgestellt'),
      invStatusPaid: T('Paguar', 'Paid', 'Bezahlt'),
      invStatusCancelled: T('Anuluar', 'Cancelled', 'Storniert'),

      // Revenue by company table
      revenueByCompany: T('Te ardhurat sipas kompanise', 'Revenue by company', 'Umsatz nach Unternehmen'),
      colBookings: T('Rezervime', 'Bookings', 'Buchungen'),
      colRevenue: T('Te ardhurat', 'Revenue', 'Umsatz'),
      colPlan: T('Plani', 'Plan', 'Plan'),
      colStatus: T('Status', 'Status', 'Status'),
      badgeTop: T('Top', 'Top', 'Top'),
      badgeActive: T('Aktiv', 'Active', 'Aktiv'),
    },

    emailTemplates: {
      // Page header
      title: T('Template-t e Emaileve', 'Email Templates', 'E-Mail-Vorlagen'),
      subtitle: T(
        'Menaxho, edito dhe aktivizo template-t e emaileve te platformes',
        'Manage, edit, and activate the platform email templates',
        'Verwalten, bearbeiten und aktivieren Sie die E-Mail-Vorlagen der Plattform'
      ),
      newTemplate: T('Template i ri', 'New template', 'Neue Vorlage'),

      // Stats
      statTotal: T('Totali', 'Total', 'Gesamt'),
      statActive: T('Aktive', 'Active', 'Aktiv'),
      statInactive: T('Joaktive', 'Inactive', 'Inaktiv'),

      // Filters
      searchPlaceholder: T('Kerko template...', 'Search templates...', 'Vorlagen suchen...'),
      filterAll: T('Te gjitha', 'All', 'Alle'),
      filterActive: T('Aktive', 'Active', 'Aktiv'),
      filterInactive: T('Joaktive', 'Inactive', 'Inaktiv'),

      // Table headers
      colTemplate: T('Template', 'Template', 'Vorlage'),
      colSubject: T('Subjekti', 'Subject', 'Betreff'),
      colDescription: T('Pershkrimi', 'Description', 'Beschreibung'),
      colStatus: T('Statusi', 'Status', 'Status'),
      colActions: T('Veprimet', 'Actions', 'Aktionen'),

      // Empty state
      emptyState: T('Nuk u gjet asnje template', 'No templates found', 'Keine Vorlagen gefunden'),

      // Row actions
      titleActivate: T('Aktivizo', 'Activate', 'Aktivieren'),
      titleDeactivate: T('Deaktivizo', 'Deactivate', 'Deaktivieren'),
      titlePreview: T('Shiko preview', 'Preview', 'Vorschau'),
      titleEdit: T('Edito', 'Edit', 'Bearbeiten'),
      titleDelete: T('Fshi', 'Delete', 'Löschen'),

      // Modal titles
      modalCreate: T('Krijo template te ri', 'Create new template', 'Neue Vorlage erstellen'),
      modalEdit: T('Edito template-in', 'Edit template', 'Vorlage bearbeiten'),
      previewTitle: T('Preview Template', 'Template preview', 'Vorlagenvorschau'),

      // Form fields
      labelTemplateKey: T('Çelesi i template-it', 'Template key', 'Vorlagenschlüssel'),
      placeholderTemplateKey: T('p.sh. special_offer', 'e.g. special_offer', 'z. B. special_offer'),
      helpTemplateKey: T(
        'Vetem shkronja te vogla dhe nënviza. P.sh: booking_confirmation, welcome_client',
        'Only lowercase letters and underscores. E.g.: booking_confirmation, welcome_client',
        'Nur Kleinbuchstaben und Unterstriche. Z. B.: booking_confirmation, welcome_client'
      ),
      labelDescription: T('Pershkrimi', 'Description', 'Beschreibung'),
      placeholderDescription: T(
        'Pershkruani qellimin e ketij template-i...',
        'Describe the purpose of this template...',
        'Beschreiben Sie den Zweck dieser Vorlage...'
      ),
      labelSubject: T('Subjekti', 'Subject', 'Betreff'),
      helpSubjectPre: T(
        'Perdorni ',
        'Use ',
        'Verwenden Sie '
      ),
      helpSubjectPost: T(
        ' per te inseruar vlera dinamike',
        ' to insert dynamic values',
        ', um dynamische Werte einzufügen'
      ),
      labelHtml: T('HTML Template', 'HTML template', 'HTML-Vorlage'),
      labelText: T('Text Template (opsional)', 'Text template (optional)', 'Text-Vorlage (optional)'),
      placeholderText: T(
        'Version tekst i emailit per klientet pa HTML...',
        'Text version of the email for clients without HTML...',
        'Textversion der E-Mail für Kunden ohne HTML...'
      ),
      toggleActive: T('Aktiv', 'Active', 'Aktiv'),
      toggleInactive: T('Joaktiv', 'Inactive', 'Inaktiv'),
      toggleActiveDesc: T(
        'Emailet do te dergohen me kete template',
        'Emails will be sent using this template',
        'E-Mails werden mit dieser Vorlage versendet'
      ),
      toggleInactiveDesc: T(
        'Template-i nuk do te perdoret',
        'The template will not be used',
        'Die Vorlage wird nicht verwendet'
      ),

      // Buttons
      cancel: T('Anulo', 'Cancel', 'Abbrechen'),
      saving: T('Duke ruajtur...', 'Saving...', 'Wird gespeichert...'),
      saveChanges: T('Ruaj ndryshimet', 'Save changes', 'Änderungen speichern'),
      close: T('Mbyll', 'Close', 'Schließen'),
      editTemplate: T('Edito template-in', 'Edit template', 'Vorlage bearbeiten'),

      // Preview labels
      previewSubject: T('Subjekti:', 'Subject:', 'Betreff:'),
      previewNoHtml: T('Pa HTML', 'No HTML', 'Kein HTML'),
      previewNoText: T('Nuk ka version tekst.', 'No text version available.', 'Keine Textversion verfügbar.'),

      // Delete dialog
      deleteTitle: T('Fshi template-in?', 'Delete template?', 'Vorlage löschen?'),
      deleteDesc: T(
        'Ky veprim eshte i pakthyeshem. Template-i do te fshihet pergjithmone.',
        'This action is irreversible. The template will be permanently deleted.',
        'Diese Aktion ist unwiderruflich. Die Vorlage wird dauerhaft gelöscht.'
      ),
      delete: T('Fshi', 'Delete', 'Löschen'),

      // Feedback
      errorRequiredFields: T(
        'Plotesoni te gjithe fushat e detyrueshme.',
        'Fill in all required fields.',
        'Bitte füllen Sie alle Pflichtfelder aus.'
      ),
      errorDuplicateKey: T(
        'Gabim gjate ruajtjes. Çelesi i template-it mund te jete duplikat.',
        'Error while saving. The template key may be a duplicate.',
        'Fehler beim Speichern. Der Vorlagenschlüssel ist möglicherweise bereits vergeben.'
      ),
      successCreated: T(
        'Template-i u krijua me sukses!',
        'Template created successfully!',
        'Vorlage erfolgreich erstellt!'
      ),
      errorSaving: T(
        'Gabim gjate ruajtjes.',
        'Error while saving.',
        'Fehler beim Speichern.'
      ),
      successUpdated: T(
        'Template-i u perditesua!',
        'Template updated!',
        'Vorlage aktualisiert!'
      ),

      // Template key labels (UI-only — used to humanize template_key column)
      tkBookingConfirmationClient: T('Konfirmim rezervimi (Klient)', 'Booking confirmation (Client)', 'Buchungsbestätigung (Kunde)'),
      tkBookingConfirmationCompany: T('Njoftim rezervimi (Kompani)', 'Booking notification (Company)', 'Buchungsbenachrichtigung (Unternehmen)'),
      tkBookingApproved: T('Rezervim aprovuar', 'Booking approved', 'Buchung genehmigt'),
      tkBookingRejected: T('Rezervim refuzuar', 'Booking rejected', 'Buchung abgelehnt'),
      tkBookingCompleted: T('Rezervim perfunduar', 'Booking completed', 'Buchung abgeschlossen'),
      tkBookingCancelled: T('Rezervim anuluar', 'Booking cancelled', 'Buchung storniert'),
      tkPickupReminder: T('Kujtese marrje', 'Pickup reminder', 'Abholerinnerung'),
      tkReviewRequest: T('Kerkese vleresim', 'Review request', 'Bewertungsanfrage'),
      tkCompanyApproved: T('Kompani aprovuar', 'Company approved', 'Unternehmen genehmigt'),
      tkCompanyRejected: T('Kompani refuzuar', 'Company rejected', 'Unternehmen abgelehnt'),
      tkCompanySuspended: T('Kompani pezulluar', 'Company suspended', 'Unternehmen gesperrt'),
      tkWelcomeClient: T('Mireseardhje klient', 'Welcome client', 'Willkommen Kunde'),
      tkWelcomeCompany: T('Mireseardhje kompani', 'Welcome company', 'Willkommen Unternehmen'),
      tkBookingInvoice: T('Fature rezervimi', 'Booking invoice', 'Buchungsrechnung'),
      tkSpecialOffer: T('Oferte speciale', 'Special offer', 'Sonderangebot'),
      tkInactiveClientReminder: T('Kujtese klient joaktiv', 'Inactive client reminder', 'Erinnerung an inaktive Kunden'),
      tkPaymentReceived: T('Pagese e konfirmuar', 'Payment received', 'Zahlung erhalten'),
      tkSubscriptionExpiring: T('Aboniment duke skaduar', 'Subscription expiring', 'Abonnement läuft ab'),
      tkSubscriptionExpired: T('Aboniment i skaduar', 'Subscription expired', 'Abonnement abgelaufen'),
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

const keys = listKeys(KEYS);
console.log(`Added ${keys.length} keys:`);
keys.forEach(k => console.log('  ' + k));
