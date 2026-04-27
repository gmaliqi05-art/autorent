import { useState, useEffect } from 'react';
import { Loader2, Download, CreditCard, Wallet, Building, Banknote, Receipt, DollarSign, TrendingUp, Clock, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Booking, Vehicle, Company } from '../../lib/types';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { clientNavItems } from '../../lib/clientNav';
import BookingInvoice from '../../components/booking/BookingInvoice';
import { exportToCSV } from '../../lib/csvExport';
import { format } from 'date-fns';

const paymentMethodLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  stripe: { label: 'Karte krediti/debiti', icon: <CreditCard className="w-3 h-3" />, color: 'text-blue-600' },
  paypal: { label: 'PayPal', icon: <Wallet className="w-3 h-3" />, color: 'text-purple-600' },
  bank_transfer: { label: 'Transfer bankar', icon: <Building className="w-3 h-3" />, color: 'text-green-600' },
  cash: { label: 'Kesh / Ne lokal', icon: <Banknote className="w-3 h-3" />, color: 'text-orange-600' },
};

const paymentStatusLabels: Record<string, { label: string; color: string; dot: string }> = {
  pending: { label: 'Në pritje', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  paid: { label: 'Paguar', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  failed: { label: 'Dështuar', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
};

const PAGE_SIZE = 10;

type BookingWithRelations = Booking & { vehicle?: Vehicle; company?: Company };

export default function ClientPayments() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [invoiceBooking, setInvoiceBooking] = useState<BookingWithRelations | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

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
    .filter((b) => b.payment_status === 'paid' || b.status === 'completed')
    .reduce((sum, b) => sum + b.total_price, 0);

  const totalPending = filteredBookings
    .filter((b) => b.payment_status === 'pending' && b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.total_price, 0);

  const totalCancelled = filteredBookings
    .filter((b) => b.status === 'cancelled')
    .length;

  const completedBookings = filteredBookings.filter(
    (b) => b.payment_status === 'paid' || b.status === 'completed'
  );

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
    exportToCSV(rows, `pagesat-${yearFilter || 'te-gjitha'}`);
  }

  return (
    <DashboardLayout title="Pagesat" navItems={clientNavItems}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-950 mb-1">Raporti i Pagesave</h1>
          <p className="text-dark-500 text-[15px]">Historiku dhe statistikat e pagesave tuaja</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={filteredBookings.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-dark-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Eksporto CSV
          </button>
          {years.length > 0 && (
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            >
              <option value="">Të gjitha vitet</option>
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
          <p className="text-dark-600 font-medium mb-1">Ndodhi një gabim gjatë ngarkimit</p>
          <p className="text-dark-400 text-sm mb-4">{error}</p>
          <button
            onClick={loadBookings}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
          >
            Provo përsëri
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
              <p className="text-xs text-dark-500">Totali i paguar</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-dark-950 mb-1">{totalPending.toFixed(2)} EUR</p>
              <p className="text-xs text-dark-500">Në pritje</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-dark-950 mb-1">{completedBookings.length}</p>
              <p className="text-xs text-dark-500">Transaksione</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-red-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-dark-950 mb-1">{totalCancelled}</p>
              <p className="text-xs text-dark-500">Anuluar</p>
            </div>
          </div>

          {Object.keys(paymentMethodStats).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
              <h3 className="font-semibold text-dark-950 mb-4">Metodat e Pagesës</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(paymentMethodStats).map(([method, count]) => {
                  const info = paymentMethodLabels[method];
                  if (!info) return null;
                  return (
                    <div key={method} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-8 h-8 rounded-lg bg-white flex items-center justify-center ${info.color}`}>
                        {info.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-dark-900">{count}</p>
                        <p className="text-xs text-dark-500">{info.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-dark-950">Historiku i Transaksioneve</h2>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="p-16 text-center">
                <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-dark-600 font-medium">Nuk ka transaksione</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-dark-600">Data</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-dark-600">Automjeti</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-dark-600">Periudha</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-dark-600">Metoda</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-dark-600">Statusi</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold text-dark-600">Shuma</th>
                        <th className="px-5 py-3 text-center text-xs font-semibold text-dark-600">Veprime</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {paginatedBookings.map((b) => {
                        const paymentStatus = paymentStatusLabels[b.payment_status || 'pending'];
                        const paymentMethod = b.payment_method ? paymentMethodLabels[b.payment_method] : null;
                        return (
                          <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-5 py-4">
                              <p className="text-sm text-dark-900">
                                {format(new Date(b.created_at), 'dd/MM/yyyy')}
                              </p>
                              <p className="text-xs text-dark-400">{format(new Date(b.created_at), 'HH:mm')}</p>
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-sm font-medium text-dark-900">
                                {b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model}` : 'Automjet'}
                              </p>
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-xs text-dark-600">
                                {format(new Date(b.pickup_date), 'dd/MM/yy')} - {format(new Date(b.return_date), 'dd/MM/yy')}
                              </p>
                              <p className="text-xs text-dark-400">{b.total_days} ditë</p>
                            </td>
                            <td className="px-5 py-4">
                              {paymentMethod && (
                                <div className="flex items-center gap-1.5">
                                  <span className={paymentMethod.color}>{paymentMethod.icon}</span>
                                  <span className="text-xs text-dark-600">{paymentMethod.label}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold ${paymentStatus.color}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${paymentStatus.dot}`} />
                                {paymentStatus.label}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <p className="text-sm font-bold text-dark-900">{b.total_price.toFixed(2)} EUR</p>
                              {b.deposit_amount > 0 && (
                                <p className="text-xs text-dark-400">+{b.deposit_amount} EUR depozitë</p>
                              )}
                            </td>
                            <td className="px-5 py-4 text-center">
                              <button
                                onClick={() => setInvoiceBooking(b)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                                title="Shkarko faturën"
                              >
                                <Download className="w-3 h-3" />
                                Fatura
                              </button>
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
                      Duke shfaqur {(safePage - 1) * PAGE_SIZE + 1}-{Math.min(safePage * PAGE_SIZE, filteredBookings.length)} nga {filteredBookings.length}
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
