// Shton perkthime te munguara per CompanyPayments / CompanySettings / CompanySubscription.
// Idempotent — i shton vetem celesat qe mungojne pa prekur te ekzistuarit me te njejtin emer.
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'i18n', 'locales');

function T(sq, en, de) { return { sq, en, de }; }

const KEYS = {
  companyDash: {
    settings: {
      // Upload empty-state labels for ImageUploader on settings page
      uploadLogo: T('Ngarko logo', 'Upload logo', 'Logo hochladen'),
      uploadCover: T(
        'Ngarko foto kopertinë',
        'Upload cover image',
        'Titelbild hochladen'
      ),
      // Day-of-week labels referenced via t(`companyDash.settings.days.${day}`)
      days: {
        monday: T('E hënë', 'Monday', 'Montag'),
        tuesday: T('E martë', 'Tuesday', 'Dienstag'),
        wednesday: T('E mërkurë', 'Wednesday', 'Mittwoch'),
        thursday: T('E enjte', 'Thursday', 'Donnerstag'),
        friday: T('E premte', 'Friday', 'Freitag'),
        saturday: T('E shtunë', 'Saturday', 'Samstag'),
        sunday: T('E diel', 'Sunday', 'Sonntag'),
      },
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

// Idempotent merge: only set leaves that are missing in target.
function deepMergeMissing(target, src) {
  for (const k in src) {
    if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k])) {
      if (!target[k] || typeof target[k] !== 'object') target[k] = {};
      deepMergeMissing(target[k], src[k]);
    } else if (target[k] === undefined || target[k] === null || target[k] === '') {
      target[k] = src[k];
    }
  }
  return target;
}

const summary = { sq: [], en: [], de: [] };

function listAdded(obj, prefix, cur) {
  const out = [];
  for (const k in obj) {
    const v = obj[k];
    const p = prefix ? prefix + '.' + k : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out.push(...listAdded(v, p, (cur && cur[k]) || {}));
    } else {
      if (cur[k] === undefined || cur[k] === null || cur[k] === '') out.push(p);
    }
  }
  return out;
}

for (const lang of ['sq', 'en', 'de']) {
  const file = path.join(LOCALES_DIR, `${lang}.json`);
  const cur = JSON.parse(fs.readFileSync(file, 'utf-8'));
  const additions = buildLang(KEYS, lang);
  summary[lang] = listAdded(additions, '', cur);
  deepMergeMissing(cur, additions);
  fs.writeFileSync(file, JSON.stringify(cur, null, 2) + '\n', 'utf-8');
}

console.log('Translation files updated.');
for (const lang of ['sq', 'en', 'de']) {
  console.log(`\n[${lang}] added ${summary[lang].length} key(s):`);
  summary[lang].forEach(k => console.log('  ' + k));
}
