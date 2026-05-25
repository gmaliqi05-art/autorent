// Shton perkthime per AdminChat, AdminSendNotification, AdminEmails, AdminAnalytics
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'i18n', 'locales');

function T(sq, en, de) { return { sq, en, de }; }

const KEYS = {
  adminDash: {
    chat: {
      title: T('Menaxhimi i Chat AI', 'AI Chat management', 'KI-Chat-Verwaltung'),
      subtitle: T('{{count}} pergjigje automatike', '{{count}} automatic responses', '{{count}} automatische Antworten'),
      addResponse: T('Shto pergjigje', 'Add response', 'Antwort hinzufügen'),
      newResponse: T('Pergjigje e re', 'New response', 'Neue Antwort'),
      editResponse: T('Ndrysho pergjigjen', 'Edit response', 'Antwort bearbeiten'),
      labelCategory: T('Kategoria', 'Category', 'Kategorie'),
      labelPriority: T('Prioriteti (me i larte = me e rendesishme)', 'Priority (higher = more important)', 'Priorität (höher = wichtiger)'),
      labelQuestion: T('Pyetja', 'Question', 'Frage'),
      placeholderQuestion: T('p.sh. Si mund te bej nje rezervim?', 'e.g. How can I make a booking?', 'z.B. Wie kann ich eine Buchung vornehmen?'),
      labelAnswer: T('Pergjigja', 'Answer', 'Antwort'),
      placeholderAnswer: T('Pergjigja e detajuar...', 'Detailed answer...', 'Detaillierte Antwort...'),
      labelKeywords: T('Fjalet kyqe (per matching)', 'Keywords (for matching)', 'Schlüsselwörter (für Matching)'),
      placeholderKeyword: T('Shto fjale kyqe...', 'Add keyword...', 'Schlüsselwort hinzufügen...'),
      addKeyword: T('Shto', 'Add', 'Hinzufügen'),
      active: T('Aktive', 'Active', 'Aktiv'),
      save: T('Ruaj', 'Save', 'Speichern'),
      cancel: T('Anulo', 'Cancel', 'Abbrechen'),
      searchPlaceholder: T('Kerko pyetje ose pergjigje...', 'Search question or answer...', 'Frage oder Antwort suchen...'),
      confirmDelete: T('Fshij kete pergjigje?', 'Delete this response?', 'Diese Antwort löschen?'),
      priorityLabel: T('Prioriteti: {{value}}', 'Priority: {{value}}', 'Priorität: {{value}}'),
      inactiveBadge: T('JOAKTIVE', 'INACTIVE', 'INAKTIV'),
      usedTimes: T('Perdorur {{count}}x', 'Used {{count}}x', 'Verwendet {{count}}x'),
      pageInfo: T('Faqja {{page}} nga {{total}} ({{count}} gjithsej)', 'Page {{page}} of {{total}} ({{count}} total)', 'Seite {{page}} von {{total}} ({{count}} gesamt)'),
      previous: T('Para', 'Previous', 'Zurück'),
      next: T('Tjetra', 'Next', 'Weiter'),
      catAll: T('Te gjitha', 'All', 'Alle'),
      catGeneral: T('Te pergjithshme', 'General', 'Allgemein'),
      catBookings: T('Rezervime', 'Bookings', 'Buchungen'),
      catVehicles: T('Automjete', 'Vehicles', 'Fahrzeuge'),
      catPrices: T('Cmime', 'Prices', 'Preise'),
      catPayments: T('Pagesa', 'Payments', 'Zahlungen'),
      catAccounts: T('Llogari', 'Accounts', 'Konten'),
      catCompanies: T('Kompani', 'Companies', 'Unternehmen'),
      catInsurance: T('Sigurime', 'Insurance', 'Versicherung'),
      catDocuments: T('Dokumente', 'Documents', 'Dokumente'),
      catLocations: T('Lokacione', 'Locations', 'Standorte'),
      catSupport: T('Suport', 'Support', 'Support'),
      catTerms: T('Kushte', 'Terms', 'Bedingungen'),
      catTechnical: T('Teknike', 'Technical', 'Technisch'),
      catComplaints: T('Ankesa', 'Complaints', 'Beschwerden'),
    },
    sendNotif: {
      pageTitle: T('Dergo Njoftime', 'Send Notifications', 'Benachrichtigungen senden'),
      subtitle: T('Dergo njoftime ne kohe reale tek perdoruesit', 'Send real-time notifications to users', 'Senden Sie Echtzeit-Benachrichtigungen an Benutzer'),
      successMessage: T('Njoftimi u dergua me sukses!', 'Notification sent successfully!', 'Benachrichtigung erfolgreich gesendet!'),
      composeTitle: T('Kompozo Njoftimin', 'Compose Notification', 'Benachrichtigung verfassen'),
      labelTitle: T('Titulli i njoftimit *', 'Notification title *', 'Titel der Benachrichtigung *'),
      placeholderTitle: T('P.sh. Oferte e re, Ndryshim i politikave...', 'e.g. New offer, Policy update...', 'z.B. Neues Angebot, Richtlinienänderung...'),
      labelMessage: T('Mesazhi *', 'Message *', 'Nachricht *'),
      placeholderMessage: T('Shkruani mesazhin e plote te njoftimit...', 'Write the full notification message...', 'Schreiben Sie die vollständige Benachrichtigung...'),
      labelType: T('Lloji i njoftimit', 'Notification type', 'Benachrichtigungstyp'),
      typeInfo: T('Informacion', 'Information', 'Information'),
      typeSuccess: T('Sukses', 'Success', 'Erfolg'),
      typeWarning: T('Paralajmerim', 'Warning', 'Warnung'),
      typeError: T('Gabim/Urgjent', 'Error/Urgent', 'Fehler/Dringend'),
      labelRecipients: T('Destinataret', 'Recipients', 'Empfänger'),
      groupAll: T('Te gjithe perdoruesit', 'All users', 'Alle Benutzer'),
      groupClients: T('Klientet', 'Clients', 'Kunden'),
      groupCompanies: T('Firmat', 'Companies', 'Unternehmen'),
      groupSpecific: T('Perdorues specifik', 'Specific user', 'Bestimmter Benutzer'),
      usersCount: T('{{count}} perdorues', '{{count}} users', '{{count}} Benutzer'),
      searchUsersLabel: T('Kerko perdorues', 'Search users', 'Benutzer suchen'),
      searchUsersPlaceholder: T('Emri ose email...', 'Name or email...', 'Name oder E-Mail...'),
      noName: T('(pa emer)', '(no name)', '(kein Name)'),
      sendingTo: T('Do te dergohet tek:', 'Will be sent to:', 'Wird gesendet an:'),
      oneUser: T('1 perdorues', '1 user', '1 Benutzer'),
      pickUserPrompt: T('— zgjidhni perdoruesin', '— select a user', '— Benutzer auswählen'),
      sending: T('Duke derguar...', 'Sending...', 'Wird gesendet...'),
      send: T('Dergo Njoftimin', 'Send Notification', 'Benachrichtigung senden'),
    },
    emails: {
      title: T('Historiku i Emaileve', 'Email history', 'E-Mail-Verlauf'),
      subtitle: T('Monitoroni te gjitha emailet e derguara nga platforma', 'Monitor all emails sent by the platform', 'Überwachen Sie alle von der Plattform gesendeten E-Mails'),
      pageTitle: T('Emailet', 'Emails', 'E-Mails'),
      statTotal: T('Totali', 'Total', 'Gesamt'),
      statSent: T('Derguar', 'Sent', 'Gesendet'),
      statFailed: T('Deshtuar', 'Failed', 'Fehlgeschlagen'),
      statPending: T('Ne pritje', 'Pending', 'Ausstehend'),
      searchPlaceholder: T('Kerko sipas emailit, emrit ose subjektit...', 'Search by email, name or subject...', 'Nach E-Mail, Name oder Betreff suchen...'),
      allStatuses: T('Te gjitha statuset', 'All statuses', 'Alle Status'),
      allTypes: T('Te gjitha llojet', 'All types', 'Alle Typen'),
      empty: T('Nuk ka emaile', 'No emails', 'Keine E-Mails'),
      thRecipient: T('Marresi', 'Recipient', 'Empfänger'),
      thType: T('Lloji', 'Type', 'Typ'),
      thSubject: T('Subjekti', 'Subject', 'Betreff'),
      thStatus: T('Statusi', 'Status', 'Status'),
      thDate: T('Data', 'Date', 'Datum'),
      statusSent: T('Derguar', 'Sent', 'Gesendet'),
      statusFailed: T('Deshtuar', 'Failed', 'Fehlgeschlagen'),
      statusPending: T('Ne pritje', 'Pending', 'Ausstehend'),
      statusQueued: T('Ne radhe', 'Queued', 'In Warteschlange'),
      filterSent: T('Derguar', 'Sent', 'Gesendet'),
      filterFailed: T('Deshtuar', 'Failed', 'Fehlgeschlagen'),
      filterPending: T('Ne pritje', 'Pending', 'Ausstehend'),
      filterQueued: T('Ne radhe', 'Queued', 'In Warteschlange'),
      typeBookingConfirmationClient: T('Konfirmim rezervimi (Klient)', 'Booking confirmation (Client)', 'Buchungsbestätigung (Kunde)'),
      typeBookingConfirmationCompany: T('Njoftim rezervimi (Kompani)', 'Booking notification (Company)', 'Buchungsbenachrichtigung (Unternehmen)'),
      typeBookingApproved: T('Rezervim aprovuar', 'Booking approved', 'Buchung genehmigt'),
      typeBookingRejected: T('Rezervim refuzuar', 'Booking rejected', 'Buchung abgelehnt'),
      typeBookingCompleted: T('Rezervim perfunduar', 'Booking completed', 'Buchung abgeschlossen'),
      typeBookingCancelled: T('Rezervim anuluar', 'Booking cancelled', 'Buchung storniert'),
      typePickupReminder: T('Kujtese marrje', 'Pickup reminder', 'Abholerinnerung'),
      typeReviewRequest: T('Kerkese per vleresim', 'Review request', 'Bewertungsanfrage'),
      typeCompanyApproved: T('Kompani aprovuar', 'Company approved', 'Unternehmen genehmigt'),
      typeCompanyRejected: T('Kompani refuzuar', 'Company rejected', 'Unternehmen abgelehnt'),
      typeCompanySuspended: T('Kompani pezulluar', 'Company suspended', 'Unternehmen ausgesetzt'),
      typeWelcomeClient: T('Mireseardhje klient', 'Welcome client', 'Willkommen Kunde'),
      typeWelcomeCompany: T('Mireseardhje kompani', 'Welcome company', 'Willkommen Unternehmen'),
      typeBookingInvoice: T('Fature rezervimi', 'Booking invoice', 'Buchungsrechnung'),
    },
    analytics: {
      pageTitle: T('Analitika', 'Analytics', 'Analytik'),
      title: T('Analitika e Platformes', 'Platform Analytics', 'Plattform-Analytik'),
      subtitle: T('Statistika dhe trende te pergjithshme', 'General statistics and trends', 'Allgemeine Statistiken und Trends'),
      period7days: T('7 Dite', '7 Days', '7 Tage'),
      period30days: T('30 Dite', '30 Days', '30 Tage'),
      period90days: T('90 Dite', '90 Days', '90 Tage'),
      period12months: T('12 Muaj', '12 Months', '12 Monate'),
      statNewUsers: T('Perdorues te rinj', 'New users', 'Neue Benutzer'),
      statNewCompanies: T('Firma te reja', 'New companies', 'Neue Unternehmen'),
      statBookings: T('Rezervime', 'Bookings', 'Buchungen'),
      statRevenue: T('Te Ardhura', 'Revenue', 'Umsatz'),
      completionRate: T('Shkalla e kompletimit', 'Completion rate', 'Abschlussrate'),
      cancellationRate: T('Shkalla e anulimit', 'Cancellation rate', 'Stornierungsrate'),
      avgBookingValue: T('Vlera mesatare e rez.', 'Average booking value', 'Durchschn. Buchungswert'),
      bookingsAndRevenue: T('Rezervimet dhe te ardhurat', 'Bookings and revenue', 'Buchungen und Umsatz'),
      legendRevenue: T('Te ardhura', 'Revenue', 'Umsatz'),
      legendBookings: T('Rezervime', 'Bookings', 'Buchungen'),
      topCompanies: T('Firmat kryesore', 'Top companies', 'Top-Unternehmen'),
      bookingsShort: T('rez.', 'bookings', 'Buch.'),
      noData: T('Nuk ka te dhena', 'No data', 'Keine Daten'),
      vehiclesByCategory: T('Automjetet sipas kategorise', 'Vehicles by category', 'Fahrzeuge nach Kategorie'),
      tooltipRevenue: T('€{{amount}}', '€{{amount}}', '€{{amount}}'),
      tooltipBookings: T('{{count}} rez.', '{{count}} bookings', '{{count}} Buch.'),
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
