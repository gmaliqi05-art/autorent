import i18n from '../i18n';

type LocalizedValue = string | { sq?: string; en?: string; de?: string } | null | undefined;

export function pickLocalized(value: LocalizedValue, fallbackKey?: string): string {
  const lang = (i18n.language || 'sq').slice(0, 2);

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const map = value as Record<string, string>;
    if (map[lang]) return map[lang];
    if (map.en) return map.en;
    if (map.sq) return map.sq;
    const first = Object.values(map).find((v) => typeof v === 'string' && v);
    if (first) return first;
  }

  if (typeof value === 'string' && value.trim()) {
    if (lang === 'sq') return value;
    if (fallbackKey) {
      const translated = i18n.t(fallbackKey);
      if (translated && translated !== fallbackKey) return translated;
    }
    return value;
  }

  if (fallbackKey) {
    const translated = i18n.t(fallbackKey);
    if (translated && translated !== fallbackKey) return translated;
  }
  return '';
}

export function pickLocalizedArray(value: unknown, fallback: string[] = []): string[] {
  const lang = (i18n.language || 'sq').slice(0, 2);
  if (Array.isArray(value)) return value as string[];
  if (value && typeof value === 'object') {
    const map = value as Record<string, string[]>;
    if (Array.isArray(map[lang])) return map[lang];
    if (Array.isArray(map.en)) return map.en;
    if (Array.isArray(map.sq)) return map.sq;
  }
  return fallback;
}
