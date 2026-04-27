import { useState, useEffect } from 'react';
import { Car, CalendarDays, Check, X, Loader2, CreditCard, Wallet, Building, Banknote, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Booking, Vehicle, Company } from '../../lib/types';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { companyNavItems } from '../../lib/companyNav';
import { sendBookingApprovedEmail, sendBookingRejectedEmail, sendBookingCompletedEmail } from '../../lib/emailService';
import { issueInvoiceAndNotify } from '../../lib/invoiceService';
import { createNotification } from '../../lib/notificationService';

const ITEMS_PER_PAGE = 10;

const paymentMethodLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  stripe: { label: 'Karte', icon: <CreditCard className="w-3 h-3" /> },
  paypal: { label: 'PayPal', icon: <Wallet className="w-3 h-3" /> },
  bank_transfer: { label: 'Transfer', icon: <Building className="w-3 h-3" /> },
  cash: { label: 'Kesh', icon: <Banknote className="w-3 h-3" /> },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Ne pritje', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Konfirmuar', color: 'bg-blue-100 text-blue-700' },
  active: { label: 'Aktiv', color: 'bg-green-100 text-green-700' },
  completed: { label: 'Perfunduar', color: 'bg-gray-100 text-gray-600' },
  cancelled: { label: 'Anuluar', color: 'bg-red-100 text-red-700' },
};

const paymentStatusLabels: Record<string, { label: string; color: string }> = {
  paid: { label: 'Paguar', color: 'bg-green-100 text-green-700' },
  pending: { label: 'Ne pritje', color: 'bg-yellow-100 text-yellow-700' },
  failed: { label: 'Deshtuar', color: 'bg-red-100 text-red-700' },
};

type BookingWithRelations = Booking & { vehicle?: Vehicle };

export default function CompanyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setCompanyId] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [tab, setTab] = useState('');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [approveModal, setApproveModal] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  useEffect(() => {
    setPage(1);
  }, [tab]);

  async function loadData() {
    try {
      setError(null);
      setLoading(true);

      const { data: comp, error: compError } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_id', user!.id)
        .maybeSingle();

      if (compError) throw compError;

      if (comp) {
        setCompanyId(comp.id);
        setCompany(comp as Company);

        const { data, error: bookingsError } = await supabase
          .from('bookings')
          .select('*, vehicle:vehicles(*)')
          .eq('company_id', comp.id)
          .order('created_at', { ascending: false });

        if (bookingsError) throw bookingsError;

        setBookings((data || []) as BookingWithRelations[]);
      }
    } catch (err: any) {
      setError(err.message || 'Ndodhi nje gabim gjate ngarkimit te te dhenave.');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    const booking = bookings.find(b => b.id === id);
    if (!booking || !company) return;

    try {
      setActionLoading(id);
      setError(null);

      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', id);

      if (updateError) throw updateError;

      const vehicleName = booking.vehicle ? `${booking.vehicle.brand} ${booking.vehicle.model}` : 'Automjet';

      await sendBookingApprovedEmail(
        booking.client_email,
        booking.client_name,
        {
          bookingId: booking.id,
          vehicleName,
          companyName: company.name,
          companyEmail: company.email || '',
          companyPhone: company.phone || '',
          pickupDate: new Date(booking.pickup_date).toLocaleDateString('sq-AL'),
          returnDate: new Date(booking.return_date).toLocaleDateString('sq-AL'),
          pickupLocation: booking.pickup_location || company.city || '',
          totalPrice: booking.total_price,
        }
      );

      await issueInvoiceAndNotify({
        bookingId: booking.id,
        companyId: company.id,
        clientId: booking.client_id,
        clientName: booking.client_name,
        clientEmail: booking.client_email,
        clientPhone: booking.client_phone || '',
        companyName: company.name,
        companyEmail: company.email || '',
        companyPhone: company.phone || '',
        vehicleName,
        pickupDate: booking.pickup_date,
        returnDate: booking.return_date,
        totalDays: booking.total_days,
        pricePerDay: Number(booking.price_per_day),
        depositAmount: Number(booking.deposit_amount),
        totalPrice: Number(booking.total_price),
        paymentMethod: booking.payment_method,
      });

      await createNotification({
        userId: booking.client_id,
        title: 'Rezervimi u aprovua!',
        message: `Kompania ${company.name} aprovoi rezervimin tuaj per ${vehicleName}. Fatura eshte gati ne dashboard.`,
        type: 'booking_approved',
        referenceId: booking.id,
        referenceType: 'booking',
      });

      await loadData();
    } catch (err: any) {
      setError(err.message || 'Ndodhi nje gabim gjate aprovimit te rezervimit.');
    } finally {
      setActionLoading(null);
      setApproveModal(null);
    }
  }

  async function handleReject(id: string) {
    const booking = bookings.find(b => b.id === id);
    if (!booking || !company) return;

    const reason = rejectReason.trim() || 'Automjeti nuk eshte i disponueshem per keto data.';

    try {
      setActionLoading(id);
      setError(null);

      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled', notes: reason })
        .eq('id', id);

      if (updateError) throw updateError;

      const vehicleName = booking.vehicle ? `${booking.vehicle.brand} ${booking.vehicle.model}` : 'Automjet';

      await sendBookingRejectedEmail(
        booking.client_email,
        booking.client_name,
        {
          bookingId: booking.id,
          vehicleName,
          pickupDate: new Date(booking.pickup_date).toLocaleDateString('sq-AL'),
          returnDate: new Date(booking.return_date).toLocaleDateString('sq-AL'),
          rejectionReason: reason,
        }
      );

      await createNotification({
        userId: booking.client_id,
        title: 'Rezervimi u refuzua',
        message: `Rezervimi juaj per ${vehicleName} u refuzua. Arsyeja: ${reason}`,
        type: 'booking_rejected',
        referenceId: booking.id,
        referenceType: 'booking',
      });

      await loadData();
    } catch (err: any) {
      setError(err.message || 'Ndodhi nje gabim gjate refuzimit te rezervimit.');
    } finally {
      setActionLoading(null);
      setRejectModal(null);
      setRejectReason('');
    }
  }

  async function updateStatus(id: string, status: string) {
    const booking = bookings.find(b => b.id === id);
    if (!booking || !company) return;

    try {
      setActionLoading(id);
      setError(null);

      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id);

      if (updateError) throw updateError;

      const vehicleName = booking.vehicle ? `${booking.vehicle.brand} ${booking.vehicle.model}` : 'Automjet';

      if (status === 'completed') {
        await sendBookingCompletedEmail(
          booking.client_email,
          booking.client_name,
          {
            bookingId: booking.id,
            vehicleName,
            pickupDate: new Date(booking.pickup_date).toLocaleDateString('sq-AL'),
            returnDate: new Date(booking.return_date).toLocaleDateString('sq-AL'),
          }
        );

        await supabase
          .from('invoices')
          .update({ payment_status: 'paid', status: 'paid', paid_at: new Date().toISOString() })
          .eq('booking_id', booking.id);

        await supabase
          .from('bookings')
          .update({ payment_status: 'paid' })
          .eq('id', booking.id);

        await createNotification({
          userId: booking.client_id,
          title: 'Rezervimi perfundoi',
          message: `Rezervimi juaj per ${vehicleName} ka perfunduar. Faleminderit qe perdoret RentaKar!`,
          type: 'booking_completed',
          referenceId: booking.id,
          referenceType: 'booking',
        });
      }

      if (status === 'active') {
        await createNotification({
          userId: booking.client_id,
          title: 'Rezervimi filloi',
          message: `Rezervimi juaj per ${vehicleName} ka filluar. Gezuar udhetimin!`,
          type: 'booking_started',
          referenceId: booking.id,
          referenceType: 'booking',
        });
      }

      await loadData();
    } catch (err: any) {
      setError(err.message || 'Ndodhi nje gabim gjate perditesimit te statusit.');
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = tab ? bookings.filter(b => b.status === tab) : bookings;
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <DashboardLayout title="Rezervimet" navItems={companyNavItems}>
      <h1 className="text-2xl font-bold text-dark-950 mb-1">Menaxho rezervimet</h1>
      <p className="text-dark-500 mb-6 text-[15px]">Pranoni, refuzoni ose perfundoni rezervimet e klienteve</p>

      <div className="flex flex-wrap gap-1.5 mb-6">
        {[['', 'Te gjitha'], ['pending', 'Ne pritje'], ['confirmed', 'Konfirmuara'], ['active', 'Aktive'], ['completed', 'Perfunduara'], ['cancelled', 'Anuluara']].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${tab === v ? 'bg-primary-600 text-white' : 'bg-white text-dark-600 border border-gray-200 hover:bg-gray-50'}`}>
            {l}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-7 h-7 text-primary-600 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-dark-600 font-medium">Nuk ka rezervime</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginated.map(b => {
              const s = statusLabels[b.status] || statusLabels.pending;
              const ps = b.payment_status ? paymentStatusLabels[b.payment_status] : paymentStatusLabels.pending;
              const isActioning = actionLoading === b.id;
              return (
                <div key={b.id} className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                        {b.vehicle?.main_image_url ? <img src={b.vehicle.main_image_url} alt="" className="w-12 h-12 object-cover" /> : <Car className="w-5 h-5 text-gray-400" />}
                      </div>
                      <div>
                        <p className="font-semibold text-dark-900">{b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model}` : 'Automjet'}</p>
                        <p className="text-xs text-dark-500 mt-0.5">{b.client_name} | {b.client_email}</p>
                        <p className="text-[11px] text-dark-400 mt-0.5">
                          {new Date(b.pickup_date).toLocaleDateString('sq-AL')} - {new Date(b.return_date).toLocaleDateString('sq-AL')} ({b.total_days} dite)
                        </p>
                        {b.deposit_amount && (
                          <p className="text-[11px] text-dark-400 mt-0.5">
                            Depozite: {b.deposit_amount} EUR
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-right">
                        <p className="text-sm font-bold text-dark-900">{b.total_price} EUR</p>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${ps.color}`}>
                          {ps.label}
                        </span>
                      </div>
                      {b.payment_method && paymentMethodLabels[b.payment_method] && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-[10px] font-medium text-dark-500">
                          {paymentMethodLabels[b.payment_method].icon}
                          {paymentMethodLabels[b.payment_method].label}
                        </span>
                      )}
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${s.color}`}>{s.label}</span>

                      {b.status === 'pending' && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setApproveModal(b.id)}
                            disabled={isActioning}
                            className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                            title="Konfirmo"
                          >
                            {isActioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setRejectModal(b.id)}
                            disabled={isActioning}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                            title="Refuzo"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      {b.status === 'confirmed' && (
                        <button
                          onClick={() => updateStatus(b.id, 'active')}
                          disabled={isActioning}
                          className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {isActioning ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Fillo'}
                        </button>
                      )}
                      {b.status === 'active' && (
                        <button
                          onClick={() => updateStatus(b.id, 'completed')}
                          disabled={isActioning}
                          className="px-3 py-1.5 bg-dark-800 text-white text-xs font-semibold rounded-lg hover:bg-dark-900 transition-colors disabled:opacity-50"
                        >
                          {isActioning ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Perfundo'}
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
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 bg-white text-dark-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-xs font-semibold transition-all ${page === p ? 'bg-primary-600 text-white' : 'bg-white text-dark-600 border border-gray-200 hover:bg-gray-50'}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 bg-white text-dark-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {approveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-dark-900 mb-2">Konfirmo aprovimin</h3>
            <p className="text-sm text-dark-500 mb-6">Konfirmo aprovimin e rezervimit?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setApproveModal(null)}
                className="px-4 py-2 text-sm font-medium text-dark-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Anulo
              </button>
              <button
                onClick={() => handleApprove(approveModal)}
                disabled={actionLoading === approveModal}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading === approveModal && <Loader2 className="w-4 h-4 animate-spin" />}
                Konfirmo
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-dark-900 mb-2">Refuzo rezervimin</h3>
            <p className="text-sm text-dark-500 mb-4">Shkruani arsyen e refuzimit:</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Arsyeja e refuzimit (opsionale)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-dark-800 placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="px-4 py-2 text-sm font-medium text-dark-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Anulo
              </button>
              <button
                onClick={() => handleReject(rejectModal)}
                disabled={actionLoading === rejectModal}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading === rejectModal && <Loader2 className="w-4 h-4 animate-spin" />}
                Refuzo
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
