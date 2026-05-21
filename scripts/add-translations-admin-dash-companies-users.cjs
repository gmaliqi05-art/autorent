// Shton perkthime per AdminDashboard, AdminCompanies dhe AdminUsers
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'i18n', 'locales');

function T(sq, en, de) { return { sq, en, de }; }

const KEYS = {
  adminDash: {
    common: {
      all: T('Te gjitha', 'All', 'Alle'),
      viewAll: T('Shiko te gjitha', 'View all', 'Alle anzeigen'),
      close: T('Mbyll', 'Close', 'Schließen'),
      cancel: T('Anulo', 'Cancel', 'Abbrechen'),
      exportCsv: T('Exporto CSV', 'Export CSV', 'CSV exportieren'),
      ofTotal: T('nga', 'of', 'von'),
      total: T('gjithsej', 'total', 'insgesamt'),
      noResults: T('Asgje per te shfaqur', 'Nothing to display', 'Nichts anzuzeigen'),
    },
    statusCompany: {
      pending: T('Ne pritje', 'Pending', 'Ausstehend'),
      approved: T('Aprovuar', 'Approved', 'Genehmigt'),
      rejected: T('Refuzuar', 'Rejected', 'Abgelehnt'),
      suspended: T('Pezulluar', 'Suspended', 'Ausgesetzt'),
    },
    statusBooking: {
      pending: T('Ne pritje', 'Pending', 'Ausstehend'),
      confirmed: T('Konfirmuar', 'Confirmed', 'Bestätigt'),
      active: T('Aktiv', 'Active', 'Aktiv'),
      completed: T('Perfunduar', 'Completed', 'Abgeschlossen'),
      cancelled: T('Anuluar', 'Cancelled', 'Storniert'),
    },
    statusInvoice: {
      draft: T('Draft', 'Draft', 'Entwurf'),
      issued: T('Leshuar', 'Issued', 'Ausgestellt'),
      paid: T('Paguar', 'Paid', 'Bezahlt'),
      cancelled: T('Anuluar', 'Cancelled', 'Storniert'),
    },
    role: {
      client: T('Klient', 'Client', 'Kunde'),
      company_admin: T('Kompani', 'Company', 'Unternehmen'),
      super_admin: T('Admin', 'Admin', 'Admin'),
      superAdminFull: T('Super Admin', 'Super Admin', 'Super Admin'),
    },
    subscription: {
      active: T('Aktiv', 'Active', 'Aktiv'),
      inactive: T('Joaktiv', 'Inactive', 'Inaktiv'),
      expired: T('Skaduar', 'Expired', 'Abgelaufen'),
      trial: T('Prove', 'Trial', 'Test'),
    },
    dashboard: {
      title: T('Administrimi i platformes', 'Platform administration', 'Plattform-Administration'),
      greeting: T('Pershendetje {{name}}, ketu menaxhoni platformen.', 'Hello {{name}}, manage the platform here.', 'Hallo {{name}}, hier verwalten Sie die Plattform.'),
      statUsers: T('Perdorues', 'Users', 'Benutzer'),
      statUsersSub: T('{{clients}} kliente, {{companies}} kompani', '{{clients}} clients, {{companies}} companies', '{{clients}} Kunden, {{companies}} Unternehmen'),
      statCompanies: T('Kompani', 'Companies', 'Unternehmen'),
      statCompaniesSub: T('{{active}} aktive, {{pending}} ne pritje', '{{active}} active, {{pending}} pending', '{{active}} aktiv, {{pending}} ausstehend'),
      statVehicles: T('Automjete', 'Vehicles', 'Fahrzeuge'),
      statBookings: T('Rezervime', 'Bookings', 'Buchungen'),
      statBookingsSub: T('{{active}} aktive', '{{active}} active', '{{active}} aktiv'),
      revenueCollected: T('Pagesat e mbledhura', 'Collected payments', 'Eingenommene Zahlungen'),
      revenuePending: T('Ne pritje per pagese', 'Pending payment', 'Ausstehende Zahlung'),
      revenueSubscriptions: T('Te ardhura nga abonimet', 'Subscription revenue', 'Abonnement-Einnahmen'),
      revenueInvoices: T('Fatura ({{paid}} te paguara)', 'Invoices ({{paid}} paid)', 'Rechnungen ({{paid}} bezahlt)'),
      revenuePerMonth: T('{{amount}} EUR/muaj', '{{amount}} EUR/month', '{{amount}} EUR/Monat'),
      quickPlans: T('Planet', 'Plans', 'Pläne'),
      quickHomepage: T('Faqja kryesore', 'Homepage', 'Startseite'),
      quickChat: T('Chat AI', 'AI Chat', 'KI-Chat'),
      quickReports: T('Raportet', 'Reports', 'Berichte'),
      quickAds: T('Reklamat', 'Ads', 'Anzeigen'),
      quickSettings: T('Cilesimet', 'Settings', 'Einstellungen'),
      quickTotal: T('{{count}} gjithsej', '{{count}} total', '{{count}} insgesamt'),
      companiesTitle: T('Kompanite ({{count}})', 'Companies ({{count}})', 'Unternehmen ({{count}})'),
      usersTitle: T('Perdoruesit ({{count}})', 'Users ({{count}})', 'Benutzer ({{count}})'),
      recentBookings: T('Rezervimet e fundit', 'Recent bookings', 'Aktuelle Buchungen'),
      recentInvoices: T('Faturat e fundit', 'Recent invoices', 'Aktuelle Rechnungen'),
      noBookings: T('Nuk ka rezervime', 'No bookings', 'Keine Buchungen'),
      noInvoices: T('Nuk ka fatura', 'No invoices', 'Keine Rechnungen'),
      bookingDays: T('{{count}} dite', '{{count}} days', '{{count}} Tage'),
    },
    companies: {
      title: T('Menaxhimi i kompanive', 'Company management', 'Unternehmensverwaltung'),
      subtitle: T('Shikoni, aprovoni dhe menaxhoni te gjitha kompanite e platformes', 'View, approve and manage all platform companies', 'Alle Plattform-Unternehmen anzeigen, genehmigen und verwalten'),
      statusUpdateSuccess: T('Statusi u ndryshua me sukses!', 'Status updated successfully!', 'Status erfolgreich aktualisiert!'),
      planAssignSuccess: T('Plani "{{name}}" u caktua me sukses!', 'Plan "{{name}}" assigned successfully!', 'Plan "{{name}}" erfolgreich zugewiesen!'),
      defaultRejectReason: T('Informacioni i dhene nuk eshte i plote.', 'The information provided is incomplete.', 'Die bereitgestellten Informationen sind unvollständig.'),
      defaultSuspendReason: T('Shkelje e kushteve.', 'Terms violation.', 'Verstoß gegen die Bedingungen.'),
      statTotal: T('Gjithsej kompani', 'Total companies', 'Unternehmen gesamt'),
      statTotalSub: T('{{count}} aprovuara', '{{count}} approved', '{{count}} genehmigt'),
      statPending: T('Ne pritje aprovimi', 'Pending approval', 'Genehmigung ausstehend'),
      statPendingSub: T('Kerkojne veprim', 'Require action', 'Erfordern Aktion'),
      statRevenue: T('Te ardhura totale', 'Total revenue', 'Gesamtumsatz'),
      statRevenueSub: T('Rezervime te perfunduara', 'Completed bookings', 'Abgeschlossene Buchungen'),
      statActiveBookings: T('Rezervime aktive', 'Active bookings', 'Aktive Buchungen'),
      statActiveBookingsSub: T('Ne progres tani', 'In progress now', 'Derzeit laufend'),
      searchPlaceholder: T('Kerko emrin, email, qytetin, nr. licence...', 'Search name, email, city, license no...', 'Name, E-Mail, Stadt, Lizenz-Nr. suchen...'),
      anySubscription: T('Cdo abonim', 'Any subscription', 'Jedes Abonnement'),
      filterAll: T('Te gjitha', 'All', 'Alle'),
      filterPending: T('Ne pritje', 'Pending', 'Ausstehend'),
      filterApproved: T('Aprovuara', 'Approved', 'Genehmigt'),
      filterRejected: T('Refuzuara', 'Rejected', 'Abgelehnt'),
      filterSuspended: T('Pezulluara', 'Suspended', 'Ausgesetzt'),
      emptyState: T('Nuk u gjet asnje kompani', 'No companies found', 'Keine Unternehmen gefunden'),
      thCompany: T('Kompania', 'Company', 'Unternehmen'),
      thStatus: T('Statusi', 'Status', 'Status'),
      thSubscription: T('Abonimi', 'Subscription', 'Abonnement'),
      thVehicles: T('Automjete', 'Vehicles', 'Fahrzeuge'),
      thBookings: T('Rezervime', 'Bookings', 'Buchungen'),
      thRevenue: T('Te ardhura', 'Revenue', 'Umsatz'),
      thActions: T('Veprime', 'Actions', 'Aktionen'),
      daysLeft: T('{{days}}d mbeten', '{{days}}d left', 'Noch {{days}} Tage'),
      published: T('{{count}} pub.', '{{count}} pub.', '{{count}} pub.'),
      activeShort: T('{{count}} aktive', '{{count}} active', '{{count}} aktiv'),
      pendingShort: T('{{amount}} pritje', '{{amount}} pending', '{{amount}} ausstehend'),
      detailsTitle: T('Detajet', 'Details', 'Details'),
      assignPlanTooltip: T('Cakto plan', 'Assign plan', 'Plan zuweisen'),
      approveTooltip: T('Aprovo', 'Approve', 'Genehmigen'),
      rejectTooltip: T('Refuzo', 'Reject', 'Ablehnen'),
      suspendTooltip: T('Pezullo', 'Suspend', 'Aussetzen'),
      reactivateTooltip: T('Riaktivizo', 'Reactivate', 'Reaktivieren'),
      pageRange: T('{{from}}–{{to}} nga {{total}}', '{{from}}–{{to}} of {{total}}', '{{from}}–{{to}} von {{total}}'),
      tabOverview: T('Permbledhje', 'Overview', 'Übersicht'),
      tabVehicles: T('Automjete ({{count}})', 'Vehicles ({{count}})', 'Fahrzeuge ({{count}})'),
      tabBookings: T('Rezervime ({{count}})', 'Bookings ({{count}})', 'Buchungen ({{count}})'),
      tabSubscription: T('Abonimi', 'Subscription', 'Abonnement'),
      approve: T('Aprovo', 'Approve', 'Genehmigen'),
      reject: T('Refuzo', 'Reject', 'Ablehnen'),
      suspend: T('Pezullo', 'Suspend', 'Aussetzen'),
      reactivate: T('Riaktivizo', 'Reactivate', 'Reaktivieren'),
      close: T('Mbyll', 'Close', 'Schließen'),
      assignPlanTitle: T('Cakto plan abonimi', 'Assign subscription plan', 'Abonnementplan zuweisen'),
      companyLabel: T('Kompania:', 'Company:', 'Unternehmen:'),
      choosePlan: T('Zgjidh planin', 'Choose plan', 'Plan wählen'),
      planDetails: T('{{price}} EUR/mujore · max {{max}} vetura', '{{price}} EUR/month · max {{max}} vehicles', '{{price}} EUR/Monat · max. {{max}} Fahrzeuge'),
      unlimited: T('∞', '∞', '∞'),
      billingCycle: T('Cikli i faturimit', 'Billing cycle', 'Abrechnungszyklus'),
      billingMonthly: T('Mujore', 'Monthly', 'Monatlich'),
      billingYearly: T('Vjetore (-20%)', 'Yearly (-20%)', 'Jährlich (-20%)'),
      assignBtn: T('Cakto planin', 'Assign plan', 'Plan zuweisen'),
      rejectModalTitle: T('Refuzo kompanine', 'Reject company', 'Unternehmen ablehnen'),
      rejectReasonLabel: T('Arsyeja e refuzimit', 'Rejection reason', 'Ablehnungsgrund'),
      rejectReasonPlaceholder: T('Shkruani arsyen qe do i dergohet kompanise me email...', 'Write the reason that will be emailed to the company...', 'Geben Sie den Grund ein, der dem Unternehmen per E-Mail gesendet wird...'),
      rejectCompanyBtn: T('Refuzo kompanine', 'Reject company', 'Unternehmen ablehnen'),
      detailVehicles: T('Automjete', 'Vehicles', 'Fahrzeuge'),
      detailVehiclesSub: T('{{count}} pub.', '{{count}} pub.', '{{count}} pub.'),
      detailBookings: T('Rezervime', 'Bookings', 'Buchungen'),
      detailBookingsSub: T('{{count}} aktive', '{{count}} active', '{{count}} aktiv'),
      detailRevenue: T('Te ardhura', 'Revenue', 'Umsatz'),
      detailRevenueSub: T('{{amount}} € pritje', '{{amount}} € pending', '{{amount}} € ausstehend'),
      detailInfoTitle: T('Informacioni i kompanise', 'Company information', 'Unternehmensinformationen'),
      detailEmail: T('Email', 'Email', 'E-Mail'),
      detailPhone: T('Telefoni', 'Phone', 'Telefon'),
      detailAddress: T('Adresa', 'Address', 'Adresse'),
      detailLicense: T('Nr. licences', 'License no.', 'Lizenz-Nr.'),
      detailRating: T('Vleresimi', 'Rating', 'Bewertung'),
      detailRatingValue: T('{{rating}} / 5 ({{count}})', '{{rating}} / 5 ({{count}})', '{{rating}} / 5 ({{count}})'),
      detailRegistered: T('Regjistruar', 'Registered', 'Registriert'),
      detailGps: T('GPS', 'GPS', 'GPS'),
      detailGpsNone: T('Pa lokacion', 'No location', 'Kein Standort'),
      detailCancellations: T('Anulime', 'Cancellations', 'Stornierungen'),
      detailDescription: T('Pershkrimi', 'Description', 'Beschreibung'),
      vehiclesEmpty: T('Nuk ka automjete te regjistruara.', 'No vehicles registered.', 'Keine Fahrzeuge registriert.'),
      vehiclePerDay: T('{{price}} EUR/dite', '{{price}} EUR/day', '{{price}} EUR/Tag'),
      vehiclePublished: T('Publikuar', 'Published', 'Veröffentlicht'),
      vehicleDraft: T('Draft', 'Draft', 'Entwurf'),
      vehicleAvailable: T('Disponibel', 'Available', 'Verfügbar'),
      vehicleBusy: T('I zene', 'Busy', 'Belegt'),
      bookingsEmpty: T('Nuk ka rezervime.', 'No bookings.', 'Keine Buchungen.'),
      bookingsRange: T('{{from}} → {{to}} ({{days}}d)', '{{from}} → {{to}} ({{days}}d)', '{{from}} → {{to}} ({{days}}T)'),
      subMaxVehicles: T('Vetura max', 'Max vehicles', 'Max. Fahrzeuge'),
      subUnlimited: T('Unlimited', 'Unlimited', 'Unbegrenzt'),
      subMaxBookings: T('Rezervime/muj', 'Bookings/month', 'Buchungen/Monat'),
      subMonthlyPrice: T('Cmimi mujor', 'Monthly price', 'Monatspreis'),
      subExpires: T('Skadon', 'Expires', 'Läuft ab'),
      subExpiresDays: T('({{days}}d)', '({{days}}d)', '({{days}}T)'),
      subChangeOrAssign: T('Ndrysho / Cakto plan', 'Change / Assign plan', 'Plan ändern / zuweisen'),
      subAvailablePlans: T('Planet disponibel', 'Available plans', 'Verfügbare Pläne'),
      subPlanDetails: T('{{price}} EUR/muj · {{max}} vetura', '{{price}} EUR/month · {{max}} vehicles', '{{price}} EUR/Monat · {{max}} Fahrzeuge'),
      subActiveLabel: T('Aktiv', 'Active', 'Aktiv'),
      csvName: T('Emri', 'Name', 'Name'),
      csvCity: T('Qyteti', 'City', 'Stadt'),
      csvCountry: T('Vendi', 'Country', 'Land'),
      csvEmail: T('Email', 'Email', 'E-Mail'),
      csvPhone: T('Telefoni', 'Phone', 'Telefon'),
      csvStatus: T('Statusi', 'Status', 'Status'),
      csvPlan: T('Plani', 'Plan', 'Plan'),
      csvSubscription: T('Abonimi', 'Subscription', 'Abonnement'),
      csvVehicles: T('Automjete', 'Vehicles', 'Fahrzeuge'),
      csvPublished: T('Pub.', 'Pub.', 'Pub.'),
      csvBookings: T('Rezervime', 'Bookings', 'Buchungen'),
      csvActive: T('Aktive', 'Active', 'Aktiv'),
      csvRevenue: T('Te ardhura EUR', 'Revenue EUR', 'Umsatz EUR'),
      csvRating: T('Vleresimi', 'Rating', 'Bewertung'),
      csvRegistered: T('Regjistruar', 'Registered', 'Registriert'),
      csvFilename: T('kompanite-raport', 'companies-report', 'unternehmen-bericht'),
    },
    users: {
      title: T('Menaxhimi i perdoruesve', 'User management', 'Benutzerverwaltung'),
      subtitle: T('Shikoni dhe menaxhoni te gjithe perdoruesit e platformes', 'View and manage all platform users', 'Alle Plattform-Benutzer anzeigen und verwalten'),
      loadError: T('Gabim: {{msg}}', 'Error: {{msg}}', 'Fehler: {{msg}}'),
      statusUpdateSuccess: T('Statusi u ndryshua me sukses!', 'Status updated successfully!', 'Status erfolgreich aktualisiert!'),
      roleChangedSuccess: T('Roli u ndryshua ne "{{role}}"!', 'Role changed to "{{role}}"!', 'Rolle geändert zu "{{role}}"!'),
      statTotal: T('Gjithsej', 'Total', 'Gesamt'),
      statClients: T('Kliente', 'Clients', 'Kunden'),
      statCompanies: T('Kompani', 'Companies', 'Unternehmen'),
      statActive: T('Aktive', 'Active', 'Aktiv'),
      statThisMonth: T('Kete muaj', 'This month', 'Diesen Monat'),
      searchPlaceholder: T('Kerko emrin, email, nr. telefoni, kompani...', 'Search name, email, phone, company...', 'Name, E-Mail, Telefon, Unternehmen suchen...'),
      anyStatus: T('Cdo status', 'Any status', 'Jeder Status'),
      statusActive: T('Aktiv', 'Active', 'Aktiv'),
      statusInactive: T('Joaktiv', 'Inactive', 'Inaktiv'),
      filterAll: T('Te gjitha', 'All', 'Alle'),
      filterClients: T('Kliente', 'Clients', 'Kunden'),
      filterCompanies: T('Kompani', 'Companies', 'Unternehmen'),
      filterAdmin: T('Admin', 'Admin', 'Admin'),
      emptyState: T('Nuk u gjenden perdorues', 'No users found', 'Keine Benutzer gefunden'),
      thUser: T('Perdoruesi', 'User', 'Benutzer'),
      thContact: T('Kontakti', 'Contact', 'Kontakt'),
      thRole: T('Roli', 'Role', 'Rolle'),
      thBookings: T('Rezervime', 'Bookings', 'Buchungen'),
      thSpent: T('Shpenzuar', 'Spent', 'Ausgegeben'),
      thStatus: T('Statusi', 'Status', 'Status'),
      thRegistered: T('Regjistruar', 'Registered', 'Registriert'),
      thActions: T('Veprime', 'Actions', 'Aktionen'),
      cancelledShort: T('{{count}} anuluar', '{{count}} cancelled', '{{count}} storniert'),
      viewDetailsTooltip: T('Shiko detajet', 'View details', 'Details anzeigen'),
      pageRange: T('{{from}}–{{to}} nga {{total}}', '{{from}}–{{to}} of {{total}}', '{{from}}–{{to}} von {{total}}'),
      detailActive: T('Aktiv', 'Active', 'Aktiv'),
      detailInactive: T('Joaktiv', 'Inactive', 'Inaktiv'),
      tabInfo: T('Informacioni', 'Information', 'Informationen'),
      tabBookings: T('Rezervimet ({{count}})', 'Bookings ({{count}})', 'Buchungen ({{count}})'),
      tabActivity: T('Aktiviteti', 'Activity', 'Aktivität'),
      deactivate: T('Deaktivizo', 'Deactivate', 'Deaktivieren'),
      activate: T('Aktivizo', 'Activate', 'Aktivieren'),
      close: T('Mbyll', 'Close', 'Schließen'),
      infoBookings: T('Rezervime', 'Bookings', 'Buchungen'),
      infoCompleted: T('Perfunduar', 'Completed', 'Abgeschlossen'),
      infoCancelled: T('Anuluar', 'Cancelled', 'Storniert'),
      infoSpent: T('EUR shpenzuar', 'EUR spent', 'EUR ausgegeben'),
      infoSectionTitle: T('Te dhenat personale', 'Personal information', 'Persönliche Daten'),
      infoEmail: T('Email', 'Email', 'E-Mail'),
      infoPhone: T('Telefoni', 'Phone', 'Telefon'),
      infoRegistered: T('Regjistruar', 'Registered', 'Registriert'),
      infoLastBooking: T('Rez. i fundit', 'Last booking', 'Letzte Buchung'),
      infoLastBookingNone: T('Nuk ka', 'None', 'Keine'),
      infoCompany: T('Kompania', 'Company', 'Unternehmen'),
      infoId: T('ID', 'ID', 'ID'),
      bookingsEmpty: T('Nuk ka rezervime.', 'No bookings.', 'Keine Buchungen.'),
      bookingDaysLocation: T('{{days}} dite · {{location}}', '{{days}} days · {{location}}', '{{days}} Tage · {{location}}'),
      activityTotalSpent: T('Shpenzimi total', 'Total spent', 'Gesamtausgaben'),
      activityAvgValue: T('Mesatare/rezervim', 'Average/booking', 'Durchschnitt/Buchung'),
      activityUniqueCompanies: T('Kompani te ndryshme', 'Unique companies', 'Verschiedene Unternehmen'),
      activityLast: T('Aktiviteti i fundit', 'Last activity', 'Letzte Aktivität'),
      activityLastNone: T('Nuk ka aktivitet', 'No activity', 'Keine Aktivität'),
      completionRate: T('Shkalla e perfundimit', 'Completion rate', 'Abschlussrate'),
      cancellationRate: T('Shkalla e anulimit', 'Cancellation rate', 'Stornierungsrate'),
      csvName: T('Emri', 'Name', 'Name'),
      csvEmail: T('Email', 'Email', 'E-Mail'),
      csvPhone: T('Telefoni', 'Phone', 'Telefon'),
      csvRole: T('Roli', 'Role', 'Rolle'),
      csvCompany: T('Kompania', 'Company', 'Unternehmen'),
      csvBookings: T('Rezervime', 'Bookings', 'Buchungen'),
      csvCompleted: T('Perfunduar', 'Completed', 'Abgeschlossen'),
      csvCancelled: T('Anuluar', 'Cancelled', 'Storniert'),
      csvSpent: T('Shpenzuar EUR', 'Spent EUR', 'Ausgegeben EUR'),
      csvStatus: T('Statusi', 'Status', 'Status'),
      csvRegistered: T('Regjistruar', 'Registered', 'Registriert'),
      csvFilename: T('perdoruesit', 'users', 'benutzer'),
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
