import { useState, useEffect } from 'react';
import { FileText, Search, Filter, Download, Eye, CheckCircle, XCircle, Clock, ArrowUpDown, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import type { Invoice } from '../../lib/types';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNavItems, adminNavGroups } from '../../lib/adminNav';
import { format } from 'date-fns';
import { sq as sqLocale, enUS as enLocale, de as deLocale } from 'date-fns/locale';
import { exportToCSV } from '../../lib/csvExport';

type StatusFilter = 'all' | 'draft' | 'issued' | 'paid' | 'cancelled';

const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  issued: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminInvoices() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'sq').slice(0, 2);
  const dateLocale = lang === 'en' ? enLocale : lang === 'de' ? deLocale : sqLocale;
  const statusLabel = (s: string) => {
    if (s === 'draft') return t('adminDash.invoices.statusDraft');
    if (s === 'issued') return t('adminDash.invoices.statusIssued');
    if (s === 'paid') return t('adminDash.invoices.statusPaid');
    if (s === 'cancelled') return t('adminDash.invoices.statusCancelled');
    return s;
  };
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => { loadInvoices(); }, []);

  async function loadInvoices() {
    const { data } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
    setInvoices(data || []);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('invoices').update({ status, paid_at: status === 'paid' ? new Date().toISOString() : null }).eq('id', id);
    setInvoices(inv => inv.map(i => i.id === id ? { ...i, status: status as any, paid_at: status === 'paid' ? new Date().toISOString() : null } : i));
    if (selected?.id === id) setSelected(s => s ? { ...s, status: status as any } : null);
  }

  const filtered = invoices
    .filter(i => statusFilter === 'all' || i.status === statusFilter)
    .filter(i => i.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      i.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      i.company_name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortDir === 'desc' ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime() : new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const totals = {
    all: invoices.length,
    draft: invoices.filter(i => i.status === 'draft').length,
    issued: invoices.filter(i => i.status === 'issued').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    cancelled: invoices.filter(i => i.status === 'cancelled').length,
  };
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total_price || 0), 0);

  return (
    <DashboardLayout navItems={adminNavItems} navGroups={adminNavGroups} title={t('adminDash.invoices.title')}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('adminDash.invoices.title')}</h1>
            <p className="text-gray-500 text-sm mt-1">{t('adminDash.invoices.subtitle')}</p>
          </div>
          <button onClick={() => exportToCSV(filtered.map(i => ({ ...i })), t('adminDash.invoices.csvFilename'))}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium">
            <Download className="w-4 h-4" />{t('adminDash.invoices.export')}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: t('adminDash.invoices.statTotal'), value: totals.all, color: 'gray' },
            { label: t('adminDash.invoices.statPaid'), value: totals.paid, sub: `€${totalRevenue.toLocaleString()}`, color: 'green' },
            { label: t('adminDash.invoices.statIssued'), value: totals.issued, color: 'blue' },
            { label: t('adminDash.invoices.statDraft'), value: totals.draft, color: 'orange' },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className={`text-2xl font-bold text-${color}-600`}>{value}</div>
              {sub && <div className="text-sm font-semibold text-gray-700">{sub}</div>}
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3">
            <div className="flex-1 relative min-w-48">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('adminDash.invoices.searchPlaceholder')}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="flex gap-2">
              {(['all', 'draft', 'issued', 'paid', 'cancelled'] as StatusFilter[]).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {s === 'all'
                    ? t('adminDash.invoices.filterAll', { count: totals.all })
                    : t('adminDash.invoices.filterStatus', { label: statusLabel(s), count: (totals as any)[s] })}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>{t('adminDash.invoices.noInvoices')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      t('adminDash.invoices.thInvoiceNumber'),
                      t('adminDash.invoices.thClient'),
                      t('adminDash.invoices.thCompany'),
                      t('adminDash.invoices.thVehicle'),
                      t('adminDash.invoices.thTotal'),
                      t('adminDash.invoices.thDate'),
                      t('adminDash.invoices.thStatus'),
                      '',
                    ].map((h, idx) => (
                      <th key={idx} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono font-semibold text-primary-600">{inv.invoice_number}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{inv.client_name}</div>
                        <div className="text-xs text-gray-500">{inv.client_email}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{inv.company_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{inv.vehicle_name}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">€{(inv.total_price || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{format(new Date(inv.created_at), 'dd/MM/yyyy', { locale: dateLocale })}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[inv.status] || 'bg-gray-100 text-gray-600'}`}>
                          {statusLabel(inv.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => setSelected(inv)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          {inv.status === 'issued' && (
                            <button onClick={() => updateStatus(inv.id, 'paid')} className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {inv.status !== 'cancelled' && inv.status !== 'paid' && (
                            <button onClick={() => updateStatus(inv.id, 'cancelled')} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selected && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8 max-h-screen overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{t('adminDash.invoices.detailInvoice', { number: selected.invoice_number })}</h2>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium mt-2 ${STATUS_COLOR[selected.status]}`}>
                    {statusLabel(selected.status)}
                  </span>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
              </div>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('adminDash.invoices.detailClient')}</h3>
                  <p className="font-medium text-gray-900">{selected.client_name}</p>
                  <p className="text-sm text-gray-500">{selected.client_email}</p>
                  <p className="text-sm text-gray-500">{selected.client_phone}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('adminDash.invoices.detailCompany')}</h3>
                  <p className="font-medium text-gray-900">{selected.company_name}</p>
                  <p className="text-sm text-gray-500">{selected.company_email}</p>
                  <p className="text-sm text-gray-500">{selected.company_phone}</p>
                </div>
              </div>
              <div className="border-t border-gray-100 py-4 mb-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">{t('adminDash.invoices.detailBookingTitle')}</h3>
                <div className="space-y-2">
                  {[
                    { label: t('adminDash.invoices.detailVehicle'), value: selected.vehicle_name },
                    { label: t('adminDash.invoices.detailPickup'), value: format(new Date(selected.pickup_date), 'dd/MM/yyyy', { locale: dateLocale }) },
                    { label: t('adminDash.invoices.detailReturn'), value: format(new Date(selected.return_date), 'dd/MM/yyyy', { locale: dateLocale }) },
                    { label: t('adminDash.invoices.detailDays'), value: t('adminDash.invoices.detailDaysValue', { count: selected.total_days }) },
                    { label: t('adminDash.invoices.detailPricePerDay'), value: `€${selected.price_per_day}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-medium text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-600">{t('adminDash.invoices.detailSubtotal')}</span><span>€{selected.subtotal || 0}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">{t('adminDash.invoices.detailDeposit')}</span><span>€{selected.deposit_amount || 0}</span></div>
                <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2 mt-2">
                  <span>{t('adminDash.invoices.detailTotal')}</span><span className="text-primary-600">€{selected.total_price || 0}</span>
                </div>
              </div>
              {selected.status !== 'paid' && selected.status !== 'cancelled' && (
                <div className="flex gap-3 mt-6">
                  {selected.status === 'issued' && (
                    <button onClick={() => { updateStatus(selected.id, 'paid'); setSelected(s => s ? { ...s, status: 'paid' } : null); }}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />{t('adminDash.invoices.markAsPaid')}
                    </button>
                  )}
                  <button onClick={() => { updateStatus(selected.id, 'cancelled'); setSelected(null); }}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 py-2.5 rounded-lg text-sm font-medium">
                    <XCircle className="w-4 h-4" />{t('adminDash.invoices.cancelInvoice')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
