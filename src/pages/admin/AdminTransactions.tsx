import { useState, useEffect } from 'react';
import { DollarSign, Building2, User, CreditCard, Wallet, Building, Banknote, FileText, Download, Search, Receipt } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import type { Booking, Company, Vehicle, Invoice } from '../../lib/types';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNavItems, adminNavGroups } from '../../lib/adminNav';
import { localeFromI18n } from '../../lib/clientDashHelpers';
import { exportToCSV } from '../../lib/csvExport';

type PaymentMethodMeta = { labelKey: string; icon: React.ReactNode; color: string };
type PaymentStatusMeta = { labelKey: string; color: string };

const paymentMethodMeta: Record<string, PaymentMethodMeta> = {
  stripe: { labelKey: 'adminDash.transactions.methodStripe', icon: <CreditCard className="w-3.5 h-3.5" />, color: 'bg-blue-50 text-blue-700' },
  paypal: { labelKey: 'adminDash.transactions.methodPaypal', icon: <Wallet className="w-3.5 h-3.5" />, color: 'bg-yellow-50 text-yellow-700' },
  bank_transfer: { labelKey: 'adminDash.transactions.methodBank', icon: <Building className="w-3.5 h-3.5" />, color: 'bg-green-50 text-green-700' },
  cash: { labelKey: 'adminDash.transactions.methodCash', icon: <Banknote className="w-3.5 h-3.5" />, color: 'bg-gray-50 text-gray-700' },
};

const paymentStatusMeta: Record<string, PaymentStatusMeta> = {
  paid: { labelKey: 'adminDash.transactions.statusPaid', color: 'bg-green-100 text-green-700' },
  pending: { labelKey: 'adminDash.transactions.statusPending', color: 'bg-yellow-100 text-yellow-700' },
  failed: { labelKey: 'adminDash.transactions.statusFailed', color: 'bg-red-100 text-red-700' },
};

type BookingWithDetails = Booking & {
  company?: Company;
  vehicle?: Vehicle;
};

export default function AdminTransactions() {
  const { t, i18n } = useTranslation();
  const dateLocale = localeFromI18n(i18n.language);
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [bRes, cRes, invRes] = await Promise.all([
      supabase
        .from('bookings')
        .select('*, company:companies(*), vehicle:vehicles(*)')
        .order('created_at', { ascending: false }),
      supabase.from('companies').select('*').order('name'),
      supabase.from('invoices').select('id, booking_id, invoice_number, status'),
    ]);
    setBookings((bRes.data || []) as BookingWithDetails[]);
    setCompanies((cRes.data || []) as Company[]);
    setInvoices((invRes.data || []) as Invoice[]);
    setLoading(false);
  }

  const filtered = bookings.filter(b => {
    const matchesSearch =
      !searchTerm ||
      b.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.client_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.company?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = !filterCompany || b.company_id === filterCompany;
    const matchesMethod = !filterMethod || b.payment_method === filterMethod;
    const matchesStatus = !filterStatus || b.payment_status === filterStatus;
    return matchesSearch && matchesCompany && matchesMethod && matchesStatus;
  });

  const paidTransactions = filtered.filter(b => b.payment_status === 'paid');
  const totalVolume = paidTransactions.reduce((s, b) => s + Number(b.total_price), 0);
  const avgTransaction = paidTransactions.length > 0 ? totalVolume / paidTransactions.length : 0;
  const successRate = filtered.length > 0 ? (paidTransactions.length / filtered.length) * 100 : 0;
  const failedCount = filtered.filter(b => b.payment_status === 'failed').length;

  function getInvoiceForBooking(bookingId: string) {
    return invoices.find(inv => inv.booking_id === bookingId);
  }

  function handleExportCSV() {
    const data = filtered.map(b => {
      const inv = getInvoiceForBooking(b.id);
      const methodMeta = b.payment_method ? paymentMethodMeta[b.payment_method] : null;
      const statusMeta = b.payment_status ? paymentStatusMeta[b.payment_status] : null;
      return {
        [t('adminDash.transactions.csvId')]: b.id.substring(0, 8),
        [t('adminDash.transactions.csvInvoice')]: inv?.invoice_number || '-',
        [t('adminDash.transactions.csvDate')]: new Date(b.created_at).toLocaleDateString(dateLocale),
        [t('adminDash.transactions.csvClient')]: b.client_name,
        [t('adminDash.transactions.csvEmail')]: b.client_email,
        [t('adminDash.transactions.csvCompany')]: b.company?.name || '-',
        [t('adminDash.transactions.csvVehicle')]: b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model}` : '-',
        [t('adminDash.transactions.csvDays')]: b.total_days,
        [t('adminDash.transactions.csvMethod')]: methodMeta ? t(methodMeta.labelKey) : (b.payment_method || '-'),
        [t('adminDash.transactions.csvStatus')]: statusMeta ? t(statusMeta.labelKey) : (b.payment_status || '-'),
        [t('adminDash.transactions.csvAmount')]: `${b.total_price} EUR`,
      };
    });
    exportToCSV(data, t('adminDash.transactions.csvFilename'));
  }

  if (loading) {
    return (
      <DashboardLayout title="Admin" navItems={adminNavItems} navGroups={adminNavGroups}>
        <div className="flex items-center justify-center h-64">
          <div className="w-7 h-7 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Admin" navItems={adminNavItems} navGroups={adminNavGroups}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark-950">{t('adminDash.transactions.pageTitle')}</h1>
        <p className="text-dark-500 mt-1 text-[15px]">{t('adminDash.transactions.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<DollarSign className="w-5 h-5 text-white" />}
          bg="bg-white border border-gray-200"
          value={`${totalVolume.toFixed(0)} EUR`}
          label={t('adminDash.transactions.statVolume')}
          gradient
        />
        <StatCard
          icon={<CreditCard className="w-5 h-5 text-white" />}
          bg="bg-white border border-gray-200"
          value={`${successRate.toFixed(1)}%`}
          label={t('adminDash.transactions.statSuccessRate')}
          gradient
        />
        <StatCard
          icon={<FileText className="w-5 h-5 text-white" />}
          bg="bg-white border border-gray-200"
          value={`${avgTransaction.toFixed(0)} EUR`}
          label={t('adminDash.transactions.statAvgValue')}
          gradient
        />
        <StatCard
          icon={<Building2 className="w-5 h-5 text-white" />}
          bg="bg-white border border-gray-200"
          value={failedCount.toString()}
          label={t('adminDash.transactions.statFailed')}
          gradient
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 mb-8 p-6">
        <h2 className="font-semibold text-dark-950 mb-4">{t('adminDash.transactions.filters')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-dark-600 mb-2">{t('adminDash.transactions.filterSearchLabel')}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={t('adminDash.transactions.filterSearchPlaceholder')}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-600 mb-2">{t('adminDash.transactions.filterCompany')}</label>
            <select
              value={filterCompany}
              onChange={e => setFilterCompany(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            >
              <option value="">{t('adminDash.transactions.filterAll')}</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-600 mb-2">{t('adminDash.transactions.filterMethod')}</label>
            <select
              value={filterMethod}
              onChange={e => setFilterMethod(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            >
              <option value="">{t('adminDash.transactions.filterAll')}</option>
              {Object.entries(paymentMethodMeta).map(([key, { labelKey }]) => (
                <option key={key} value={key}>{t(labelKey)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-600 mb-2">{t('adminDash.transactions.filterStatus')}</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            >
              <option value="">{t('adminDash.transactions.filterAll')}</option>
              {Object.entries(paymentStatusMeta).map(([key, { labelKey }]) => (
                <option key={key} value={key}>{t(labelKey)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-dark-950">{t('adminDash.transactions.transactionsCount', { count: filtered.length })}</h2>
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 text-xs font-semibold rounded-lg hover:bg-primary-100 transition-colors">
            <Download className="w-3.5 h-3.5" />
            {t('adminDash.transactions.exportCsv')}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">{t('adminDash.transactions.thIdDate')}</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">{t('adminDash.transactions.thInvoice')}</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">{t('adminDash.transactions.thClient')}</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">{t('adminDash.transactions.thCompany')}</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">{t('adminDash.transactions.thVehicle')}</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">{t('adminDash.transactions.thMethod')}</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">{t('adminDash.transactions.thStatus')}</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">{t('adminDash.transactions.thAmount')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-dark-400">{t('adminDash.transactions.emptyState')}</p>
                  </td>
                </tr>
              ) : (
                filtered.map(booking => {
                  const paymentInfo = booking.payment_method ? paymentMethodMeta[booking.payment_method] : null;
                  const statusInfo = booking.payment_status ? paymentStatusMeta[booking.payment_status] : paymentStatusMeta.pending;
                  const invoice = getInvoiceForBooking(booking.id);
                  return (
                    <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-xs font-mono text-dark-400 mb-0.5">#{booking.id.substring(0, 8)}</p>
                        <p className="text-sm font-medium text-dark-900">
                          {new Date(booking.created_at).toLocaleDateString(dateLocale)}
                        </p>
                        <p className="text-[11px] text-dark-400">
                          {new Date(booking.created_at).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {invoice ? (
                          <div className="flex items-center gap-1.5">
                            <Receipt className="w-3.5 h-3.5 text-primary-500" />
                            <span className="text-xs font-mono text-primary-600 font-medium">{invoice.invoice_number}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-dark-300">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-gray-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-dark-900">{booking.client_name}</p>
                            <p className="text-[11px] text-dark-400">{booking.client_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                            {booking.company?.logo_url ? (
                              <img src={booking.company.logo_url} alt="" className="w-8 h-8 object-cover" />
                            ) : (
                              <Building2 className="w-3.5 h-3.5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-dark-900">{booking.company?.name || '-'}</p>
                            <p className="text-[11px] text-dark-400">{booking.company?.city || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-dark-900">
                          {booking.vehicle ? `${booking.vehicle.brand} ${booking.vehicle.model}` : '-'}
                        </p>
                        <p className="text-[11px] text-dark-400">{t('adminDash.transactions.daysLabel', { count: booking.total_days })}</p>
                      </td>
                      <td className="px-6 py-4">
                        {paymentInfo ? (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${paymentInfo.color}`}>
                            {paymentInfo.icon}
                            {t(paymentInfo.labelKey)}
                          </span>
                        ) : (
                          <span className="text-xs text-dark-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                          {t(statusInfo.labelKey)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-bold text-dark-950">{booking.total_price} EUR</p>
                        {booking.deposit_amount && (
                          <p className="text-[11px] text-dark-400">{t('adminDash.transactions.depositLabel', { amount: booking.deposit_amount })}</p>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  icon,
  bg,
  value,
  label,
  gradient = false,
}: {
  icon: React.ReactNode;
  bg: string;
  value: string;
  label: string;
  gradient?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-6 ${gradient ? bg : 'bg-white border border-gray-100'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${gradient ? 'bg-white/20' : bg}`}>
          {icon}
        </div>
      </div>
      <p className={`text-2xl font-bold mb-1 ${gradient ? 'text-white' : 'text-dark-950'}`}>{value}</p>
      <p className={`text-sm ${gradient ? 'text-white/80' : 'text-dark-500'}`}>{label}</p>
    </div>
  );
}
