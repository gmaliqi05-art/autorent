import { useState, useEffect, useMemo } from 'react';
import { Car, CalendarDays, Check, X, Loader2, CreditCard, Wallet, Building, Banknote, ChevronLeft, ChevronRight, Search, Download, StickyNote, Unlock, AlertTriangle, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Booking, Vehicle, Company } from '../../lib/types';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { companyNavItems } from '../../lib/companyNav';
import { sendBookingApprovedEmail, sendBookingRejectedEmail, sendBookingCompletedEmail } from '../../lib/emailService';
import { issueInvoiceAndNotify } from '../../lib/invoiceService';
import { createNotification } from '../../lib/notificationService';
import { exportToCSV } from '../../lib/csvExport';
import { releaseCashHold, captureCashHold } from '../../lib/stripeClient';
import CashHoldHelpModal from '../../components/booking/CashHoldHelpModal';
import {
  formatDate,
  bookingStatusColors,
  bookingStatusLabel,
  paymentStatusColors,
  paymentStatusLabel,
  paymentMethodLabel,
} from '../../lib/companyDashHelpers';

const ITEMS_PER_PAGE = 10;

const PAYMENT_METHOD_ICONS: Record<string, React.ReactNode> = {
  stripe: <CreditCard className="w-3 h-3" />,
  paypal: <Wallet className="w-3 h-3" />,
  bank_transfer: <Building className="w-3 h-3" />,
  cash: <Banknote className="w-3 h-3" />,
};

const ONLINE_PAYMENT_METHODS = new Set(['stripe', 'paypal']);

const REJECT_REASONS = ['maintenance', 'overloaded', 'missing_docs', 'other'] as const;

type BookingWithRelations = Booking & { vehicle?: Vehicle };

export default function CompanyBookings() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [tab, setTab] = useState('');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [approveModal, setApproveModal] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReasonKey, setRejectReasonKey] = useState<string>('maintenance');
  const [rejectReasonText, setRejectReasonText] = useState('');

  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [notesModal, setNotesModal] = useState<BookingWithRelations | null>(null);
  const [notesValue, setNotesValue] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const [holdActionLoading, setHoldActionLoading] = useState<string | null>(null);
  const [holdMessage, setHoldMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [captureModal, setCaptureModal] = useState<BookingWithRelations | null>(null);
  const [captureReason, setCaptureReason] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);

  const hasAnyCashHold = useMemo(() =>
    bookings.some(b => b.payment_method === 'cash' && b.cash_hold_status),
    [bookings]
  );

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  async function handleReleaseHold(b: BookingWithRelations) {
    if (!confirm(t('companyDash.bookings.cashHoldReleaseConfirm', { amount: b.cash_hold_amount || 100 }))) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setHoldActionLoading(b.id);
    const result = await releaseCashHold(b.id, session.access_token);
    setHoldActionLoading(null);
    if ('error' in result) {
      setHoldMessage({ type: 'error', text: result.error });
    } else {
      setHoldMessage({ type: 'success', text: t('companyDash.bookings.cashHoldReleasedMsg', { amount: b.cash_hold_amount }) });
      loadData();
    }
    setTimeout(() => setHoldMessage(null), 6000);
  }

  async function handleCaptureHold() {
    if (!captureModal) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const id = captureModal.id;
    setHoldActionLoading(id);
    const result = await captureCashHold(id, session.access_token, {
      reason: captureReason.trim() || undefined,
    });
    setHoldActionLoading(null);
    setCaptureModal(null);
    setCaptureReason('');
    if ('error' in result) {
      setHoldMessage({ type: 'error', text: result.error });
    } else {
      setHoldMessage({ type: 'success', text: t('companyDash.bookings.cashHoldCapturedMsg', { amount: result.capturedAmount }) });
      loadData();
    }
    setTimeout(() => setHoldMessage(null), 6000);
  }

  useEffect(() => {
    setPage(1);
  }, [tab, search, fromDate, toDate]);

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
        setCompany(comp as Company);

        const { data, error: bookingsError } = await supabase
          .from('bookings')
          .select('*, vehicle:vehicles(*)')
          .eq('company_id', comp.id)
          .order('created_at', { ascending: false });

        if (bookingsError) throw bookingsError;

        setBookings((data || []) as BookingWithRelations[]);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('companyDash.common.loadError');
      setError(message);
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

      // Conflict check: any confirmed/active booking for same vehicle overlapping dates
      const { data: conflicts, error: conflictErr } = await supabase
        .from('bookings')
        .select('id, pickup_date, return_date')
        .eq('vehicle_id', booking.vehicle_id)
        .in('status', ['confirmed', 'active'])
        .neq('id', booking.id)
        .lt('pickup_date', booking.return_date)
        .gt('return_date', booking.pickup_date);

      if (conflictErr) throw conflictErr;
      if (conflicts && conflicts.length > 0) {
        setError(t('companyDash.bookings.conflictError'));
        setActionLoading(null);
        setApproveModal(null);
        return;
      }

      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', id);

      if (updateError) throw updateError;

      const vehicleName = booking.vehicle ? `${booking.vehicle.brand} ${booking.vehicle.model}` : t('companyDash.common.vehicleFallback');

      await sendBookingApprovedEmail(
        booking.client_email,
        booking.client_name,
        {
          bookingId: booking.id,
          vehicleName,
          companyName: company.name,
          companyEmail: company.email || '',
          companyPhone: company.phone || '',
          pickupDate: formatDate(booking.pickup_date, i18n.language),
          returnDate: formatDate(booking.return_date, i18n.language),
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
        title: t('companyDash.bookings.notifApprovedTitle'),
        message: t('companyDash.bookings.notifApprovedMsg', { company: company.name, vehicle: vehicleName }),
        type: 'booking_approved',
        referenceId: booking.id,
        referenceType: 'booking',
        templateKey: 'booking_approved',
        templateVars: { companyName: company.name, vehicle: vehicleName },
      });

      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('companyDash.common.saveError');
      setError(message);
    } finally {
      setActionLoading(null);
      setApproveModal(null);
    }
  }

  async function handleReject(id: string) {
    const booking = bookings.find(b => b.id === id);
    if (!booking || !company) return;

    const reasonLabel = t(`companyDash.bookings.rejectReason_${rejectReasonKey}`);
    const extra = rejectReasonText.trim();
    const reason = extra ? `${reasonLabel} - ${extra}` : reasonLabel;

    try {
      setActionLoading(id);
      setError(null);

      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled', notes: reason })
        .eq('id', id);

      if (updateError) throw updateError;

      const vehicleName = booking.vehicle ? `${booking.vehicle.brand} ${booking.vehicle.model}` : t('companyDash.common.vehicleFallback');

      await sendBookingRejectedEmail(
        booking.client_email,
        booking.client_name,
        {
          bookingId: booking.id,
          vehicleName,
          pickupDate: formatDate(booking.pickup_date, i18n.language),
          returnDate: formatDate(booking.return_date, i18n.language),
          rejectionReason: reason,
        }
      );

      await createNotification({
        userId: booking.client_id,
        title: t('companyDash.bookings.notifRejectedTitle'),
        message: t('companyDash.bookings.notifRejectedMsg', { vehicle: vehicleName, reason }),
        type: 'booking_rejected',
        referenceId: booking.id,
        referenceType: 'booking',
        templateKey: 'booking_rejected',
        templateVars: { companyName: company.name, vehicle: vehicleName, reason },
      });

      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('companyDash.common.saveError');
      setError(message);
    } finally {
      setActionLoading(null);
      setRejectModal(null);
      setRejectReasonText('');
      setRejectReasonKey('maintenance');
    }
  }

  async function handleConfirmBankTransfer(id: string) {
    const booking = bookings.find(b => b.id === id);
    if (!booking || !company) return;
    if (!confirm(t('companyDash.bookings.confirmBankTransferPrompt', 'Konfirmoji qe e keni pranuar transferin bankar per kete rezervim?'))) return;

    try {
      setActionLoading(id);
      setError(null);

      const { error: updateErr } = await supabase
        .from('bookings')
        .update({ payment_status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', id);
      if (updateErr) throw updateErr;

      // Update invoice nese ekziston
      await supabase
        .from('invoices')
        .update({ payment_status: 'paid', status: 'paid', paid_at: new Date().toISOString() })
        .eq('booking_id', id);

      const vehicleName = booking.vehicle ? `${booking.vehicle.brand} ${booking.vehicle.model}` : t('companyDash.common.vehicleFallback');
      await createNotification({
        userId: booking.client_id,
        title: t('companyDash.bookings.bankPaymentConfirmedTitle', 'Pagesa u konfirmua'),
        message: t('companyDash.bookings.bankPaymentConfirmedMsg', { vehicle: vehicleName, amount: booking.total_price }),
        type: 'payment_received',
        referenceId: booking.id,
        referenceType: 'booking',
        templateKey: 'payment_received',
        templateVars: { vehicle: vehicleName, amount: String(booking.total_price) },
      });

      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('companyDash.common.saveError');
      setError(message);
    } finally {
      setActionLoading(null);
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

      const vehicleName = booking.vehicle ? `${booking.vehicle.brand} ${booking.vehicle.model}` : t('companyDash.common.vehicleFallback');

      if (status === 'completed') {
        await sendBookingCompletedEmail(
          booking.client_email,
          booking.client_name,
          {
            bookingId: booking.id,
            vehicleName,
            pickupDate: formatDate(booking.pickup_date, i18n.language),
            returnDate: formatDate(booking.return_date, i18n.language),
          }
        );

        const isOnlinePrepaid = booking.payment_method && ONLINE_PAYMENT_METHODS.has(booking.payment_method);
        const shouldMarkPaid = isOnlinePrepaid || booking.payment_status === 'paid' || booking.payment_method === 'cash';

        if (shouldMarkPaid && booking.payment_status !== 'paid') {
          await supabase
            .from('invoices')
            .update({ payment_status: 'paid', status: 'paid', paid_at: new Date().toISOString() })
            .eq('booking_id', booking.id);

          await supabase
            .from('bookings')
            .update({ payment_status: 'paid' })
            .eq('id', booking.id);
        }

        await createNotification({
          userId: booking.client_id,
          title: t('companyDash.bookings.notifCompletedTitle'),
          message: t('companyDash.bookings.notifCompletedMsg', { vehicle: vehicleName }),
          type: 'booking_completed',
          referenceId: booking.id,
          referenceType: 'booking',
          templateKey: 'booking_completed',
          templateVars: { companyName: company.name, vehicle: vehicleName },
        });
      }

      if (status === 'active') {
        await createNotification({
          userId: booking.client_id,
          title: t('companyDash.bookings.notifStartedTitle'),
          message: t('companyDash.bookings.notifStartedMsg', { vehicle: vehicleName }),
          type: 'booking_started',
          referenceId: booking.id,
          referenceType: 'booking',
        });
      }

      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('companyDash.common.saveError');
      setError(message);
    } finally {
      setActionLoading(null);
    }
  }

  async function saveInternalNotes() {
    if (!notesModal) return;
    setSavingNotes(true);
    const { error: upErr } = await supabase
      .from('bookings')
      .update({ internal_notes: notesValue })
      .eq('id', notesModal.id);
    setSavingNotes(false);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    setNotesModal(null);
    setNotesValue('');
    loadData();
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter(b => {
      if (tab && b.status !== tab) return false;
      if (q) {
        const hay = `${b.client_name} ${b.client_email} ${b.client_phone || ''} ${b.vehicle?.brand || ''} ${b.vehicle?.model || ''} ${b.vehicle?.plate_number || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (fromDate && b.pickup_date < fromDate) return false;
      if (toDate && b.return_date > toDate) return false;
      return true;
    });
  }, [bookings, tab, search, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  function exportCSV() {
    const rows = filtered.map(b => ({
      [t('companyDash.bookings.csvDate')]: formatDate(b.created_at, i18n.language),
      [t('companyDash.bookings.csvClient')]: b.client_name || '',
      [t('companyDash.bookings.csvEmail')]: b.client_email || '',
      [t('companyDash.bookings.csvPhone')]: b.client_phone || '',
      [t('companyDash.bookings.csvVehicle')]: b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model}` : '',
      [t('companyDash.bookings.csvPlate')]: b.vehicle?.plate_number || '',
      [t('companyDash.bookings.csvPickup')]: b.pickup_date,
      [t('companyDash.bookings.csvReturn')]: b.return_date,
      [t('companyDash.bookings.csvDays')]: b.total_days,
      [t('companyDash.bookings.csvStatus')]: bookingStatusLabel(b.status, t),
      [t('companyDash.bookings.csvPayment')]: paymentStatusLabel(b.payment_status || 'pending', t),
      [t('companyDash.bookings.csvAmount')]: b.total_price,
    }));
    exportToCSV(rows, `bookings-${new Date().toISOString().slice(0, 10)}`);
  }

  const tabs: [string, string][] = [
    ['', t('companyDash.bookings.tabAll')],
    ['pending', t('companyDash.bookings.tabPending')],
    ['confirmed', t('companyDash.bookings.tabConfirmed')],
    ['active', t('companyDash.bookings.tabActive')],
    ['completed', t('companyDash.bookings.tabCompleted')],
    ['cancelled', t('companyDash.bookings.tabCancelled')],
  ];

  return (
    <DashboardLayout title={t('companyDash.bookings.title')} navItems={companyNavItems}>
      {holdMessage && (
        <div className={`mb-4 border rounded-xl p-4 flex items-center gap-3 ${
          holdMessage.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          {holdMessage.type === 'success'
            ? <Check className="w-5 h-5 text-green-600 shrink-0" />
            : <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          }
          <p className={`text-sm font-medium ${holdMessage.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
            {holdMessage.text}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-950 mb-1">{t('companyDash.bookings.heading')}</h1>
          <p className="text-dark-500 text-[15px]">{t('companyDash.bookings.subtitle')}</p>
          {hasAnyCashHold && (
            <button
              onClick={() => setHelpOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              {t('companyDash.bookings.cashHoldHelpButton')}
            </button>
          )}
        </div>
        <button
          onClick={exportCSV}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-dark-700 text-sm font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          {t('companyDash.bookings.exportCsv')}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {tabs.map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${tab === v ? 'bg-primary-600 text-white' : 'bg-white text-dark-600 border border-gray-200 hover:bg-gray-50'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div className="relative md:col-span-1">
          <Search className="w-4 h-4 text-dark-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('companyDash.bookings.searchPlaceholder')}
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>
        <div>
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            placeholder={t('companyDash.bookings.from')}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>
        <div>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            placeholder={t('companyDash.bookings.to')}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>
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
        <div className="bg-white rounded-lg border border-gray-200 p-16 text-center">
          <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-dark-600 font-medium">{t('companyDash.bookings.noBookings')}</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginated.map(b => {
              const statusColor = bookingStatusColors[b.status] || bookingStatusColors.pending;
              const paymentKey = b.payment_status || 'pending';
              const psColor = paymentStatusColors[paymentKey] || paymentStatusColors.pending;
              const isActioning = actionLoading === b.id;
              return (
                <div key={b.id} className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                        {b.vehicle?.main_image_url ? <img src={b.vehicle.main_image_url} alt="" className="w-12 h-12 object-cover" loading="lazy" /> : <Car className="w-5 h-5 text-gray-400" />}
                      </div>
                      <div>
                        <p className="font-semibold text-dark-900">{b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model}` : t('companyDash.common.vehicleFallback')}</p>
                        <p className="text-xs text-dark-500 mt-0.5">{b.client_name} | {b.client_email}</p>
                        <p className="text-[11px] text-dark-400 mt-0.5">
                          {formatDate(b.pickup_date, i18n.language)} - {formatDate(b.return_date, i18n.language)} ({b.total_days} {t('companyDash.common.days')})
                        </p>
                        {b.deposit_amount ? (
                          <p className="text-[11px] text-dark-400 mt-0.5">
                            {t('companyDash.common.deposit')}: {b.deposit_amount} EUR
                          </p>
                        ) : null}
                        {b.internal_notes ? (
                          <p className="text-[11px] text-amber-700 mt-0.5 italic flex items-center gap-1">
                            <StickyNote className="w-3 h-3" /> {b.internal_notes.slice(0, 60)}{b.internal_notes.length > 60 ? '...' : ''}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-right">
                        <p className="text-sm font-bold text-dark-900">{b.total_price} EUR</p>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${psColor}`}>
                          {paymentStatusLabel(paymentKey, t)}
                        </span>
                      </div>
                      {b.payment_method && PAYMENT_METHOD_ICONS[b.payment_method] && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-[10px] font-medium text-dark-500">
                          {PAYMENT_METHOD_ICONS[b.payment_method]}
                          {paymentMethodLabel(b.payment_method, t)}
                        </span>
                      )}
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusColor}`}>{bookingStatusLabel(b.status, t)}</span>

                      <button
                        onClick={() => { setNotesModal(b); setNotesValue(b.internal_notes || ''); }}
                        title={t('companyDash.bookings.internalNotes')}
                        className="p-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
                      >
                        <StickyNote className="w-4 h-4" />
                      </button>

                      {b.status === 'pending' && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setApproveModal(b.id)}
                            disabled={isActioning}
                            className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                            title={t('companyDash.bookings.approve')}
                          >
                            {isActioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setRejectModal(b.id)}
                            disabled={isActioning}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                            title={t('companyDash.bookings.reject')}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {b.payment_method === 'bank_transfer' && b.payment_status === 'pending' && b.status !== 'cancelled' && (
                        <button
                          onClick={() => handleConfirmBankTransfer(b.id)}
                          disabled={isActioning}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                          title={t('companyDash.bookings.confirmBankPaymentTooltip', 'Shenoji qe pagesa per kete rezervim eshte pranuar ne llogarine bankare')}
                        >
                          {isActioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building className="w-4 h-4" />}
                          {t('companyDash.bookings.confirmBankPayment', 'Konfirmo pagesen')}
                        </button>
                      )}
                      {b.status === 'confirmed' && (
                        <button
                          onClick={() => updateStatus(b.id, 'active')}
                          disabled={isActioning}
                          className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {isActioning ? <Loader2 className="w-4 h-4 animate-spin" /> : t('companyDash.bookings.start')}
                        </button>
                      )}
                      {b.status === 'active' && (
                        <button
                          onClick={() => updateStatus(b.id, 'completed')}
                          disabled={isActioning}
                          className="px-3 py-1.5 bg-dark-800 text-white text-xs font-semibold rounded-lg hover:bg-dark-900 transition-colors disabled:opacity-50"
                        >
                          {isActioning ? <Loader2 className="w-4 h-4 animate-spin" /> : t('companyDash.bookings.complete')}
                        </button>
                      )}

                      {b.payment_method === 'cash' && b.cash_hold_status === 'authorized' && (
                        <>
                          <button
                            onClick={() => handleReleaseHold(b)}
                            disabled={holdActionLoading === b.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                            title={t('companyDash.bookings.cashHoldReleaseTitle')}
                          >
                            {holdActionLoading === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlock className="w-3.5 h-3.5" />}
                            {t('companyDash.bookings.cashHoldReleaseButton', { amount: b.cash_hold_amount })}
                          </button>
                          <button
                            onClick={() => { setCaptureModal(b); setCaptureReason(''); }}
                            disabled={holdActionLoading === b.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                            title={t('companyDash.bookings.cashHoldCaptureTitle')}
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {t('companyDash.bookings.cashHoldCaptureShort')}
                          </button>
                        </>
                      )}
                      {b.payment_method === 'cash' && b.cash_hold_status === 'released' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-[10px] font-semibold">
                          <Check className="w-3 h-3" />
                          {t('companyDash.bookings.cashHoldReleasedBadge')}
                        </span>
                      )}
                      {b.payment_method === 'cash' && b.cash_hold_status === 'captured' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 rounded-full text-[10px] font-semibold">
                          <AlertTriangle className="w-3 h-3" />
                          {t('companyDash.bookings.cashHoldCapturedBadge')}
                        </span>
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
            <h3 className="text-lg font-bold text-dark-900 mb-2">{t('companyDash.bookings.approveTitle')}</h3>
            <p className="text-sm text-dark-500 mb-6">{t('companyDash.bookings.approveBody')}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setApproveModal(null)}
                className="px-4 py-2 text-sm font-medium text-dark-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t('companyDash.common.cancel')}
              </button>
              <button
                onClick={() => handleApprove(approveModal)}
                disabled={actionLoading === approveModal}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading === approveModal && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('companyDash.bookings.approveAction')}
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-dark-900 mb-2">{t('companyDash.bookings.rejectTitle')}</h3>
            <p className="text-sm text-dark-500 mb-4">{t('companyDash.bookings.rejectBody')}</p>
            <div className="mb-3">
              <label className="block text-xs font-medium text-dark-700 mb-1.5">{t('companyDash.bookings.rejectReasonLabel')}</label>
              <select
                value={rejectReasonKey}
                onChange={e => setRejectReasonKey(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-dark-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {REJECT_REASONS.map(r => (
                  <option key={r} value={r}>{t(`companyDash.bookings.rejectReason_${r}`)}</option>
                ))}
              </select>
            </div>
            <textarea
              value={rejectReasonText}
              onChange={e => setRejectReasonText(e.target.value)}
              placeholder={t('companyDash.bookings.rejectPlaceholder')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-dark-800 placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setRejectModal(null); setRejectReasonText(''); setRejectReasonKey('maintenance'); }}
                className="px-4 py-2 text-sm font-medium text-dark-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t('companyDash.common.cancel')}
              </button>
              <button
                onClick={() => handleReject(rejectModal)}
                disabled={actionLoading === rejectModal}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading === rejectModal && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('companyDash.bookings.rejectAction')}
              </button>
            </div>
          </div>
        </div>
      )}

      <CashHoldHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />

      {captureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg border border-gray-200 p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-bold text-dark-900">{t('companyDash.bookings.capturePenaltyTitle')}</h3>
              </div>
              <button
                onClick={() => { setCaptureModal(null); setHelpOpen(true); }}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                title={t('companyDash.bookings.captureHelpTooltip')}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                {t('companyDash.bookings.captureHelpLink')}
              </button>
            </div>
            <p
              className="text-sm text-dark-500 mb-4"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(
                  t('companyDash.bookings.captureBodyHtml', {
                    amount: captureModal.cash_hold_amount,
                    name: captureModal.client_name,
                  }),
                  { ALLOWED_TAGS: ['strong', 'em', 'br'], ALLOWED_ATTR: [] },
                ),
              }}
            />
            <label className="block text-xs font-semibold text-dark-600 uppercase tracking-wide mb-1.5">
              {t('companyDash.bookings.captureReasonLabel')}
            </label>
            <textarea
              value={captureReason}
              onChange={(e) => setCaptureReason(e.target.value)}
              rows={3}
              placeholder={t('companyDash.bookings.captureReasonPlaceholder')}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setCaptureModal(null)}
                className="px-4 py-2 text-sm font-semibold text-dark-600 hover:bg-gray-50 rounded-lg"
              >
                {t('companyDash.common.cancel')}
              </button>
              <button
                onClick={handleCaptureHold}
                disabled={holdActionLoading === captureModal.id}
                className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {holdActionLoading === captureModal.id && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('companyDash.bookings.captureConfirmButton', { amount: captureModal.cash_hold_amount })}
              </button>
            </div>
          </div>
        </div>
      )}

      {notesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-dark-900 mb-1">{t('companyDash.bookings.internalNotesTitle')}</h3>
            <p className="text-xs text-dark-500 mb-4">{t('companyDash.bookings.internalNotesHint')}</p>
            <textarea
              value={notesValue}
              onChange={e => setNotesValue(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-dark-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none mb-4"
              placeholder={t('companyDash.bookings.internalNotesPlaceholder')}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setNotesModal(null); setNotesValue(''); }}
                className="px-4 py-2 text-sm font-medium text-dark-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t('companyDash.common.cancel')}
              </button>
              <button
                onClick={saveInternalNotes}
                disabled={savingNotes}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {savingNotes && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('companyDash.common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
