import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarDays, Car, FileText, MapPin, Loader2, CreditCard, Wallet, Building, Banknote, Download, AlertTriangle, ChevronLeft, ChevronRight, Star, X, CheckCircle2, Search, RotateCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { capturePaypalOrder } from '../../lib/paypalService';
import type { Booking, Vehicle, Company } from '../../lib/types';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { clientNavItems } from '../../lib/clientNav';
import BookingInvoice from '../../components/booking/BookingInvoice';
import { formatDate, bookingStatusColors, bookingStatusLabel, paymentStatusColors, paymentStatusLabel, paymentMethodLabel } from '../../lib/clientDashHelpers';

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const paymentMethodIcons: Record<string, React.ReactNode> = {
  stripe: <CreditCard className="w-3 h-3" />,
  paypal: <Wallet className="w-3 h-3" />,
  bank_transfer: <Building className="w-3 h-3" />,
  cash: <Banknote className="w-3 h-3" />,
};

export default function ClientBookings() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [bookings, setBookings] = useState<(Booking & { vehicle?: Vehicle; company?: Company })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [cancellationPreview, setCancellationPreview] = useState<{ id: string; fee: number; total: number } | null>(null);
  const [invoiceBooking, setInvoiceBooking] = useState<(Booking & { vehicle?: Vehicle; company?: Company }) | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [reviewBooking, setReviewBooking] = useState<(Booking & { vehicle?: Vehicle; company?: Company }) | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewHover, setReviewHover] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<string>>(new Set());
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const filterTabs = useMemo(() => [
    { value: '', label: t('clientDash.bookings.filterAll') },
    { value: 'pending', label: t('clientDash.bookingStatus.filterPending') },
    { value: 'confirmed', label: t('clientDash.bookingStatus.filterConfirmed') },
    { value: 'active', label: t('clientDash.bookingStatus.filterActive') },
    { value: 'completed', label: t('clientDash.bookingStatus.filterCompleted') },
    { value: 'cancelled', label: t('clientDash.bookingStatus.filterCancelled') },
  ], [t]);

  const ratingWords = [
    t('clientDash.bookings.ratingBad'),
    t('clientDash.bookings.ratingAverage'),
    t('clientDash.bookings.ratingGood'),
    t('clientDash.bookings.ratingVeryGood'),
    t('clientDash.bookings.ratingExcellent'),
  ];

  const [searchParams, setSearchParams] = useSearchParams();
  const [paypalCapturing, setPaypalCapturing] = useState(false);
  const [paypalMessage, setPaypalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    loadBookings();
  }, [user]);

  // Handle PayPal return: kur user kthehet me ?paypal=return&token=<orderId>, capture
  useEffect(() => {
    if (!user) return;
    const paypal = searchParams.get('paypal');
    const token = searchParams.get('token');
    if (paypal === 'return' && token) {
      setPaypalCapturing(true);
      capturePaypalOrder(token).then((res) => {
        setPaypalCapturing(false);
        if (res.error) {
          setPaypalMessage({ type: 'error', text: `Pagesa PayPal deshtoi: ${res.error}` });
        } else {
          setPaypalMessage({ type: 'success', text: 'Pagesa juaj me PayPal u perfundua me sukses!' });
          loadBookings();
        }
        // Pastro params nga URL
        setSearchParams({}, { replace: true });
        setTimeout(() => setPaypalMessage(null), 6000);
      });
    } else if (paypal === 'cancelled') {
      setPaypalMessage({ type: 'error', text: 'Pagesa PayPal u anulua.' });
      setSearchParams({}, { replace: true });
      setTimeout(() => setPaypalMessage(null), 5000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, searchParams]);

  async function loadBookings() {
    setLoading(true);
    setError(null);
    const [bookingsRes, reviewsRes] = await Promise.all([
      supabase
        .from('bookings')
        .select('*, vehicle:vehicles(*), company:companies(*)')
        .eq('client_id', user!.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('reviews')
        .select('booking_id')
        .eq('client_id', user!.id),
    ]);
    if (bookingsRes.error) {
      setError(t('clientDash.bookings.loadError'));
      setLoading(false);
      return;
    }
    setBookings((bookingsRes.data || []) as (Booking & { vehicle?: Vehicle; company?: Company })[]);
    const reviewedIds = new Set<string>((reviewsRes.data || []).map((r: { booking_id: string }) => r.booking_id));
    setReviewedBookingIds(reviewedIds);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bookings
      .filter(b => !statusFilter || b.status === statusFilter)
      .filter(b => !dateFrom || b.pickup_date >= dateFrom)
      .filter(b => !dateTo || b.pickup_date <= dateTo)
      .filter(b => {
        if (!q) return true;
        const hay = `${b.vehicle?.brand || ''} ${b.vehicle?.model || ''} ${b.company?.name || ''} ${b.pickup_location || ''}`.toLowerCase();
        return hay.includes(q);
      });
  }, [bookings, statusFilter, dateFrom, dateTo, searchQuery]);

  const pendingPaymentsTotal = useMemo(
    () => bookings
      .filter(b => b.payment_status === 'pending' && b.status !== 'cancelled')
      .reduce((sum, b) => sum + Number(b.total_price || 0), 0),
    [bookings]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, dateFrom, dateTo, searchQuery, pageSize]);

  function computeCancellationFee(booking: Booking): number {
    const hoursUntilPickup = (new Date(booking.pickup_date).getTime() - Date.now()) / (1000 * 60 * 60);
    const total = Number(booking.total_price || 0);
    if (hoursUntilPickup <= 0) return total;
    if (hoursUntilPickup < 48) return total * 0.5;
    return 0;
  }

  function requestCancel(b: Booking) {
    const fee = computeCancellationFee(b);
    setCancellationPreview({ id: b.id, fee, total: Number(b.total_price || 0) });
  }

  async function submitReview() {
    if (!reviewBooking || !user) return;
    setReviewError(null);
    if (reviewRating <= 3 && reviewComment.trim().length < 10) {
      setReviewError(t('clientDash.bookings.commentRequired'));
      return;
    }
    setSubmittingReview(true);
    const { error } = await supabase.from('reviews').upsert({
      booking_id: reviewBooking.id,
      company_id: reviewBooking.company_id,
      client_id: user.id,
      rating: reviewRating,
      comment: reviewComment.trim().slice(0, 500),
    }, { onConflict: 'booking_id' });
    setSubmittingReview(false);
    if (error) return;
    setReviewedBookingIds(prev => new Set([...prev, reviewBooking.id]));
    setReviewSuccess(true);
    setTimeout(() => {
      setReviewBooking(null);
      setReviewRating(5);
      setReviewComment('');
      setReviewSuccess(false);
    }, 1800);
  }

  async function cancelBooking(id: string) {
    if (!user) return;
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;
    if (booking.status === 'active' || booking.status === 'completed') {
      setError(t('clientDash.bookings.cannotCancelActive'));
      setCancellationPreview(null);
      return;
    }
    const fee = computeCancellationFee(booking);
    setCancelling(true);
    const { error: cancelError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancellation_fee: fee,
        cancelled_at: new Date().toISOString(),
        cancelled_by: user.id,
      })
      .eq('id', id)
      .eq('client_id', user.id);
    setCancelling(false);
    setCancellationPreview(null);
    if (cancelError) {
      setError(t('clientDash.bookings.cancelError'));
      return;
    }
    loadBookings();
  }

  return (
    <DashboardLayout title={t('clientNav.bookings')} navItems={clientNavItems}>
      <h1 className="text-2xl font-bold text-dark-950 mb-1">{t('clientDash.bookings.title')}</h1>
      <p className="text-dark-500 mb-6 text-[15px]">{t('clientDash.bookings.subtitle')}</p>

      {paypalCapturing && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
          <p className="text-sm text-blue-700 font-medium">Duke perfunduar pagesen me PayPal...</p>
        </div>
      )}

      {paypalMessage && (
        <div className={`mb-4 border rounded-xl p-4 flex items-center gap-3 ${
          paypalMessage.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          {paypalMessage.type === 'success'
            ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            : <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          }
          <p className={`text-sm font-medium ${paypalMessage.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
            {paypalMessage.text}
          </p>
        </div>
      )}

      {pendingPaymentsTotal > 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                {t('clientDash.bookings.pendingPaymentsTitle', { amount: pendingPaymentsTotal.toFixed(2) })}
              </p>
              <p className="text-xs text-amber-700">{t('clientDash.bookings.pendingPaymentsDesc')}</p>
            </div>
          </div>
          <Link to="/dashboard/pagesat" className="text-xs font-semibold text-amber-700 hover:text-amber-800 whitespace-nowrap">
            {t('clientDash.bookings.seeDetails')}
          </Link>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 mb-4">
        {filterTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === tab.value ? 'bg-primary-600 text-white' : 'bg-white text-dark-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-3 mb-6 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('clientDash.bookings.searchPlaceholder')}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark-900 placeholder:text-dark-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-dark-500 font-medium">{t('clientDash.bookings.from')}</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
          <label className="text-xs text-dark-500 font-medium">{t('clientDash.bookings.to')}</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>
        <select
          value={pageSize}
          onChange={e => setPageSize(Number(e.target.value))}
          className="px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
        >
          {PAGE_SIZE_OPTIONS.map(size => (
            <option key={size} value={size}>{t('clientDash.bookings.perPage', { count: size })}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => { setError(null); loadBookings(); }}
            className="ml-auto text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
          >
            {t('clientDash.bookings.tryAgain')}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-7 h-7 text-primary-600 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-dark-600 font-medium">{t('clientDash.bookings.noBookings')}</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginated.map(b => {
              const statusColor = bookingStatusColors[b.status] || bookingStatusColors.pending;
              const canCancel = b.status === 'pending';
              const paymentStatusInfo = paymentStatusColors[b.payment_status] || paymentStatusColors.pending;
              return (
                <div key={b.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                        {b.vehicle?.main_image_url ? (
                          <img src={b.vehicle.main_image_url} alt="" className="w-14 h-14 object-cover" />
                        ) : (
                          <Car className="w-5 h-5 text-dark-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-dark-900">
                          {b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model}` : t('clientDash.overview.vehicleFallback')}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-xs text-dark-500">
                            <CalendarDays className="w-3 h-3" />
                            {formatDate(b.pickup_date, i18n.language)} - {formatDate(b.return_date, i18n.language)}
                          </span>
                          {b.pickup_location && (
                            <span className="flex items-center gap-1 text-xs text-dark-500">
                              <MapPin className="w-3 h-3" />
                              {b.pickup_location}
                            </span>
                          )}
                          <span className="text-xs text-dark-400">{b.total_days} {t('clientDash.bookings.days')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-dark-900">{b.total_price} EUR</span>
                        {b.deposit_amount > 0 && (
                          <span className="text-xs text-dark-400">+{b.deposit_amount} EUR {t('clientDash.bookings.deposit')}</span>
                        )}
                      </div>
                      {b.payment_method && paymentMethodIcons[b.payment_method] && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-[10px] font-medium text-dark-500">
                          {paymentMethodIcons[b.payment_method]}
                          {paymentMethodLabel(b.payment_method, t)}
                        </span>
                      )}
                      {b.payment_status && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${paymentStatusInfo.bg}`}>
                          {paymentStatusLabel(b.payment_status, t)}
                        </span>
                      )}
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusColor}`}>
                        {bookingStatusLabel(b.status, t)}
                      </span>
                      {(b.status === 'confirmed' || b.status === 'active' || b.status === 'completed') && b.company && (
                        <button
                          onClick={() => setInvoiceBooking(b)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          title={t('clientDash.bookings.downloadInvoice')}
                        >
                          <Download className="w-3 h-3" />
                          {t('clientDash.bookings.invoice')}
                        </button>
                      )}
                      {b.status === 'completed' && !reviewedBookingIds.has(b.id) && (
                        <button
                          onClick={() => { setReviewBooking(b); setReviewRating(5); setReviewComment(''); setReviewError(null); }}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <Star className="w-3 h-3" />
                          {t('clientDash.bookings.review')}
                        </button>
                      )}
                      {b.status === 'completed' && reviewedBookingIds.has(b.id) && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-600 bg-green-50 rounded-lg">
                          <Star className="w-3 h-3 fill-green-500" />
                          {t('clientDash.bookings.reviewed')}
                        </span>
                      )}
                      {b.status === 'completed' && b.vehicle_id && (
                        <Link
                          to={`/automjetet/${b.vehicle_id}`}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <RotateCw className="w-3 h-3" />
                          {t('clientDash.bookings.rebook')}
                        </Link>
                      )}
                      {canCancel && (
                        <button
                          onClick={() => requestCancel(b)}
                          className="text-xs text-red-600 font-medium hover:text-red-700 transition-colors"
                        >
                          {t('clientDash.bookings.cancel')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="p-2 rounded-lg border border-gray-200 bg-white text-dark-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 rounded-lg text-xs font-semibold transition-all ${
                    safePage === page
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-dark-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="p-2 rounded-lg border border-gray-200 bg-white text-dark-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {cancellationPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark-950/40 backdrop-blur-sm" onClick={() => !cancelling && setCancellationPreview(null)} />
          <div className="relative bg-white rounded-2xl border border-gray-100 p-6 w-full max-w-md shadow-xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-dark-900 mb-2">{t('clientDash.bookings.cancelTitle')}</h3>
              <p className="text-sm text-dark-500 mb-4">{t('clientDash.bookings.cancelConfirm')}</p>
              {cancellationPreview.fee > 0 ? (
                <div className="w-full mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-left">
                  <p className="text-sm font-semibold text-amber-900 mb-1">
                    {t('clientDash.bookings.cancellationFeeTitle')}
                  </p>
                  <p className="text-xs text-amber-800">
                    {t('clientDash.bookings.cancellationFeeWarning', { fee: cancellationPreview.fee.toFixed(2) })}
                  </p>
                </div>
              ) : (
                <div className="w-full mb-5 p-4 rounded-xl bg-green-50 border border-green-200 text-left">
                  <p className="text-sm font-semibold text-green-900">
                    {t('clientDash.bookings.freeCancellation')}
                  </p>
                </div>
              )}
              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={() => setCancellationPreview(null)}
                  disabled={cancelling}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-dark-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
                >
                  {t('clientDash.bookings.no')}
                </button>
                <button
                  onClick={() => cancelBooking(cancellationPreview.id)}
                  disabled={cancelling}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {cancelling && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t('clientDash.bookings.yesCancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {invoiceBooking && invoiceBooking.company && (
        <BookingInvoice
          mode="dashboard"
          booking={invoiceBooking}
          vehicle={invoiceBooking.vehicle}
          company={invoiceBooking.company}
          onClose={() => setInvoiceBooking(null)}
        />
      )}

      {reviewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark-950/40 backdrop-blur-sm" onClick={() => !submittingReview && setReviewBooking(null)} />
          <div className="relative bg-white rounded-2xl border border-gray-100 p-6 w-full max-w-md shadow-xl">
            {reviewSuccess ? (
              <div className="flex flex-col items-center text-center py-4">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-dark-900 mb-1">{t('clientDash.bookings.reviewThanks')}</h3>
                <p className="text-sm text-dark-500">{t('clientDash.bookings.reviewSaved')}</p>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="text-lg font-bold text-dark-900">{t('clientDash.bookings.rateBooking')}</h3>
                    <p className="text-sm text-dark-500 mt-0.5">
                      {reviewBooking.vehicle ? `${reviewBooking.vehicle.brand} ${reviewBooking.vehicle.model}` : t('clientDash.overview.vehicleFallback')}
                    </p>
                  </div>
                  <button onClick={() => setReviewBooking(null)} className="text-dark-400 hover:text-dark-600 p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-5">
                  <p className="text-sm font-medium text-dark-700 mb-2">{t('clientDash.bookings.yourRating')}</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onMouseEnter={() => setReviewHover(star)}
                        onMouseLeave={() => setReviewHover(0)}
                        onClick={() => setReviewRating(star)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            star <= (reviewHover || reviewRating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm font-semibold text-dark-700">
                      {ratingWords[reviewRating - 1]}
                    </span>
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-medium text-dark-700 mb-1.5">{t('clientDash.bookings.commentLabel')}</label>
                  <textarea
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value.slice(0, 500))}
                    rows={3}
                    maxLength={500}
                    placeholder={t('clientDash.bookings.commentPlaceholder')}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-dark-900 placeholder:text-dark-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                  />
                  <p className="text-[10px] text-dark-400 mt-1 text-right">{reviewComment.length}/500</p>
                </div>

                {reviewError && (
                  <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700">{reviewError}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setReviewBooking(null)}
                    disabled={submittingReview}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-dark-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
                  >
                    {t('clientDash.bookings.cancel')}
                  </button>
                  <button
                    onClick={submitReview}
                    disabled={submittingReview}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 text-sm font-semibold text-white hover:bg-primary-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {submittingReview && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t('clientDash.bookings.submitReview')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
