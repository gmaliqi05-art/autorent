// Shton perkthime per PayPal feedback ne ClientBookings
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'i18n', 'locales');

function T(sq, en, de) { return { sq, en, de }; }

const KEYS = {
  clientDash: {
    bookings: {
      paypalCapturing: T(
        'Duke perfunduar pagesen me PayPal...',
        'Completing PayPal payment...',
        'PayPal-Zahlung wird abgeschlossen...'
      ),
      paypalSuccess: T(
        'Pagesa juaj me PayPal u perfundua me sukses!',
        'Your PayPal payment was completed successfully!',
        'Ihre PayPal-Zahlung wurde erfolgreich abgeschlossen!'
      ),
      paypalFailed: T(
        'Pagesa PayPal deshtoi: {{err}}',
        'PayPal payment failed: {{err}}',
        'PayPal-Zahlung fehlgeschlagen: {{err}}'
      ),
      paypalCancelled: T(
        'Pagesa PayPal u anulua.',
        'PayPal payment was cancelled.',
        'PayPal-Zahlung wurde abgebrochen.'
      ),
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
