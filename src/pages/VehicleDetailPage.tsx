import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Star, MapPin, Calendar, Fuel, Cog, Users, DoorOpen, Gauge, Shield, CheckCircle2, Loader2, Car, Building2, Phone, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Vehicle, Company, Review } from '../lib/types';
import BookingInvoice from '../components/booking/BookingInvoice';
import PaymentMethodSelector, { type PaymentMethodType } from '../components/booking/PaymentMethodSelector';
import { sendBookingConfirmationToClient, sendBookingNotificationToCompany } from '../lib/emailService';
import { createInvoice } from '../lib/invoiceService';
import { createNotification } from '../lib/notificationService';

type BookingStep = 'dates' | 'invoice' | 'payment' | 'success';

export default function VehicleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
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
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');

  function handlePickupChange(value: string) {
    setPickupDate(value);
    if (value && (!returnDate || returnDate <= value)) {
      const d = new Date(value);
      d.setDate(d.getDate() + 1);
      setReturnDate(d.toISOString().split('T')[0]);
    }
  }

  useEffect(() => {
    if (!id) return;
    loadVehicle();
  }, [id]);

  async function loadVehicle() {
    const { data } = await supabase
      .from('vehicles')
      .select('*, company:companies(*)')
      .eq('id', id)
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
    if (!pickupDate || !returnDate) { setBookingError('Zgjidhni datat e marrjes dhe kthimit.'); return; }
    if (days === 0) { setBookingError('Data e kthimit duhet te jete pas dates se marrjes.'); return; }
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
      setBookingError('Duhet te ngarkoni patenten dhe ta verifikoni para se te rezervoni. Shkoni te profili juaj per te ngarkuar dokumentet.');
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
      setAvailabilityError('Automjeti eshte i rezervuar per keto data. Ju lutem zgjidhni data te tjera.');
      return;
    }

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
      total_price: days * Number(vehicle.price_per_day),
      deposit_amount: vehicle.deposit_amount,
      status: 'pending',
      payment_method: paymentMethod,
      payment_status: paymentMethod === 'cash' ? 'pending' : 'pending',
      client_name: profile.full_name || '',
      client_phone: profile.phone || '',
      client_email: profile.email || '',
    }).select().single();

    if (error || !bookingData) {
      setBookingError('Dicka shkoi keq. Provoni perseri.');
      setBooking(false);
      return;
    }

    const paymentMethodLabel =
      paymentMethod === 'stripe' ? 'Karte krediti/debiti' :
      paymentMethod === 'paypal' ? 'PayPal' :
      paymentMethod === 'bank_transfer' ? 'Transfer bankar' : 'Kesh / Ne lokal';

    await sendBookingConfirmationToClient(
      profile.email || '',
      profile.full_name || '',
      {
        bookingId: bookingData.id,
        vehicleName: `${vehicle.brand} ${vehicle.model}`,
        companyName: company.name,
        pickupDate: new Date(pickupDate).toLocaleDateString('sq-AL'),
        returnDate: new Date(returnDate).toLocaleDateString('sq-AL'),
        totalDays: days,
        pricePerDay: Number(vehicle.price_per_day),
        deposit: Number(vehicle.deposit_amount),
        paymentMethod: paymentMethodLabel,
        totalPrice: days * Number(vehicle.price_per_day),
        status: 'Në pritje të aprovimit',
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
        pickupDate: new Date(pickupDate).toLocaleDateString('sq-AL'),
        returnDate: new Date(returnDate).toLocaleDateString('sq-AL'),
        totalDays: days,
        totalPrice: days * Number(vehicle.price_per_day),
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
      totalPrice: days * Number(vehicle.price_per_day),
      paymentMethod,
      status: 'draft',
    });

    await createNotification({
      userId: user.id,
      title: 'Rezervimi u krye',
      message: `Rezervimi juaj per ${vehicle.brand} ${vehicle.model} u krye me sukses. Kompania do ta shqyrtoje brenda 24 oreve.`,
      type: 'booking_created',
      referenceId: bookingData.id,
      referenceType: 'booking',
    });

    await createNotification({
      userId: company.owner_id,
      title: 'Rezervim i ri',
      message: `${profile.full_name} ka bere nje rezervim te ri per ${vehicle.brand} ${vehicle.model}. Shqyrtojeni ne dashboard.`,
      type: 'booking_created',
      referenceId: bookingData.id,
      referenceType: 'booking',
    });

    setStep('success');
    setBooking(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goBack() {
    if (step === 'payment') setStep('invoice');
    else if (step === 'invoice') setStep('dates');
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
        <p className="text-dark-600 font-medium">Automjeti nuk u gjet</p>
        <Link to="/automjetet" className="text-primary-600 text-sm font-semibold hover:text-primary-700">Kthehu te automjetet</Link>
      </div>
    );
  }

  const totalDays = getTotalDays();
  const totalPrice = totalDays * Number(vehicle.price_per_day);
  const features = Array.isArray(vehicle.features) ? vehicle.features : [];

  if (step === 'invoice' && company && profile) {
    return (
      <div className="min-h-screen bg-gray-50/80 pt-[68px]">
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button onClick={goBack} className="inline-flex items-center gap-1.5 text-sm text-dark-500 hover:text-dark-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Kthehu te automjeti
            </button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <StepIndicator current={1} />

          <BookingInvoice
            vehicle={vehicle}
            company={company}
            profile={profile}
            pickupDate={pickupDate}
            returnDate={returnDate}
            totalDays={totalDays}
            totalPrice={totalPrice}
          />

          <div className="mt-6 flex items-center justify-between">
            <button onClick={goBack} className="px-5 py-2.5 text-sm font-medium text-dark-600 hover:text-dark-900 transition-colors">
              Kthehu
            </button>
            <button
              onClick={handleProceedToPayment}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all shadow-sm shadow-primary-600/20 active:scale-[0.98]"
            >
              Vazhdo me pagesen
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
              Kthehu te fatura
            </button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <StepIndicator current={2} />

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
                  <p className="text-xs text-dark-400">{totalDays} dite | {new Date(pickupDate).toLocaleDateString('sq-AL')} - {new Date(returnDate).toLocaleDateString('sq-AL')}</p>
                </div>
              </div>
              <p className="text-lg font-bold text-primary-600">{totalPrice} EUR</p>
            </div>

            <PaymentMethodSelector
              selected={paymentMethod}
              onSelect={setPaymentMethod}
            />
          </div>

          {bookingError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-red-700">{bookingError}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button onClick={goBack} className="px-5 py-2.5 text-sm font-medium text-dark-600 hover:text-dark-900 transition-colors">
              Kthehu
            </button>
            <button
              onClick={handleConfirmBooking}
              disabled={booking || !paymentMethod}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all shadow-sm shadow-primary-600/20 active:scale-[0.98]"
            >
              {booking && <Loader2 className="w-4 h-4 animate-spin" />}
              {booking ? 'Duke perfunduar...' : 'Konfirmo rezervimin'}
            </button>
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
            <h2 className="text-2xl font-bold text-dark-950 mb-2">Rezervimi u krye me sukses!</h2>
            <p className="text-dark-500 mb-2">
              Faleminderit per rezervimin tuaj. Kompania do t'ju konfirmoje brenda 24 oreve.
            </p>
            {paymentMethod === 'cash' && (
              <p className="text-sm text-amber-600 font-medium mb-4">
                Pagesa do te kryhet ne momentin e marrjes se automjetit.
              </p>
            )}
            {paymentMethod === 'bank_transfer' && (
              <p className="text-sm text-emerald-600 font-medium mb-4">
                Ju lutem kryeni transferin bankar sipas detajeve te dhena. Rezervimi konfirmohet pas verifikimit.
              </p>
            )}
            {(paymentMethod === 'stripe' || paymentMethod === 'paypal') && (
              <p className="text-sm text-blue-600 font-medium mb-4">
                Pagesa juaj u regjistrua. Do te njoftoheni kur te procesohet.
              </p>
            )}

            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <h4 className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-3">Permbledhje</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-dark-500">Automjeti</span>
                  <span className="font-medium text-dark-900">{vehicle.brand} {vehicle.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-500">Periudha</span>
                  <span className="font-medium text-dark-900">{totalDays} dite</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-500">Metoda e pageses</span>
                  <span className="font-medium text-dark-900">
                    {paymentMethod === 'stripe' && 'Karte krediti/debiti'}
                    {paymentMethod === 'paypal' && 'PayPal'}
                    {paymentMethod === 'bank_transfer' && 'Transfer bankar'}
                    {paymentMethod === 'cash' && 'Kesh / Ne lokal'}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-bold text-dark-900">Totali</span>
                  <span className="font-bold text-primary-600">{totalPrice} EUR</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/dashboard/rezervimet" className="px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors">
                Shiko rezervimet e mia
              </Link>
              <Link to="/automjetet" className="px-5 py-2.5 bg-gray-100 text-dark-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors">
                Shfleto automjete te tjera
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
            Te gjitha automjetet
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="aspect-[16/9] bg-gray-100">
                <img
                  src={vehicle.main_image_url || 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=1200&h=675&fit=crop'}
                  alt={vehicle.brand + ' ' + vehicle.model}
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
                  <p className="text-3xl font-bold text-primary-600">{vehicle.price_per_day}EUR</p>
                  <p className="text-xs text-dark-400">per dite</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <Spec icon={<Cog className="w-4 h-4" />} label="Transmisioni" value={vehicle.transmission === 'automatike' ? 'Automatike' : 'Manuale'} />
                <Spec icon={<Fuel className="w-4 h-4" />} label="Karburanti" value={vehicle.fuel_type} />
                <Spec icon={<Users className="w-4 h-4" />} label="Vendet" value={`${vehicle.seats} vende`} />
                <Spec icon={<DoorOpen className="w-4 h-4" />} label="Dyert" value={`${vehicle.doors} dyer`} />
              </div>

              {vehicle.mileage > 0 && (
                <div className="flex items-center gap-2 text-sm text-dark-500 mb-4">
                  <Gauge className="w-4 h-4 text-dark-400" />
                  <span>{vehicle.mileage.toLocaleString()} km</span>
                </div>
              )}

              {features.length > 0 && (
                <div>
                  <h3 className="font-semibold text-dark-950 mb-3">Pajisjet</h3>
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
                    Vleresimet e klienteve ({company?.total_reviews || reviews.length})
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
                          {new Date(r.created_at).toLocaleDateString('sq-AL')}
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
                <h3 className="font-semibold text-dark-950 mb-4">Kompania</h3>
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
                <h3 className="font-semibold text-dark-950 mb-5">Rezervo tani</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-dark-600 mb-1.5">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Data e marrjes
                    </label>
                    <input
                      type="date"
                      min={today}
                      value={pickupDate}
                      onChange={e => handlePickupChange(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-dark-600 mb-1.5">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Data e kthimit
                    </label>
                    <input
                      type="date"
                      min={pickupDate || today}
                      value={returnDate}
                      onChange={e => setReturnDate(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    />
                  </div>
                </div>

                {totalDays > 0 && (
                  <div className="mt-5 pt-5 border-t border-gray-100 space-y-2.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-500">{vehicle.price_per_day}EUR x {totalDays} dite</span>
                      <span className="font-medium text-dark-900">{totalPrice}EUR</span>
                    </div>
                    {Number(vehicle.deposit_amount) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-dark-500">Depozita</span>
                        <span className="font-medium text-dark-900">{vehicle.deposit_amount}EUR</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold pt-2.5 border-t border-gray-100">
                      <span className="text-dark-950">Totali</span>
                      <span className="text-primary-600">{totalPrice}EUR</span>
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
                  {!user ? 'Kycu per te rezervuar' : checkingAvailability ? 'Duke kontrolluar...' : 'Rezervo'}
                </button>

                <div className="mt-4 flex items-center gap-2 text-xs text-dark-400">
                  <Shield className="w-3.5 h-3.5 text-green-500" />
                  Anulim falas deri ne 48 ore para marrjes
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
  const steps = [
    { num: 0, label: 'Datat' },
    { num: 1, label: 'Fatura' },
    { num: 2, label: 'Pagesa' },
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
