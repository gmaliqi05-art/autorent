import { useState, useEffect } from 'react';
import { CalendarDays, Car, FileText, MapPin, Loader2, CreditCard, Wallet, Building, Banknote, Download, AlertTriangle, ChevronLeft, ChevronRight, Star, X, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Booking, Vehicle, Company } from '../../lib/types';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { clientNavItems } from '../../lib/clientNav';
import BookingInvoice from '../../components/booking/BookingInvoice';

const ITEMS_PER_PAGE = 10;

const paymentMethodLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  stripe: { label: 'Karte', icon: <CreditCard className="w-3 h-3" /> },
  paypal: { label: 'PayPal', icon: <Wallet className="w-3 h-3" /> },
  bank_transfer: { label: 'Transfer', icon: <Building className="w-3 h-3" /> },
  cash: { label: 'Kesh', icon: <Banknote className="w-3 h-3" /> },
};

const paymentStatusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Ne pritje', color: 'bg-yellow-100 text-yellow-700' },
  paid: { label: 'Paguar', color: 'bg-green-100 text-green-700' },
  failed: { label: 'Deshtuar', color: 'bg-red-100 text-red-700' },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Ne pritje', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Konfirmuar', color: 'bg-blue-100 text-blue-700' },
  active: { label: 'Aktiv', color: 'bg-green-100 text-green-700' },
  completed: { label: 'Perfunduar', color: 'bg-gray-100 text-gray-600' },
  cancelled: { label: 'Anuluar', color: 'bg-red-100 text-red-700' },
};

const filterTabs = [
  { value: '', label: 'Te gjitha' },
  { value: 'pending', label: 'Ne pritje' },
  { value: 'confirmed', label: 'Konfirmuara' },
  { value: 'active', label: 'Aktive' },
  { value: 'completed', label: 'Perfunduara' },
  { value: 'cancelled', label: 'Anuluara' },
];

export default function ClientBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<(Booking & { vehicle?: Vehicle; company?: Company })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [invoiceBooking, setInvoiceBooking] = useState<(Booking & { vehicle?: Vehicle; company?: Company }) | null>(null);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [reviewBooking, setReviewBooking] = useState<(Booking & { vehicle?: Vehicle; company?: Company }) | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewHover, setReviewHover] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<string>>(new Set());
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadBookings();
  }, [user]);

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
      setError('Ndodhi nje gabim gjate ngarkimit te rezervimeve. Ju lutem provoni perseri.');
      setLoading(false);
      return;
    }
    setBookings((bookingsRes.data || []) as (Booking & { vehicle?: Vehicle; company?: Company })[]);
    const reviewedIds = new Set<string>((reviewsRes.data || []).map((r: { booking_id: string }) => r.booking_id));
    setReviewedBookingIds(reviewedIds);
    setLoading(false);
  }

  const filtered = statusFilter ? bookings.filter(b => b.status === statusFilter) : bookings;
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  async function submitReview() {
    if (!reviewBooking || !user) return;
    setSubmittingReview(true);
    const { error } = await supabase.from('reviews').insert({
      booking_id: reviewBooking.id,
      company_id: reviewBooking.company_id,
      client_id: user.id,
      rating: reviewRating,
      comment: reviewComment.trim(),
    });
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
    setCancelling(true);
    const { error: cancelError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('client_id', user!.id);
    setCancelling(false);
    setCancelConfirmId(null);
    if (cancelError) {
      setError('Ndodhi nje gabim gjate anulimit te rezervimit. Ju lutem provoni perseri.');
      return;
    }
    loadBookings();
  }

  return (
    <DashboardLayout title="Rezervimet" navItems={clientNavItems}>
      <h1 className="text-2xl font-bold text-dark-950 mb-1">Rezervimet e mia</h1>
      <p className="text-dark-500 mb-6 text-[15px]">Historiku i te gjitha rezervimeve tuaja</p>

      <div className="flex flex-wrap gap-1.5 mb-6">
        {filterTabs.map(t => (
          <button
            key={t.value}
            onClick={() => setStatusFilter(t.value)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === t.value ? 'bg-primary-600 text-white' : 'bg-white text-dark-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => { setError(null); loadBookings(); }}
            className="ml-auto text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
          >
            Provo perseri
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
          <p className="text-dark-600 font-medium">Nuk ka rezervime</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginated.map(b => {
              const s = statusLabels[b.status] || statusLabels.pending;
              const canCancel = b.status === 'pending';
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
                          {b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model}` : 'Automjet'}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-xs text-dark-500">
                            <CalendarDays className="w-3 h-3" />
                            {new Date(b.pickup_date).toLocaleDateString('sq-AL')} - {new Date(b.return_date).toLocaleDateString('sq-AL')}
                          </span>
                          {b.pickup_location && (
                            <span className="flex items-center gap-1 text-xs text-dark-500">
                              <MapPin className="w-3 h-3" />
                              {b.pickup_location}
                            </span>
                          )}
                          <span className="text-xs text-dark-400">{b.total_days} dite</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-dark-900">{b.total_price} EUR</span>
                        {b.deposit_amount > 0 && (
                          <span className="text-xs text-dark-400">+{b.deposit_amount} EUR depozite</span>
                        )}
                      </div>
                      {b.payment_method && paymentMethodLabels[b.payment_method] && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-[10px] font-medium text-dark-500">
                          {paymentMethodLabels[b.payment_method].icon}
                          {paymentMethodLabels[b.payment_method].label}
                        </span>
                      )}
                      {b.payment_status && paymentStatusLabels[b.payment_status] && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${paymentStatusLabels[b.payment_status].color}`}>
                          {paymentStatusLabels[b.payment_status].label}
                        </span>
                      )}
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${s.color}`}>{s.label}</span>
                      {(b.status === 'confirmed' || b.status === 'active' || b.status === 'completed') && b.company && (
                        <button
                          onClick={() => setInvoiceBooking(b)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Shkarko faturen"
                        >
                          <Download className="w-3 h-3" />
                          Fatura
                        </button>
                      )}
                      {b.status === 'completed' && !reviewedBookingIds.has(b.id) && (
                        <button
                          onClick={() => { setReviewBooking(b); setReviewRating(5); setReviewComment(''); }}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <Star className="w-3 h-3" />
                          Vleresom
                        </button>
                      )}
                      {b.status === 'completed' && reviewedBookingIds.has(b.id) && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-600 bg-green-50 rounded-lg">
                          <Star className="w-3 h-3 fill-green-500" />
                          Vleresuar
                        </span>
                      )}
                      {canCancel && (
                        <button
                          onClick={() => setCancelConfirmId(b.id)}
                          className="text-xs text-red-600 font-medium hover:text-red-700 transition-colors"
                        >
                          Anulo
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

      {cancelConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark-950/40 backdrop-blur-sm" onClick={() => setCancelConfirmId(null)} />
          <div className="relative bg-white rounded-2xl border border-gray-100 p-6 w-full max-w-sm shadow-xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-dark-900 mb-2">Anulo rezervimin</h3>
              <p className="text-sm text-dark-500 mb-6">Jeni te sigurt?</p>
              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={() => setCancelConfirmId(null)}
                  disabled={cancelling}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-dark-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
                >
                  Jo
                </button>
                <button
                  onClick={() => cancelBooking(cancelConfirmId)}
                  disabled={cancelling}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {cancelling && <Loader2 className="w-4 h-4 animate-spin" />}
                  Po, anulo
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
                <h3 className="text-lg font-bold text-dark-900 mb-1">Faleminderit per vleresimin!</h3>
                <p className="text-sm text-dark-500">Vleresimi juaj u ruajt me sukses.</p>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="text-lg font-bold text-dark-900">Vlereso rezervimin</h3>
                    <p className="text-sm text-dark-500 mt-0.5">
                      {reviewBooking.vehicle ? `${reviewBooking.vehicle.brand} ${reviewBooking.vehicle.model}` : 'Automjet'}
                    </p>
                  </div>
                  <button onClick={() => setReviewBooking(null)} className="text-dark-400 hover:text-dark-600 p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-5">
                  <p className="text-sm font-medium text-dark-700 mb-2">Vleresimi juaj</p>
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
                      {reviewRating === 5 ? 'Shkelqyeshem' : reviewRating === 4 ? 'Shume mire' : reviewRating === 3 ? 'Mire' : reviewRating === 2 ? 'Mesatar' : 'Keq'}
                    </span>
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-medium text-dark-700 mb-1.5">Komenti (opsional)</label>
                  <textarea
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    rows={3}
                    placeholder="Ndani pervojën tuaj..."
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-dark-900 placeholder:text-dark-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setReviewBooking(null)}
                    disabled={submittingReview}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-dark-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
                  >
                    Anulo
                  </button>
                  <button
                    onClick={submitReview}
                    disabled={submittingReview}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 text-sm font-semibold text-white hover:bg-primary-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {submittingReview && <Loader2 className="w-4 h-4 animate-spin" />}
                    Dergo vleresimin
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
