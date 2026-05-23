import { useState, useEffect } from 'react';
import { Loader2, Download, CreditCard, Wallet, Building, Banknote, Receipt, DollarSign, TrendingUp, Clock, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Booking, Vehicle, Company } from '../../lib/types';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { clientNavItems } from '../../lib/clientNav';
import BookingInvoice from '../../components/booking/BookingInvoice';
import { exportToCSV } from '../../lib/csvExport';
import { downloadInvoicePdf } from '../../lib/invoiceService';
import { FileDown } from 'lucide-react';
import {
  formatDateShort,
  formatTime,
  paymentMethodLabel,
  paymentStatusLabel,
  paymentStatusColors,
} from '../../lib/clientDashHelpers';

const paymentMethodVisuals: Record<string, { icon: React.ReactNode; color: string }> = {
  stripe: { icon: <CreditCard className="w-3 h-3" />, color: 'text-blue-600' },
  paypal: { icon: <Wallet className="w-3 h-3" />, color: 'text-blue-500' },
  bank_transfer: { icon: <Building className="w-3 h-3" />, color: 'text-green-600' },
  cash: { icon: <Banknote className="w-3 h-3" />, color: 'text-orange-600' },
};

const PAGE_SIZE = 10;

type BookingWithRelations = Booking & { vehicle?: Vehicle; company?: Company };

export default function ClientPayments() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [invoiceBooking, setInvoiceBooking] = useState<BookingWithRelations | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadBookings();
  }, [user]);

  async function loadBookings() {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('bookings')
      .select('*, vehicle:vehicles(*), company:companies(*)')
      .eq('client_id', user!.id)
      .order('created_at', { ascending: false });
    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }
    setBookings((data || []) as BookingWithRelations[]);
    setLoading(false);
  }

  const years = Array.from(
    new Set(bookings.map((b) => new Date(b.created_at).getFullYear()))
  ).sort((a, b) => b - a);

  const filteredBookings = yearFilter
    ? bookings.filter((b) => new Date(b.created_at).getFullYear().toString() === yearFilter)
    : bookings;

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedBookings = filteredBookings.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [yearFilter]);

  const totalPaid = filteredBookings
    .filter((b) => b.payment_status === 'paid')
    .reduce((sum, b) => sum + b.total_price, 0);

  const totalPending = filteredBookings
    .filter((b) => b.payment_status === 'pending' && b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.total_price, 0);

  const totalCancelled = filteredBookings.filter((b) => b.status === 'cancelled').length;

  const completedBookings = filteredBookings.filter((b) => b.payment_status === 'paid');

  const paymentMethodStats = filteredBookings.reduce((acc, b) => {
    if (b.payment_method) {
      acc[b.payment_method] = (acc[b.payment_method] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  function handleExportCSV() {
    if (filteredBookings.length === 0) return;
    const rows = filteredBookings.map((b) => ({
      client_name: b.client_name,
      client_email: b.client_email,
      total_price: b.total_price,
      payment_method: b.payment_method,
      payment_status: b.payment_status,
      pickup_date: b.pickup_date,
      return_date: b.return_date,
    }));
    exportToCSV(rows, `payments-${yearFilter || 'all'}`);
  }

  return (
    <DashboardLayout title={t('clientNav.payments')} navItems={clientNavItems}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-950 mb-1">{t('clientDash.payments.title')}</h1>
          <p className="text-dark-500 text-[15px]">{t('clientDash.payments.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={filteredBookings.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-dark-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {t('clientDash.payments.exportCsv')}
          </button>
          {years.length > 0 && (
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            >
              <option value="">{t('clientDash.payments.allYears')}</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mb-3" />
          <p className="text-dark-600 font-medium mb-1">{t('clientDash.payments.loadError')}</p>
          <p className="text-dark-400 text-sm mb-4">{error}</p>
          <button
            onClick={loadBookings}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
          >
            {t('clientDash.payments.tryAgain')}
          </button>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-7 h-7 text-primary-600 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-dark-950 mb-1">{totalPaid.toFixed(2)} EUR</p>
              <p className="text-xs text-dark-500">{t('clientDash.payments.totalPaid')}</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-dark-950 mb-1">{totalPending.toFixed(2)} EUR</p>
              <p className="text-xs text-dark-500">{t('clientDash.payments.pending')}</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-dark-950 mb-1">{completedBookings.length}</p>
              <p className="text-xs text-dark-500">{t('clientDash.payments.transactions')}</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-red-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-dark-950 mb-1">{totalCancelled}</p>
              <p className="text-xs text-dark-500">{t('clientDash.payments.cancelled')}</p>
            </div>
          </div>

          {Object.keys(paymentMethodStats).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
              <h3 className="font-semibold text-dark-950 mb-4">{t('clientDash.payments.paymentMethods')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(paymentMethodStats).map(([method, count]) => {
                  const visuals = paymentMethodVisuals[method];
                  if (!visuals) return null;
                  return (
                    <div key={method} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-8 h-8 rounded-lg bg-white flex items-center justify-center ${visuals.color}`}>
                        {visuals.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-dark-900">{count}</p>
                        <p className="text-xs text-dark-500">{paymentMethodLabel(method, t, true)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-dark-950">{t('clientDash.payments.transactionHistory')}</h2>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="p-16 text-center">
                <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-dark-600 font-medium">{t('clientDash.payments.noTransactions')}</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-dark-600">{t('clientDash.payments.thDate')}</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-dark-600">{t('clientDash.payments.thVehicle')}</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-dark-600">{t('clientDash.payments.thPeriod')}</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-dark-600">{t('clientDash.payments.thMethod')}</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-dark-600">{t('clientDash.payments.thStatus')}</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold text-dark-600">{t('clientDash.payments.thAmount')}</th>
                        <th className="px-5 py-3 text-center text-xs font-semibold text-dark-600">{t('clientDash.payments.thActions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {paginatedBookings.map((b) => {
                        const status = b.payment_status || 'pending';
                        const statusColor = paymentStatusColors[status] || paymentStatusColors.pending;
                        const visuals = b.payment_method ? paymentMethodVisuals[b.payment_method] : null;
                        return (
                          <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-5 py-4">
                              <p className="text-sm text-dark-900">{formatDateShort(b.created_at, i18n.language)}</p>
                              <p className="text-xs text-dark-400">{formatTime(b.created_at, i18n.language)}</p>
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-sm font-medium text-dark-900">
                                {b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model}` : t('clientDash.overview.vehicleFallback')}
                              </p>
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-xs text-dark-600">
                                {formatDateShort(b.pickup_date, i18n.language)} - {formatDateShort(b.return_date, i18n.language)}
                              </p>
                              <p className="text-xs text-dark-400">{b.total_days} {t('clientDash.payments.days')}</p>
                            </td>
                            <td className="px-5 py-4">
                              {b.payment_method && visuals && (
                                <div className="flex items-center gap-1.5">
                                  <span className={visuals.color}>{visuals.icon}</span>
                                  <span className="text-xs text-dark-600">{paymentMethodLabel(b.payment_method, t, true)}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold ${statusColor.bg}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${statusColor.dot}`} />
                                {paymentStatusLabel(status, t)}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <p className="text-sm font-bold text-dark-900">{b.total_price.toFixed(2)} EUR</p>
                              {b.deposit_amount > 0 && (
                                <p className="text-xs text-dark-400">+{b.deposit_amount} EUR {t('clientDash.payments.deposit')}</p>
                              )}
                            </td>
                            <td className="px-5 py-4 text-center">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  onClick={() => setInvoiceBooking(b)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                                  title={t('clientDash.payments.downloadInvoice')}
                                >
                                  <Download className="w-3 h-3" />
                                  {t('clientDash.payments.invoice')}
                                </button>
                                <button
                                  onClick={async () => {
                                    setDownloadingId(b.id);
                                    const { error } = await downloadInvoicePdf(b.id, i18n.language?.split('-')[0] || 'sq');
                                    setDownloadingId(null);
                                    if (error) setError(error);
                                  }}
                                  disabled={downloadingId === b.id}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                                  title="PDF"
                                >
                                  {downloadingId === b.id
                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                    : <FileDown className="w-3 h-3" />}
                                  PDF
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                    <p className="text-sm text-dark-500">
                      {t('clientDash.payments.showing', {
                        start: (safePage - 1) * PAGE_SIZE + 1,
                        end: Math.min(safePage * PAGE_SIZE, filteredBookings.length),
                        total: filteredBookings.length,
                      })}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={safePage <= 1}
                        className="p-2 rounded-lg border border-gray-200 text-dark-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            page === safePage
                              ? 'bg-primary-600 text-white'
                              : 'text-dark-600 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={safePage >= totalPages}
                        className="p-2 rounded-lg border border-gray-200 text-dark-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
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
    </DashboardLayout>
  );
}
