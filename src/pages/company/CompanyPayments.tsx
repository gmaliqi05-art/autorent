import { useState, useEffect } from 'react';
import { Car, DollarSign, CreditCard, Wallet, Building, Banknote, FileText, Download, ArrowUpRight, Clock, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Booking, Vehicle, Company } from '../../lib/types';
import DashboardLayout from '../../components/layout/DashboardLayout';
import BookingInvoice from '../../components/booking/BookingInvoice';
import { companyNavItems } from '../../lib/companyNav';
import { exportToCSV } from '../../lib/csvExport';

const paymentMethodLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  stripe: { label: 'Karte Krediti', icon: <CreditCard className="w-3.5 h-3.5" />, color: 'bg-blue-50 text-blue-700' },
  paypal: { label: 'PayPal', icon: <Wallet className="w-3.5 h-3.5" />, color: 'bg-yellow-50 text-yellow-700' },
  bank_transfer: { label: 'Transfer Bankar', icon: <Building className="w-3.5 h-3.5" />, color: 'bg-green-50 text-green-700' },
  cash: { label: 'Kesh', icon: <Banknote className="w-3.5 h-3.5" />, color: 'bg-gray-50 text-gray-700' },
};

const paymentStatusLabels: Record<string, { label: string; color: string }> = {
  paid: { label: 'Paguar', color: 'bg-green-100 text-green-700' },
  pending: { label: 'Ne pritje', color: 'bg-yellow-100 text-yellow-700' },
  failed: { label: 'Deshtuar', color: 'bg-red-100 text-red-700' },
};

const ITEMS_PER_PAGE = 10;

type Period = 'week' | 'month' | 'year' | 'all';

export default function CompanyPayments() {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [bookings, setBookings] = useState<(Booking & { vehicle?: Vehicle })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('month');
  const [selectedBooking, setSelectedBooking] = useState<(Booking & { vehicle?: Vehicle }) | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  useEffect(() => {
    setCurrentPage(1);
  }, [period]);

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

        setBookings((data || []) as (Booking & { vehicle?: Vehicle })[]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ndodhi nje gabim gjate ngarkimit te te dhenave');
    } finally {
      setLoading(false);
    }
  }

  function getFilteredBookings() {
    if (period === 'all') return bookings;
    const now = new Date();
    const cutoff = new Date();
    if (period === 'week') cutoff.setDate(now.getDate() - 7);
    else if (period === 'month') cutoff.setMonth(now.getMonth() - 1);
    else if (period === 'year') cutoff.setFullYear(now.getFullYear() - 1);
    return bookings.filter(b => new Date(b.created_at) >= cutoff);
  }

  function handleViewInvoice(booking: Booking & { vehicle?: Vehicle }) {
    setSelectedBooking(booking);
    setShowInvoice(true);
  }

  function handleExportCSV() {
    if (filtered.length === 0) return;
    const rows = filtered.map(b => ({
      Data: new Date(b.created_at).toLocaleDateString('sq-AL'),
      Klienti: b.client_name,
      Email: b.client_email,
      Automjeti: b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model}` : '',
      Dite: b.total_days,
      Metoda: b.payment_method ? (paymentMethodLabels[b.payment_method]?.label || b.payment_method) : '',
      Statusi: b.payment_status ? (paymentStatusLabels[b.payment_status]?.label || b.payment_status) : '',
      Shuma: b.total_price,
      Depozita: b.deposit_amount || 0,
    }));
    exportToCSV(rows, `pagesat-${period}-${new Date().toISOString().slice(0, 10)}`);
  }

  const filtered = getFilteredBookings();
  const paidBookings = filtered.filter(b => b.payment_status === 'paid');
  const pendingBookings = filtered.filter(b => b.payment_status === 'pending');
  const failedBookings = filtered.filter(b => b.payment_status === 'failed');

  const totalRevenue = paidBookings.reduce((s, b) => s + Number(b.total_price), 0);
  const pendingRevenue = pendingBookings.reduce((s, b) => s + Number(b.total_price), 0);
  const depositRevenue = paidBookings.reduce((s, b) => s + Number(b.deposit_amount || 0), 0);
  const totalTransactions = paidBookings.length;

  const paymentMethodStats = Object.keys(paymentMethodLabels).map(method => {
    const count = paidBookings.filter(b => b.payment_method === method).length;
    const total = paidBookings.filter(b => b.payment_method === method).reduce((s, b) => s + Number(b.total_price), 0);
    return { method, count, total };
  }).filter(s => s.count > 0);

  const maxCount = Math.max(...paymentMethodStats.map(s => s.count), 1);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedBookings = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <DashboardLayout title="Pagesat" navItems={companyNavItems}>
        <div className="flex items-center justify-center h-64">
          <div className="w-7 h-7 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Pagesat" navItems={companyNavItems}>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-dark-900">{error}</p>
            <button
              onClick={loadData}
              className="mt-3 px-4 py-2 text-xs font-semibold text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
            >
              Provo perseri
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Pagesat" navItems={companyNavItems}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-dark-950">Raportet financiare</h1>
          <p className="text-dark-500 mt-1 text-[15px]">Te ardhurat, pagesat dhe transaksionet</p>
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1">
          {([['week', 'Java'], ['month', 'Muaji'], ['year', 'Viti'], ['all', 'Gjithsej']] as [Period, string][]).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setPeriod(v)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                period === v ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-400 hover:text-dark-600'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<DollarSign className="w-5 h-5 text-white" />}
          bg="bg-gradient-to-br from-green-500 to-green-600"
          value={`${totalRevenue.toFixed(0)} EUR`}
          label="Te ardhurat totale"
          trend={<ArrowUpRight className="w-3.5 h-3.5 text-green-500" />}
          gradient
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-white" />}
          bg="bg-gradient-to-br from-amber-500 to-amber-600"
          value={`${pendingRevenue.toFixed(0)} EUR`}
          label="Ne pritje per pagese"
          gradient
        />
        <StatCard
          icon={<CreditCard className="w-5 h-5 text-white" />}
          bg="bg-gradient-to-br from-blue-500 to-blue-600"
          value={totalTransactions.toString()}
          label="Transaksione te suksesshme"
          gradient
        />
        <StatCard
          icon={<Wallet className="w-5 h-5 text-white" />}
          bg="bg-gradient-to-br from-purple-500 to-purple-600"
          value={`${depositRevenue.toFixed(0)} EUR`}
          label="Depozitat e mbledhura"
          gradient
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-dark-950 mb-5">Pagesat sipas metodes</h2>
          <div className="space-y-4">
            {paymentMethodStats.length === 0 ? (
              <p className="text-sm text-dark-400 text-center py-8">Nuk ka pagesa per kete periudhe</p>
            ) : (
              paymentMethodStats.map(stat => {
                const info = paymentMethodLabels[stat.method];
                return (
                  <div key={stat.method}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${info.color}`}>
                          {info.icon}
                          {info.label}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-dark-950">{stat.count} pagesa</p>
                        <p className="text-xs text-dark-400">{stat.total.toFixed(0)} EUR</p>
                      </div>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all duration-700"
                        style={{ width: `${(stat.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-dark-950 mb-5">Statusi i pagesave</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-green-900">Paguar</p>
                <p className="text-xs text-green-600 mt-0.5">{paidBookings.length} rezervime</p>
              </div>
              <p className="text-xl font-bold text-green-700">{totalRevenue.toFixed(0)} EUR</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-amber-900">Ne pritje</p>
                <p className="text-xs text-amber-600 mt-0.5">{pendingBookings.length} rezervime</p>
              </div>
              <p className="text-xl font-bold text-amber-700">{pendingRevenue.toFixed(0)} EUR</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-red-900">Deshtuar</p>
                <p className="text-xs text-red-600 mt-0.5">{failedBookings.length} rezervime</p>
              </div>
              <p className="text-xl font-bold text-red-700">
                {failedBookings.reduce((s, b) => s + Number(b.total_price), 0).toFixed(0)} EUR
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-dark-950">Transaksionet ({filtered.length})</h2>
          <button
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 text-xs font-semibold rounded-lg hover:bg-primary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            Exporto ne CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">Data</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">Klienti</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">Automjeti</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">Metoda</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">Statusi</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">Shuma</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">Veprime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-dark-400">Nuk ka transaksione per kete periudhe</p>
                  </td>
                </tr>
              ) : (
                paginatedBookings.map(booking => {
                  const paymentInfo = booking.payment_method ? paymentMethodLabels[booking.payment_method] : null;
                  const statusInfo = booking.payment_status ? paymentStatusLabels[booking.payment_status] : paymentStatusLabels.pending;
                  return (
                    <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-dark-900">
                          {new Date(booking.created_at).toLocaleDateString('sq-AL')}
                        </p>
                        <p className="text-[11px] text-dark-400">
                          {new Date(booking.created_at).toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-dark-900">{booking.client_name}</p>
                        <p className="text-[11px] text-dark-400">{booking.client_email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                            {booking.vehicle?.main_image_url ? (
                              <img src={booking.vehicle.main_image_url} alt="" className="w-8 h-8 object-cover" />
                            ) : (
                              <Car className="w-3.5 h-3.5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-dark-900">
                              {booking.vehicle ? `${booking.vehicle.brand} ${booking.vehicle.model}` : 'Automjet'}
                            </p>
                            <p className="text-[11px] text-dark-400">{booking.total_days} dite</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {paymentInfo ? (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${paymentInfo.color}`}>
                            {paymentInfo.icon}
                            {paymentInfo.label}
                          </span>
                        ) : (
                          <span className="text-xs text-dark-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-bold text-dark-950">{booking.total_price} EUR</p>
                        {booking.deposit_amount && (
                          <p className="text-[11px] text-dark-400">Depozite: {booking.deposit_amount} EUR</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleViewInvoice(booking)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Fatura
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-dark-400">
              Duke shfaqur {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} nga {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg text-dark-400 hover:text-dark-600 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                    page === currentPage
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-dark-400 hover:text-dark-600 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg text-dark-400 hover:text-dark-600 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showInvoice && selectedBooking && company && (
        <BookingInvoice
          mode="dashboard"
          booking={selectedBooking}
          vehicle={selectedBooking.vehicle}
          company={company}
          onClose={() => {
            setShowInvoice(false);
            setSelectedBooking(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}

function StatCard({
  icon,
  bg,
  value,
  label,
  trend,
  gradient = false,
}: {
  icon: React.ReactNode;
  bg: string;
  value: string;
  label: string;
  trend?: React.ReactNode;
  gradient?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-6 ${gradient ? bg : 'bg-white border border-gray-100'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${gradient ? 'bg-white/20' : bg}`}>
          {icon}
        </div>
        {trend && <div className="bg-white rounded-full p-1.5">{trend}</div>}
      </div>
      <p className={`text-2xl font-bold mb-1 ${gradient ? 'text-white' : 'text-dark-950'}`}>{value}</p>
      <p className={`text-sm ${gradient ? 'text-white/80' : 'text-dark-500'}`}>{label}</p>
    </div>
  );
}
