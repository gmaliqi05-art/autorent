import { useState, useEffect } from 'react';
import { Mail, Loader2, CheckCircle2, XCircle, Clock, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNavItems, adminNavGroups } from '../../lib/adminNav';
import { format } from 'date-fns';

interface EmailLog {
  id: string;
  recipient_email: string;
  recipient_name: string;
  email_type: string;
  subject: string;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
  reference_type: string | null;
  reference_id: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  sent: { label: 'Dërguar', color: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="w-3 h-3" /> },
  failed: { label: 'Dështuar', color: 'bg-red-100 text-red-700', icon: <XCircle className="w-3 h-3" /> },
  pending: { label: 'Në pritje', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-3 h-3" /> },
  queued: { label: 'Në radhë', color: 'bg-blue-100 text-blue-700', icon: <Clock className="w-3 h-3" /> },
};

const emailTypeLabels: Record<string, string> = {
  booking_confirmation_client: 'Konfirmim rezervimi (Klient)',
  booking_confirmation_company: 'Njoftim rezervimi (Kompani)',
  booking_approved: 'Rezervim aprovuar',
  booking_rejected: 'Rezervim refuzuar',
  booking_completed: 'Rezervim përfunduar',
  booking_cancelled: 'Rezervim anuluar',
  pickup_reminder: 'Kujtesë marrje',
  review_request: 'Kërkesë për vlerësim',
  company_approved: 'Kompani aprovuar',
  company_rejected: 'Kompani refuzuar',
  company_suspended: 'Kompani pezulluar',
  welcome_client: 'Mirëseardhje klient',
  welcome_company: 'Mirëseardhje kompani',
  booking_invoice: 'Faturë rezervimi',
};

export default function AdminEmails() {
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    loadEmails();
  }, []);

  async function loadEmails() {
    let query = supabase
      .from('email_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    if (typeFilter) {
      query = query.eq('email_type', typeFilter);
    }

    const { data } = await query;
    setEmails((data || []) as EmailLog[]);
    setLoading(false);
  }

  useEffect(() => {
    loadEmails();
  }, [statusFilter, typeFilter]);

  const filtered = search
    ? emails.filter(
        (e) =>
          e.recipient_email.toLowerCase().includes(search.toLowerCase()) ||
          e.recipient_name.toLowerCase().includes(search.toLowerCase()) ||
          e.subject.toLowerCase().includes(search.toLowerCase())
      )
    : emails;

  const stats = {
    total: emails.length,
    sent: emails.filter((e) => e.status === 'sent').length,
    failed: emails.filter((e) => e.status === 'failed').length,
    pending: emails.filter((e) => e.status === 'pending' || e.status === 'queued').length,
  };

  return (
    <DashboardLayout title="Emailet" navItems={adminNavItems} navGroups={adminNavGroups}>
      <h1 className="text-2xl font-bold text-dark-950 mb-1">Historiku i Emaileve</h1>
      <p className="text-dark-500 mb-6 text-[15px]">Monitoroni të gjitha emailet e dërguara nga platforma</p>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-dark-500 font-medium mb-1">Totali</p>
              <p className="text-2xl font-bold text-dark-900">{stats.total}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-dark-400" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-dark-500 font-medium mb-1">Dërguar</p>
              <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-dark-500 font-medium mb-1">Dështuar</p>
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-dark-500 font-medium mb-1">Në pritje</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              placeholder="Kërko sipas emailit, emrit ose subjektit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark-900 placeholder:text-dark-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          >
            <option value="">Të gjitha statuset</option>
            <option value="sent">Dërguar</option>
            <option value="failed">Dështuar</option>
            <option value="pending">Në pritje</option>
            <option value="queued">Në radhë</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          >
            <option value="">Të gjitha llojet</option>
            {Object.entries(emailTypeLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-7 h-7 text-primary-600 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-dark-600 font-medium">Nuk ka emaile</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-dark-600">Marrësi</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-dark-600">Lloji</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-dark-600">Subjekti</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-dark-600">Statusi</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-dark-600">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((email) => {
                  const status = statusConfig[email.status] || statusConfig.pending;
                  return (
                    <tr key={email.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-dark-900">{email.recipient_name}</p>
                        <p className="text-xs text-dark-500">{email.recipient_email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-dark-600">
                          {emailTypeLabels[email.email_type] || email.email_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-dark-900 max-w-md truncate">{email.subject}</p>
                        {email.error_message && (
                          <p className="text-xs text-red-600 mt-0.5">{email.error_message}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium ${status.color}`}
                        >
                          {status.icon}
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-dark-600">
                          {email.sent_at
                            ? format(new Date(email.sent_at), 'dd/MM/yyyy HH:mm')
                            : format(new Date(email.created_at), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
