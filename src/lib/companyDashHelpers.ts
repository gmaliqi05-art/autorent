import type { TFunction } from 'i18next';
import { localeFromI18n } from './clientDashHelpers';

export { localeFromI18n };

export function formatDate(dateStr: string, lang: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(dateStr).toLocaleDateString(localeFromI18n(lang), opts);
}

export function formatDateShort(dateStr: string, lang: string): string {
  return new Date(dateStr).toLocaleDateString(localeFromI18n(lang), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateLong(dateStr: string, lang: string): string {
  return new Date(dateStr).toLocaleDateString(localeFromI18n(lang), {
    day: '2-digit',
    month: 'long',
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

export const paymentStatusColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
};

export function bookingStatusLabel(status: string, t: TFunction): string {
  const key = `companyDash.status.${status}`;
  const translated = t(key);
  return translated === key ? status : translated;
}

export function paymentStatusLabel(status: string, t: TFunction): string {
  const key = `companyDash.paymentStatus.${status}`;
  const translated = t(key);
  return translated === key ? status : translated;
}

export function paymentMethodLabel(method: string, t: TFunction, full = false): string {
  const key = full ? `companyDash.paymentMethod.${method}Full` : `companyDash.paymentMethod.${method}`;
  const translated = t(key);
  if (translated === key) {
    const fallback = t(`companyDash.paymentMethod.${method}`);
    return fallback === `companyDash.paymentMethod.${method}` ? method : fallback;
  }
  return translated;
}

export function vehicleCategoryLabel(value: string, t: TFunction): string {
  const key = `companyDash.vehicles.category_${value}`;
  const translated = t(key);
  return translated === key ? value : translated;
}

export function vehicleTransmissionLabel(value: string, t: TFunction): string {
  const key = `companyDash.vehicles.transmission_${value}`;
  const translated = t(key);
  return translated === key ? value : translated;
}

export function vehicleFuelLabel(value: string, t: TFunction): string {
  const key = `companyDash.vehicles.fuel_${value}`;
  const translated = t(key);
  return translated === key ? value : translated;
}
