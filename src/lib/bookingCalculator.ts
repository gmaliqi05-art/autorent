import type { Currency, InsurancePlan, VehicleExtra, Vehicle } from './types';

export interface ExtraSelection {
  extra: VehicleExtra;
  quantity: number;
}

export interface BookingPriceInput {
  vehicle: Pick<Vehicle, 'price_per_day' | 'deposit_amount' | 'young_driver_fee_per_day' | 'min_driver_age' | 'currency'>;
  days: number;
  insurance?: InsurancePlan | null;
  extras?: ExtraSelection[];
  driverAge?: number;
  oneWayFee?: number;
  discountAmount?: number;
  taxPercent?: number;
  currency?: Currency;
}

export interface BookingPriceBreakdown {
  baseRental: number;
  insuranceTotal: number;
  extrasTotal: number;
  youngDriverFee: number;
  oneWayFee: number;
  subtotal: number;
  discount: number;
  taxableBase: number;
  tax: number;
  total: number;
  deposit: number;
  currency: Currency;
  extrasBreakdown: Array<{ code: string; name: string; quantity: number; line_total: number }>;
}

export function calculateBookingPrice(input: BookingPriceInput): BookingPriceBreakdown {
  const { vehicle, days } = input;
  const currency: Currency = input.currency ?? (vehicle.currency ?? 'EUR');
  const baseRental = Number(vehicle.price_per_day) * days;

  const insuranceTotal = input.insurance
    ? Number(input.insurance.price_per_day) * days
    : 0;

  const extrasBreakdown: Array<{ code: string; name: string; quantity: number; line_total: number }> = [];
  let extrasTotal = 0;
  for (const sel of input.extras ?? []) {
    const perDay = Number(sel.extra.price_per_day) * days;
    const flat = Number(sel.extra.price_per_rental);
    const lineTotal = (perDay + flat) * sel.quantity;
    extrasTotal += lineTotal;
    extrasBreakdown.push({
      code: sel.extra.code,
      name: sel.extra.name_en || sel.extra.code,
      quantity: sel.quantity,
      line_total: round2(lineTotal),
    });
  }

  let youngDriverFee = 0;
  if (
    typeof input.driverAge === 'number'
    && input.driverAge < 25
    && vehicle.young_driver_fee_per_day
  ) {
    youngDriverFee = Number(vehicle.young_driver_fee_per_day) * days;
  }

  const oneWayFee = Number(input.oneWayFee ?? 0);
  const discount = Number(input.discountAmount ?? 0);
  const subtotal = baseRental + insuranceTotal + extrasTotal + youngDriverFee + oneWayFee;
  const taxableBase = Math.max(0, subtotal - discount);
  const taxPercent = Number(input.taxPercent ?? 0);
  const tax = round2((taxableBase * taxPercent) / 100);
  const total = round2(taxableBase + tax);
  const deposit = Number(vehicle.deposit_amount ?? 0);

  return {
    baseRental: round2(baseRental),
    insuranceTotal: round2(insuranceTotal),
    extrasTotal: round2(extrasTotal),
    youngDriverFee: round2(youngDriverFee),
    oneWayFee: round2(oneWayFee),
    subtotal: round2(subtotal),
    discount: round2(discount),
    taxableBase: round2(taxableBase),
    tax,
    total,
    deposit,
    currency,
    extrasBreakdown,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function isDriverAgeEligible(vehicle: Pick<Vehicle, 'min_driver_age'>, driverAge?: number): boolean {
  if (typeof driverAge !== 'number') return true;
  return driverAge >= (vehicle.min_driver_age ?? 21);
}
