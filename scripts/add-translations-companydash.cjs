// Shton perkthime te munguara per CompanyDashboard, CompanyBookings dhe CompanyVehicles
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'i18n', 'locales');

function T(sq, en, de) { return { sq, en, de }; }

const KEYS = {
  companyDash: {
    bookings: {
      // Reject reason dropdown options (used as `companyDash.bookings.rejectReason_${key}`)
      rejectReason_maintenance: T(
        'Automjeti ne mirembajtje',
        'Vehicle under maintenance',
        'Fahrzeug in Wartung'
      ),
      rejectReason_overloaded: T(
        'I mbingarkuar me rezervime',
        'Overloaded with bookings',
        'Mit Buchungen ausgelastet'
      ),
      rejectReason_missing_docs: T(
        'Dokumente te paplota te klientit',
        'Incomplete client documents',
        'Unvollständige Kundendokumente'
      ),
      rejectReason_other: T('Tjeter', 'Other', 'Sonstiges'),

      // Cash hold UI
      cashHoldHelpButton: T(
        'Si funksionon Cash Hold?',
        'How does Cash Hold work?',
        'Wie funktioniert Cash Hold?'
      ),
      cashHoldReleaseConfirm: T(
        'Lironi garancin {{amount}} EUR? Klienti pagoi kesh.',
        'Release the {{amount}} EUR hold? The client paid in cash.',
        'Garantie über {{amount}} EUR freigeben? Der Kunde hat bar bezahlt.'
      ),
      cashHoldReleasedMsg: T(
        'Garancia {{amount}} EUR u lirua. Klienti nuk paguan asgje me kart.',
        'The {{amount}} EUR hold was released. The client will not be charged on the card.',
        'Die Garantie von {{amount}} EUR wurde freigegeben. Dem Kunden wird nichts von der Karte abgebucht.'
      ),
      cashHoldCapturedMsg: T(
        'Penaliteti {{amount}} EUR u tërhoq nga karta e klientit.',
        'The {{amount}} EUR penalty was charged to the client\'s card.',
        'Die Strafe von {{amount}} EUR wurde von der Karte des Kunden abgebucht.'
      ),
      cashHoldReleaseTitle: T(
        'Lësho garancin (klienti pagoi kesh)',
        'Release hold (client paid in cash)',
        'Garantie freigeben (Kunde hat bar bezahlt)'
      ),
      cashHoldReleaseButton: T(
        'Lësho {{amount}} EUR',
        'Release {{amount}} EUR',
        '{{amount}} EUR freigeben'
      ),
      cashHoldCaptureTitle: T(
        'Kape penalitetin (klienti nuk u shfaq)',
        'Charge penalty (client did not show up)',
        'Strafe einziehen (Kunde ist nicht erschienen)'
      ),
      cashHoldCaptureShort: T('Kape', 'Charge', 'Einziehen'),
      cashHoldReleasedBadge: T('Hold u lirua', 'Hold released', 'Hold freigegeben'),
      cashHoldCapturedBadge: T(
        'Penalitet i kapur',
        'Penalty charged',
        'Strafe eingezogen'
      ),

      // Capture penalty modal
      capturePenaltyTitle: T(
        'Kap penalitetin',
        'Charge the penalty',
        'Strafe einziehen'
      ),
      captureHelpLink: T('Ndihmë', 'Help', 'Hilfe'),
      captureHelpTooltip: T(
        'Si funksionon?',
        'How does it work?',
        'Wie funktioniert es?'
      ),
      captureBodyHtml: T(
        'Do tërhiqet <strong>{{amount}} EUR</strong> nga karta e <strong>{{name}}</strong>. Kjo bëhet kur klienti nuk shfaqet ose nuk paguan.',
        '<strong>{{amount}} EUR</strong> will be charged to <strong>{{name}}</strong>\'s card. This is used when the client does not show up or refuses to pay.',
        'Es werden <strong>{{amount}} EUR</strong> von der Karte von <strong>{{name}}</strong> abgebucht. Dies erfolgt, wenn der Kunde nicht erscheint oder nicht zahlt.'
      ),
      captureReasonLabel: T(
        'Arsyeja (opsionale)',
        'Reason (optional)',
        'Grund (optional)'
      ),
      captureReasonPlaceholder: T(
        'P.sh. Klienti nuk u shfaq dhe nuk u përgjigj në thirrje...',
        'E.g. The client did not show up and did not answer the phone...',
        'Z. B. Der Kunde ist nicht erschienen und hat den Anruf nicht entgegengenommen...'
      ),
      captureConfirmButton: T(
        'Kape {{amount}} EUR',
        'Charge {{amount}} EUR',
        '{{amount}} EUR einziehen'
      ),
    },
    vehicles: {
      feature_ac: T('Klima', 'Air conditioning', 'Klimaanlage'),
      feature_bluetooth: T('Bluetooth', 'Bluetooth', 'Bluetooth'),
      feature_gps: T('GPS', 'GPS', 'GPS'),
      feature_usb: T('USB', 'USB', 'USB'),
      feature_cruise_control: T('Cruise control', 'Cruise control', 'Tempomat'),
      feature_parking_sensors: T(
        'Sensore parkimi',
        'Parking sensors',
        'Einparksensoren'
      ),
      feature_rearview_camera: T(
        'Kamera prapavajtjeje',
        'Rear-view camera',
        'Rückfahrkamera'
      ),
      feature_sunroof: T('Tavan diellor', 'Sunroof', 'Schiebedach'),
      feature_leather_seats: T(
        'Vendet me lekure',
        'Leather seats',
        'Ledersitze'
      ),
      feature_heated_seats: T(
        'Vendet e ngrohura',
        'Heated seats',
        'Sitzheizung'
      ),
      'feature_4wd': T('4x4', '4-wheel drive', 'Allradantrieb'),
      feature_apple_carplay: T('Apple CarPlay', 'Apple CarPlay', 'Apple CarPlay'),
      feature_android_auto: T('Android Auto', 'Android Auto', 'Android Auto'),
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
