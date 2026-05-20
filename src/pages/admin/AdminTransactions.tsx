import { useState, useEffect } from 'react';
import { DollarSign, Building2, User, CreditCard, Wallet, Building, Banknote, FileText, Download, Search, Receipt } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Booking, Company, Vehicle, Invoice } from '../../lib/types';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNavItems, adminNavGroups } from '../../lib/adminNav';
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

type BookingWithDetails = Booking & {
  company?: Company;
  vehicle?: Vehicle;
};

export default function AdminTransactions() {
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
      return {
        ID: b.id.substring(0, 8),
        Fatura: inv?.invoice_number || '-',
        Data: new Date(b.created_at).toLocaleDateString('sq-AL'),
        Klienti: b.client_name,
        Email: b.client_email,
        Kompania: b.company?.name || '-',
        Automjeti: b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model}` : '-',
        Dite: b.total_days,
        Metoda: b.payment_method ? (paymentMethodLabels[b.payment_method]?.label || b.payment_method) : '-',
        Statusi: b.payment_status ? (paymentStatusLabels[b.payment_status]?.label || b.payment_status) : '-',
        Shuma: `${b.total_price} EUR`,
      };
    });
    exportToCSV(data, 'transaksionet');
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
        <h1 className="text-2xl font-bold text-dark-950">Transaksionet</h1>
        <p className="text-dark-500 mt-1 text-[15px]">Te gjitha pagesat dhe transaksionet ne platforme</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<DollarSign className="w-5 h-5 text-white" />}
          bg="bg-white border border-gray-200"
          value={`${totalVolume.toFixed(0)} EUR`}
          label="Volumet total"
          gradient
        />
        <StatCard
          icon={<CreditCard className="w-5 h-5 text-white" />}
          bg="bg-white border border-gray-200"
          value={`${successRate.toFixed(1)}%`}
          label="Success rate"
          gradient
        />
        <StatCard
          icon={<FileText className="w-5 h-5 text-white" />}
          bg="bg-white border border-gray-200"
          value={`${avgTransaction.toFixed(0)} EUR`}
          label="Vlera mesatare"
          gradient
        />
        <StatCard
          icon={<Building2 className="w-5 h-5 text-white" />}
          bg="bg-white border border-gray-200"
          value={failedCount.toString()}
          label="Pagesa te deshtuara"
          gradient
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 mb-8 p-6">
        <h2 className="font-semibold text-dark-950 mb-4">Filtra</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-dark-600 mb-2">Kerko</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Klienti, email, kompania..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-600 mb-2">Kompania</label>
            <select
              value={filterCompany}
              onChange={e => setFilterCompany(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            >
              <option value="">Te gjitha</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-600 mb-2">Metoda e pageses</label>
            <select
              value={filterMethod}
              onChange={e => setFilterMethod(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            >
              <option value="">Te gjitha</option>
              {Object.entries(paymentMethodLabels).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-600 mb-2">Statusi i pageses</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            >
              <option value="">Te gjitha</option>
              {Object.entries(paymentStatusLabels).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-dark-950">Transaksionet ({filtered.length})</h2>
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 text-xs font-semibold rounded-lg hover:bg-primary-100 transition-colors">
            <Download className="w-3.5 h-3.5" />
            Exporto ne CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">ID & Data</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">Fatura</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">Klienti</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">Kompania</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">Automjeti</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">Metoda</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">Statusi</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">Shuma</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-dark-400">Nuk ka transaksione me keto kritere</p>
                  </td>
                </tr>
              ) : (
                filtered.map(booking => {
                  const paymentInfo = booking.payment_method ? paymentMethodLabels[booking.payment_method] : null;
                  const statusInfo = booking.payment_status ? paymentStatusLabels[booking.payment_status] : paymentStatusLabels.pending;
                  const invoice = getInvoiceForBooking(booking.id);
                  return (
                    <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-xs font-mono text-dark-400 mb-0.5">#{booking.id.substring(0, 8)}</p>
                        <p className="text-sm font-medium text-dark-900">
                          {new Date(booking.created_at).toLocaleDateString('sq-AL')}
                        </p>
                        <p className="text-[11px] text-dark-400">
                          {new Date(booking.created_at).toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' })}
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
                        <p className="text-[11px] text-dark-400">{booking.total_days} dite</p>
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
