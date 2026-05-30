import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Star, MapPin, Calendar, Fuel, Cog, Users, DoorOpen, Gauge, Shield, CheckCircle2, Loader2, Car, Building2, Phone, ArrowRight, ShieldCheck, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Vehicle, Company, Review, InsurancePlan } from '../lib/types';
import BookingInvoice from '../components/booking/BookingInvoice';
import { type PaymentMethodType } from '../components/booking/PaymentMethodSelector';
import AvailabilityCalendar from '../components/booking/AvailabilityCalendar';
import PriceBreakdown from '../components/booking/PriceBreakdown';
// Lazy: keto komponente nuk shfaqen ne render-in fillestar (dates step), vetëm pas.
const InsurancePlanSelector = lazy(() => import('../components/booking/InsurancePlanSelector'));
const ExtrasSelector = lazy(() => import('../components/booking/ExtrasSelector'));
const PaymentMethodSelector = lazy(() => import('../components/booking/PaymentMethodSelector'));
import { getOptimizedImageUrl } from '../lib/imageOptimizer';
import { sendBookingConfirmationToClient, sendBookingNotificationToCompany } from '../lib/emailService';
import { createInvoice } from '../lib/invoiceService';
import { createNotification } from '../lib/notificationService';
import { startStripeCheckout } from '../lib/stripeService';
import { startPaypalCheckout } from '../lib/paypalService';
import { calculateBookingPrice, type ExtraSelection } from '../lib/bookingCalculator';
import { useInvoiceSettings, getEffectiveTaxPercent } from '../lib/useInvoiceSettings';
import { formatCurrency } from '../lib/currency';
// Lazy import — Stripe.js (~150KB) ngarkohet vetem kur user mberrijne ne 'cash_hold' step
const CashHoldForm = lazy(() => import('../components/booking/CashHoldForm'));

type BookingStep = 'dates' | 'customize' | 'invoice' | 'payment' | 'cash_hold' | 'success';

export default function VehicleDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const invoiceSettings = useInvoiceSettings();
  const taxPercent = getEffectiveTaxPercent(invoiceSettings);
  // Llogarit moshen e shoferit nga profile.date_of_birth (per young driver fee).
  // Nese DOB s'eshte set, calculator fee = 0 sic me pare.
  const driverAge = profile?.date_of_birth
    ? Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : undefined;
  const localeMap: Record<string, string> = { sq: 'sq-AL', en: 'en-US', de: 'de-DE' };
  const dateLocale = localeMap[i18n.language?.split('-')[0]] || 'sq-AL';
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();
  const [pickupDate, setPickupDate] = useState(today);
  const [returnDate, setReturnDate] = useState(tomorrow);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [step, setStep] = useState<BookingStep>('dates');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType | ''>('');
  const [cashBookingId, setCashBookingId] = useState<string | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');
  // Step 'customize': sigurim + extras
  const [selectedInsurance, setSelectedInsurance] = useState<InsurancePlan | null>(null);
  const [extrasSelections, setExtrasSelections] = useState<ExtraSelection[]>([]);

  useEffect(() => {
    if (!id) return;
    loadVehicle();
  }, [id]);

  async function loadVehicle() {
    const { data } = await supabase
      .from('vehicles')
      .select('*, company:companies(*)')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (!data) { setLoading(false); return; }
    setVehicle(data as Vehicle);
    setCompany((data as any).company as Company);

    const { data: reviewData } = await supabase
      .from('reviews')
      .select('*')
      .eq('company_id', (data as any).company_id)
      .order('created_at', { ascending: false })
      .limit(5);
    setReviews((reviewData || []) as Review[]);
    setLoading(false);
  }

  function getTotalDays() {
    if (!pickupDate || !returnDate) return 0;
    const d = Math.ceil((new Date(returnDate).getTime() - new Date(pickupDate).getTime()) / (1000 * 60 * 60 * 24));
    return d > 0 ? d : 0;
  }

  async function handleProceedToInvoice() {
    if (!user || !profile) {
      navigate('/kycu');
      return;
    }
    const days = getTotalDays();
    if (!pickupDate || !returnDate) { setBookingError(t('vehicleDetail.pickReturnDates')); return; }
    if (days === 0) { setBookingError(t('vehicleDetail.returnAfterPickup')); return; }
    setBookingError('');
    setAvailabilityError('');
    setCheckingAvailability(true);

    const { data: docs } = await supabase
      .from('client_documents')
      .select('verified, license_front_url, id_document_url')
      .eq('client_id', user.id)
      .maybeSingle();

    if (!docs || !docs.verified || (!docs.license_front_url && !docs.id_document_url)) {
      setCheckingAvailability(false);
      setBookingError(t('vehicleDetail.docsRequired'));
      return;
    }

    const { data: conflictingBookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('vehicle_id', vehicle!.id)
      .in('status', ['pending', 'confirmed', 'active'])
      .lt('pickup_date', returnDate)
      .gt('return_date', pickupDate);

    setCheckingAvailability(false);

    if (conflictingBookings && conflictingBookings.length > 0) {
      setAvailabilityError(t('vehicleDetail.vehicleUnavailable'));
      return;
    }

    setStep('customize');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCustomizeToInvoice() {
    setStep('invoice');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleProceedToPayment() {
    setStep('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleConfirmBooking() {
    if (!user || !vehicle || !company || !profile || !paymentMethod) return;
    const days = getTotalDays();
    setBooking(true);
    setBookingError('');

    const breakdown = calculateBookingPrice({
      vehicle: {
        price_per_day: Number(vehicle.price_per_day),
        deposit_amount: Number(vehicle.deposit_amount),
        young_driver_fee_per_day: Number(vehicle.young_driver_fee_per_day ?? 0),
        min_driver_age: vehicle.min_driver_age ?? 21,
        currency: (vehicle.currency ?? 'EUR'),
      },
      days,
      insurance: selectedInsurance,
      extras: extrasSelections,
      driverAge,
      taxPercent,
    });

    const { data: bookingData, error } = await supabase.from('bookings').insert({
      vehicle_id: vehicle.id,
      company_id: company.id,
      client_id: user.id,
      pickup_date: pickupDate,
      return_date: returnDate,
      pickup_location: company.city,
      return_location: company.city,
      total_days: days,
      price_per_day: vehicle.price_per_day,
      total_price: breakdown.total,
      deposit_amount: vehicle.deposit_amount,
      currency: breakdown.currency,
      insurance_plan_id: selectedInsurance?.id ?? null,
      insurance_total: breakdown.insuranceTotal,
      extras_total: breakdown.extrasTotal,
      one_way_fee: breakdown.oneWayFee,
      tax_total: breakdown.tax,
      discount_total: breakdown.discount,
      included_km: (vehicle.included_km_per_day ?? 0) * days,
      extra_km_price: Number(vehicle.extra_km_price ?? 0),
      status: 'pending',
      payment_method: paymentMethod,
      payment_status: 'pending',
      client_name: profile.full_name || '',
      client_phone: profile.phone || '',
      client_email: profile.email || '',
    }).select().single();

    if (error || !bookingData) {
      setBookingError(t('vehicleDetail.bookingError'));
      setBooking(false);
      return;
    }

    // Insert booking_extras (nese ka)
    if (extrasSelections.length > 0) {
      const extrasRows = extrasSelections.map((sel) => ({
        booking_id: bookingData.id,
        extra_id: sel.extra.id,
        quantity: sel.quantity,
        unit_price_per_day: Number(sel.extra.price_per_day),
        unit_price_per_rental: Number(sel.extra.price_per_rental),
        subtotal: (Number(sel.extra.price_per_day) * days + Number(sel.extra.price_per_rental)) * sel.quantity,
        currency: breakdown.currency,
      }));
      const { error: extrasError } = await supabase.from('booking_extras').insert(extrasRows);
      if (extrasError) {
        console.warn('[booking] failed to insert booking_extras:', extrasError);
      }
    }

    const paymentMethodLabel =
      paymentMethod === 'stripe' ? t('paymentLabel.stripe') :
      paymentMethod === 'paypal' ? t('paymentLabel.paypal') :
      paymentMethod === 'bank_transfer' ? t('paymentLabel.bank') : t('paymentLabel.cash');

    await sendBookingConfirmationToClient(
      profile.email || '',
      profile.full_name || '',
      {
        bookingId: bookingData.id,
        vehicleName: `${vehicle.brand} ${vehicle.model}`,
        companyName: company.name,
        pickupDate: new Date(pickupDate).toLocaleDateString(dateLocale),
        returnDate: new Date(returnDate).toLocaleDateString(dateLocale),
        totalDays: days,
        pricePerDay: Number(vehicle.price_per_day),
        deposit: Number(vehicle.deposit_amount),
        paymentMethod: paymentMethodLabel,
        totalPrice: breakdown.total,
        status: t('vehicleDetail.pendingApproval'),
      }
    );

    await sendBookingNotificationToCompany(
      company.email || '',
      company.name,
      {
        bookingId: bookingData.id,
        vehicleName: `${vehicle.brand} ${vehicle.model}`,
        clientName: profile.full_name || '',
        clientEmail: profile.email || '',
        clientPhone: profile.phone || '',
        pickupDate: new Date(pickupDate).toLocaleDateString(dateLocale),
        returnDate: new Date(returnDate).toLocaleDateString(dateLocale),
        totalDays: days,
        totalPrice: breakdown.total,
        paymentMethod: paymentMethodLabel,
      }
    );

    await createInvoice({
      bookingId: bookingData.id,
      companyId: company.id,
      clientId: user.id,
      clientName: profile.full_name || '',
      clientEmail: profile.email || '',
      clientPhone: profile.phone || '',
      companyName: company.name,
      companyEmail: company.email || '',
      companyPhone: company.phone || '',
      vehicleName: `${vehicle.brand} ${vehicle.model}`,
      pickupDate,
      returnDate,
      totalDays: days,
      pricePerDay: Number(vehicle.price_per_day),
      depositAmount: Number(vehicle.deposit_amount),
      totalPrice: breakdown.total,
      paymentMethod,
      status: 'draft',
    });

    const vehicleName = `${vehicle.brand} ${vehicle.model}`;

    await createNotification({
      userId: user.id,
      title: t('vehicleDetail.notifBookingCreatedTitle'),
      message: t('vehicleDetail.notifBookingCreatedClient', { vehicle: vehicleName }),
      type: 'booking_created',
      referenceId: bookingData.id,
      referenceType: 'booking',
      templateKey: 'booking_created_client',
      templateVars: { vehicle: vehicleName },
    });

    await createNotification({
      userId: company.owner_id,
      title: t('vehicleDetail.notifBookingCreatedCompany'),
      message: t('vehicleDetail.notifBookingCreatedCompanyMsg', { name: profile.full_name, vehicle: vehicleName }),
      type: 'booking_created',
      referenceId: bookingData.id,
      referenceType: 'booking',
      templateKey: 'booking_created_company',
      templateVars: { clientName: profile.full_name, vehicle: vehicleName },
    });

    // Per pagese me karte, ridrejto ne Stripe Checkout.
    // Webhook-u do ta beje update payment_status='paid' & status='confirmed'.
    if (paymentMethod === 'stripe') {
      const { error: stripeError } = await startStripeCheckout(bookingData.id);
      if (stripeError) {
        setBookingError(t('vehicleDetail.stripeFailed', { err: stripeError }));
        setBooking(false);
        return;
      }
      return;
    }

    // PayPal: krijo PayPal order dhe ridrejto perdoruesin tek faqja e aprovimit
    if (paymentMethod === 'paypal') {
      const { error: paypalError } = await startPaypalCheckout(bookingData.id);
      if (paypalError) {
        setBookingError(t('vehicleDetail.paypalFailed', { err: paypalError }));
        setBooking(false);
        return;
      }
      return;
    }

    // Cash me garanci: pas krijimit te bookingit, kerko karten per hold
    if (paymentMethod === 'cash') {
      setCashBookingId(bookingData.id);
      setStep('cash_hold');
      setBooking(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setStep('success');
    setBooking(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goBack() {
    if (step === 'payment') setStep('invoice');
    else if (step === 'invoice') setStep('customize');
    else if (step === 'customize') setStep('dates');
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-[68px] flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen pt-[68px] flex flex-col items-center justify-center bg-gray-50 gap-4">
        <Car className="w-12 h-12 text-gray-300" />
        <p className="text-dark-600 font-medium">{t('vehicleDetail.notFound')}</p>
        <Link to="/automjetet" className="text-primary-600 text-sm font-semibold hover:text-primary-700">{t('vehicleDetail.backToVehicles')}</Link>
      </div>
    );
  }

  const totalDays = getTotalDays();
  const liveBreakdown = calculateBookingPrice({
    vehicle: {
      price_per_day: Number(vehicle.price_per_day),
      deposit_amount: Number(vehicle.deposit_amount),
      young_driver_fee_per_day: Number(vehicle.young_driver_fee_per_day ?? 0),
      min_driver_age: vehicle.min_driver_age ?? 21,
      currency: (vehicle.currency ?? 'EUR'),
    },
    days: totalDays,
    insurance: selectedInsurance,
    extras: extrasSelections,
    driverAge,
    taxPercent,
  });
  const totalPrice = liveBreakdown.total;
  const features = Array.isArray(vehicle.features) ? vehicle.features : [];

  if (step === 'customize' && company && profile) {
    return (
      <div className="min-h-screen bg-gray-50/80 pt-[68px]">
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button onClick={goBack} className="inline-flex items-center gap-1.5 text-sm text-dark-500 hover:text-dark-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              {t('vehicleDetail.backToVehicle')}
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <StepIndicator current={1} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-8">
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-5 h-5 text-primary-600" />
                  <h2 className="text-lg font-bold text-dark-950">{t('customize.insuranceTitle', 'Zgjidh sigurimin')}</h2>
                </div>
                <p className="text-sm text-dark-500 mb-4">
                  {t('customize.insuranceDesc', 'Mbron veturen dhe ty gjate qerase. Rekomandojme CDW Standard ose me lart.')}
                </p>
                <Suspense fallback={<div className="h-32 bg-gray-50 rounded-xl animate-pulse" />}>
                  <InsurancePlanSelector
                    companyId={company.id}
                    totalDays={totalDays}
                    selectedId={selectedInsurance?.id ?? null}
                    onSelect={setSelectedInsurance}
                    displayCurrency={vehicle.currency ?? 'EUR'}
                  />
                </Suspense>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-5 h-5 text-primary-600" />
                  <h2 className="text-lg font-bold text-dark-950">{t('customize.extrasTitle', 'Shto shtesa')}</h2>
                </div>
                <p className="text-sm text-dark-500 mb-4">
                  {t('customize.extrasDesc', 'Bej qiren me te rehatshme — sjellese, GPS, Wi-Fi e me shume.')}
                </p>
                <Suspense fallback={<div className="h-32 bg-gray-50 rounded-xl animate-pulse" />}>
                  <ExtrasSelector
                    companyId={company.id}
                    totalDays={totalDays}
                    selections={extrasSelections}
                    onChange={setExtrasSelections}
                    displayCurrency={vehicle.currency ?? 'EUR'}
                  />
                </Suspense>
              </section>
            </div>

            <aside className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <PriceBreakdown
                  breakdown={liveBreakdown}
                  days={totalDays}
                  pricePerDay={Number(vehicle.price_per_day)}
                />
                <button
                  onClick={handleCustomizeToInvoice}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all shadow-sm shadow-primary-600/20 active:scale-[0.98]"
                >
                  {t('customize.continue', 'Vazhdo')}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'invoice' && company && profile) {
    return (
      <div className="min-h-screen bg-gray-50/80 pt-[68px]">
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button onClick={goBack} className="inline-flex items-center gap-1.5 text-sm text-dark-500 hover:text-dark-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              {t('vehicleDetail.backToVehicle')}
            </button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <StepIndicator current={2} />

          <BookingInvoice
            vehicle={vehicle}
            company={company}
            profile={profile}
            pickupDate={pickupDate}
            returnDate={returnDate}
            totalDays={totalDays}
            totalPrice={totalPrice}
          />

          <div className="mt-6">
            <PriceBreakdown
              breakdown={liveBreakdown}
              days={totalDays}
              pricePerDay={Number(vehicle.price_per_day)}
            />
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button onClick={goBack} className="px-5 py-2.5 text-sm font-medium text-dark-600 hover:text-dark-900 transition-colors">
              {t('vehicleDetail.back')}
            </button>
            <button
              onClick={handleProceedToPayment}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all shadow-sm shadow-primary-600/20 active:scale-[0.98]"
            >
              {t('vehicleDetail.continueToPayment')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'payment' && company && profile) {
    return (
      <div className="min-h-screen bg-gray-50/80 pt-[68px]">
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button onClick={goBack} className="inline-flex items-center gap-1.5 text-sm text-dark-500 hover:text-dark-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              {t('vehicleDetail.backToInvoice')}
            </button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <StepIndicator current={3} />

          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-14 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                  {vehicle.main_image_url ? (
                    <img src={vehicle.main_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Car className="w-4 h-4 text-gray-300" /></div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-dark-900 text-sm">{vehicle.brand} {vehicle.model}</p>
                  <p className="text-xs text-dark-400">{t('vehicleDetail.daysCount', { count: totalDays })} | {new Date(pickupDate).toLocaleDateString(dateLocale)} - {new Date(returnDate).toLocaleDateString(dateLocale)}</p>
                </div>
              </div>
              <p className="text-lg font-bold text-primary-600">{formatCurrency(totalPrice, liveBreakdown.currency)}</p>
            </div>

            <Suspense fallback={<div className="h-24 bg-gray-50 rounded-xl animate-pulse" />}>
              <PaymentMethodSelector
                selected={paymentMethod}
                onSelect={setPaymentMethod}
              />
            </Suspense>
          </div>

          {bookingError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-red-700">{bookingError}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button onClick={goBack} className="px-5 py-2.5 text-sm font-medium text-dark-600 hover:text-dark-900 transition-colors">
              {t('vehicleDetail.back')}
            </button>
            <button
              onClick={handleConfirmBooking}
              disabled={booking || !paymentMethod}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all shadow-sm shadow-primary-600/20 active:scale-[0.98]"
            >
              {booking && <Loader2 className="w-4 h-4 animate-spin" />}
              {booking ? t('vehicleDetail.confirming') : t('vehicleDetail.confirmBooking')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'cash_hold' && cashBookingId) {
    return (
      <div className="min-h-screen bg-gray-50/80 pt-[68px]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-dark-950 mb-2">{t('vehicleDetail.cashHoldTitle')}</h2>
            <p className="text-sm text-dark-500 mb-6">{t('vehicleDetail.cashHoldDesc')}</p>
            <Suspense fallback={
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
              </div>
            }>
              <CashHoldForm
                bookingId={cashBookingId}
                onSuccess={() => setStep('success')}
                onError={(msg) => setBookingError(msg)}
              />
            </Suspense>
            {bookingError && (
              <p className="mt-4 text-sm text-red-600">{bookingError}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50/80 pt-[68px]">
        <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center animate-scale-in">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-dark-950 mb-2">{t('vehicleDetail.successTitle')}</h2>
            <p className="text-dark-500 mb-2">{t('vehicleDetail.successDesc')}</p>
            {paymentMethod === 'cash' && (
              <p className="text-sm text-amber-600 font-medium mb-4">{t('vehicleDetail.successCash')}</p>
            )}
            {paymentMethod === 'bank_transfer' && (
              <p className="text-sm text-emerald-600 font-medium mb-4">{t('vehicleDetail.successBank')}</p>
            )}
            {(paymentMethod === 'stripe' || paymentMethod === 'paypal') && (
              <p className="text-sm text-blue-600 font-medium mb-4">{t('vehicleDetail.successOnline')}</p>
            )}

            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <h4 className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-3">{t('vehicleDetail.summary')}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-dark-500">{t('vehicleDetail.vehicle')}</span>
                  <span className="font-medium text-dark-900">{vehicle.brand} {vehicle.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-500">{t('vehicleDetail.period')}</span>
                  <span className="font-medium text-dark-900">{t('vehicleDetail.daysCount', { count: totalDays })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-500">{t('vehicleDetail.paymentMethod')}</span>
                  <span className="font-medium text-dark-900">
                    {paymentMethod === 'stripe' && t('paymentLabel.stripe')}
                    {paymentMethod === 'paypal' && t('paymentLabel.paypal')}
                    {paymentMethod === 'bank_transfer' && t('paymentLabel.bank')}
                    {paymentMethod === 'cash' && t('paymentLabel.cash')}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-bold text-dark-900">{t('vehicleDetail.total')}</span>
                  <span className="font-bold text-primary-600">{formatCurrency(totalPrice, liveBreakdown.currency)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/dashboard/rezervimet" className="px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors">
                {t('vehicleDetail.myBookings')}
              </Link>
              <Link to="/automjetet" className="px-5 py-2.5 bg-gray-100 text-dark-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors">
                {t('vehicleDetail.browseOthers')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const vehicleTitle = `${vehicle.brand} ${vehicle.model} ${vehicle.year} - Qira${company?.city ? ' ne ' + company.city : ''} | RentaKar`;
  const vehicleDescription = `Rezervoni ${vehicle.brand} ${vehicle.model} ${vehicle.year}${company?.city ? ' ne ' + company.city : ''} per ${vehicle.price_per_day} EUR/dite. ${vehicle.transmission === 'automatike' ? 'Automatike' : 'Manuale'}, ${vehicle.fuel_type}, ${vehicle.seats} vende. Rezervim direkt online.`;
  const vehicleImage = vehicle.main_image_url || 'https://rentcars.life/og-image.jpg';
  const carSchema = {
    '@context': 'https://schema.org',
    '@type': 'Car',
    name: `${vehicle.brand} ${vehicle.model}`,
    brand: vehicle.brand,
    model: vehicle.model,
    vehicleModelDate: vehicle.year,
    fuelType: vehicle.fuel_type,
    vehicleTransmission: vehicle.transmission,
    numberOfDoors: vehicle.doors,
    vehicleSeatingCapacity: vehicle.seats,
    image: vehicleImage,
    offers: {
      '@type': 'Offer',
      price: Number(vehicle.price_per_day),
      priceCurrency: 'EUR',
      availability: vehicle.is_available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    ...(company?.rating && company.rating > 0 && company.total_reviews > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: company.rating,
        reviewCount: company.total_reviews,
      },
    } : {}),
  };

  return (
    <div className="min-h-screen bg-gray-50/80 pt-[68px]">
      <Helmet>
        <title>{vehicleTitle}</title>
        <meta name="description" content={vehicleDescription} />
        <link rel="canonical" href={`https://rentcars.life/automjetet/${vehicle.id}`} />
        <meta property="og:title" content={vehicleTitle} />
        <meta property="og:description" content={vehicleDescription} />
        <meta property="og:image" content={vehicleImage} />
        <meta property="og:url" content={`https://rentcars.life/automjetet/${vehicle.id}`} />
        <meta property="og:type" content="product" />
        <script type="application/ld+json">{JSON.stringify(carSchema)}</script>
      </Helmet>
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/automjetet" className="inline-flex items-center gap-1.5 text-sm text-dark-500 hover:text-dark-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t('vehicleDetail.backToVehicles')}
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="aspect-[16/9] bg-gray-100">
                <img
                  src={getOptimizedImageUrl(
                    vehicle.main_image_url || 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg',
                    { width: 1200, height: 675, quality: 85 },
                  )}
                  alt={vehicle.brand + ' ' + vehicle.model}
                  loading="eager"
                  decoding="async"
                  width={1200}
                  height={675}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-dark-950">{vehicle.brand} {vehicle.model}</h1>
                  <p className="text-dark-500 text-sm mt-1">{vehicle.year} | <span className="capitalize">{vehicle.category}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary-600">{formatCurrency(Number(vehicle.price_per_day), vehicle.currency ?? 'EUR')}</p>
                  <p className="text-xs text-dark-400">{t('vehicleDetail.perDay')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <Spec icon={<Cog className="w-4 h-4" />} label={t('vehicleDetail.transmission')} value={vehicle.transmission === 'automatike' ? t('vehicleDetail.transmissionAutomatic') : t('vehicleDetail.transmissionManual')} />
                <Spec icon={<Fuel className="w-4 h-4" />} label={t('vehicleDetail.fuel')} value={vehicle.fuel_type} />
                <Spec icon={<Users className="w-4 h-4" />} label={t('vehicleDetail.seats')} value={t('vehicleDetail.seatsCount', { count: vehicle.seats })} />
                <Spec icon={<DoorOpen className="w-4 h-4" />} label={t('vehicleDetail.doors')} value={t('vehicleDetail.doorsCount', { count: vehicle.doors })} />
              </div>

              {vehicle.mileage > 0 && (
                <div className="flex items-center gap-2 text-sm text-dark-500 mb-4">
                  <Gauge className="w-4 h-4 text-dark-400" />
                  <span>{vehicle.mileage.toLocaleString()} km</span>
                </div>
              )}

              {features.length > 0 && (
                <div>
                  <h3 className="font-semibold text-dark-950 mb-3">{t('vehicleDetail.features')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {(features as string[]).map((f, i) => (
                      <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg text-xs text-dark-600 font-medium">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {reviews.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-dark-950">
                    {t('vehicleDetail.reviewsTitle')} ({company?.total_reviews || reviews.length})
                  </h3>
                  {company?.rating && company.rating > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-accent-500 text-accent-500" />
                      <span className="font-bold text-dark-900">{company.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {reviews.map(r => (
                    <div key={r.id} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-1 mb-1.5">
                        {[1,2,3,4,5].map(star => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= r.rating
                                ? 'fill-accent-500 text-accent-500'
                                : 'text-gray-200'
                            }`}
                          />
                        ))}
                        <span className="text-xs text-dark-400 ml-2">
                          {new Date(r.created_at).toLocaleDateString(dateLocale)}
                        </span>
                      </div>
                      {r.comment && (
                        <p className="text-sm text-dark-700 leading-relaxed">{r.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {company && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-semibold text-dark-950 mb-4">{t('vehicleDetail.companyTitle')}</h3>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {company.logo_url ? (
                      <img src={company.logo_url} alt={company.name} className="w-14 h-14 object-cover" />
                    ) : (
                      <Building2 className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-dark-900">{company.name}</h4>
                    <div className="flex items-center gap-3 mt-1 text-sm text-dark-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {company.city}, {company.country}
                      </span>
                      {company.rating > 0 && (
                        <span className="flex items-center gap-1 text-accent-600 font-medium">
                          <Star className="w-3.5 h-3.5 fill-accent-500 text-accent-500" />
                          {company.rating} ({company.total_reviews})
                        </span>
                      )}
                    </div>
                    {company.phone && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-dark-500">
                        <Phone className="w-3 h-3" />
                        {company.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-semibold text-dark-950 mb-5">{t('vehicleDetail.bookNow')}</h3>

                <AvailabilityCalendar
                  vehicleId={vehicle.id}
                  pickupDate={pickupDate}
                  returnDate={returnDate}
                  onSelect={(p, r) => {
                    setPickupDate(p);
                    setReturnDate(r);
                  }}
                />

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-[10px] uppercase font-medium text-dark-400">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      {t('vehicleDetail.pickup')}
                    </p>
                    <p className="font-semibold text-dark-900 mt-0.5">
                      {pickupDate ? new Date(pickupDate).toLocaleDateString(dateLocale) : '—'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-[10px] uppercase font-medium text-dark-400">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      {t('vehicleDetail.return')}
                    </p>
                    <p className="font-semibold text-dark-900 mt-0.5">
                      {returnDate ? new Date(returnDate).toLocaleDateString(dateLocale) : '—'}
                    </p>
                  </div>
                </div>

                {totalDays > 0 && (
                  <div className="mt-5 pt-5 border-t border-gray-100 space-y-2.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-500">{formatCurrency(Number(vehicle.price_per_day), liveBreakdown.currency)} × {t('vehicleDetail.daysCount', { count: totalDays })}</span>
                      <span className="font-medium text-dark-900">{formatCurrency(liveBreakdown.baseRental, liveBreakdown.currency)}</span>
                    </div>
                    {Number(vehicle.deposit_amount) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-dark-500">{t('vehicleDetail.deposit')}</span>
                        <span className="font-medium text-dark-900">{formatCurrency(Number(vehicle.deposit_amount), liveBreakdown.currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold pt-2.5 border-t border-gray-100">
                      <span className="text-dark-950">{t('vehicleDetail.total')}</span>
                      <span className="text-primary-600">{formatCurrency(totalPrice, liveBreakdown.currency)}</span>
                    </div>
                  </div>
                )}

                {(bookingError || availabilityError) && (
                  <p className="mt-3 text-sm text-red-600">{bookingError || availabilityError}</p>
                )}

                <button
                  onClick={handleProceedToInvoice}
                  disabled={booking || checkingAvailability}
                  className="w-full mt-5 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm shadow-primary-600/20 active:scale-[0.98]"
                >
                  {checkingAvailability && <Loader2 className="w-4 h-4 animate-spin" />}
                  {!user ? t('vehicleDetail.loginToBook') : checkingAvailability ? t('vehicleDetail.checkingAvailability') : t('vehicleDetail.book')}
                </button>

                <div className="mt-4 flex items-center gap-2 text-xs text-dark-400">
                  <Shield className="w-3.5 h-3.5 text-green-500" />
                  {t('vehicleDetail.freeCancellation')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Spec({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3.5">
      <div className="flex items-center gap-2 text-dark-400 mb-1">{icon}<span className="text-[11px] font-medium">{label}</span></div>
      <p className="text-sm font-semibold text-dark-900 capitalize">{value}</p>
    </div>
  );
}

function StepIndicator({ current }: { current: number }) {
  const { t } = useTranslation();
  const steps = [
    { num: 0, label: t('steps.dates') },
    { num: 1, label: t('steps.customize', 'Personalizo') },
    { num: 2, label: t('steps.invoice') },
    { num: 3, label: t('steps.payment') },
  ];

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((s, i) => (
        <div key={s.num} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            s.num < current ? 'bg-green-500 text-white' :
            s.num === current ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30' :
            'bg-gray-200 text-dark-400'
          }`}>
            {s.num < current ? <CheckCircle2 className="w-4 h-4" /> : s.num + 1}
          </div>
          <span className={`text-xs font-medium hidden sm:inline ${
            s.num === current ? 'text-primary-600' : s.num < current ? 'text-green-600' : 'text-dark-400'
          }`}>
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <div className={`w-8 sm:w-16 h-0.5 ${s.num < current ? 'bg-green-400' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}
