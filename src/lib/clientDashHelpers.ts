import type { TFunction } from 'i18next';

export function formatTimeAgo(dateStr: string, t: TFunction): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('clientDash.timeAgo.now');
  if (mins < 60) return t('clientDash.timeAgo.minAgo', { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('clientDash.timeAgo.hoursAgo', { count: hours });
  const days = Math.floor(hours / 24);
  return t('clientDash.timeAgo.daysAgo', { count: days });
}

export function localeFromI18n(lang: string): string {
  const code = (lang || 'sq').slice(0, 2);
  if (code === 'en') return 'en-GB';
  if (code === 'de') return 'de-DE';
  return 'sq-AL';
}

export function formatDate(dateStr: string, lang: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(dateStr).toLocaleDateString(localeFromI18n(lang), opts);
}

export function formatDateShort(dateStr: string, lang: string): string {
  return new Date(dateStr).toLocaleDateString(localeFromI18n(lang), {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

export function formatDateTime(dateStr: string, lang: string): string {
  return new Date(dateStr).toLocaleString(localeFromI18n(lang), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatTime(dateStr: string, lang: string): string {
  return new Date(dateStr).toLocaleTimeString(localeFromI18n(lang), {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const bookingStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
  rejected: 'bg-red-100 text-red-700',
};

export const paymentStatusColors: Record<string, { bg: string; dot: string }> = {
  pending: { bg: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  paid: { bg: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  failed: { bg: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
};

export function bookingStatusLabel(status: string, t: TFunction): string {
  const key = `clientDash.bookingStatus.${status}`;
  const translated = t(key);
  return translated === key ? status : translated;
}

export function paymentStatusLabel(status: string, t: TFunction): string {
  const key = `clientDash.paymentStatus.${status}`;
  const translated = t(key);
  return translated === key ? status : translated;
}

export function paymentMethodLabel(method: string, t: TFunction, full = false): string {
  const key = full ? `clientDash.paymentMethod.${method}Full` : `clientDash.paymentMethod.${method}`;
  const translated = t(key);
  if (translated === key) {
    const fallback = t(`clientDash.paymentMethod.${method}`);
    return fallback === `clientDash.paymentMethod.${method}` ? method : fallback;
  }
  return translated;
}
