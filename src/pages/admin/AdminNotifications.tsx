import { useState, useEffect } from 'react';
import { Bell, Send, Search, Filter, Trash2, Eye, Users, Building2, CheckCircle, Loader2, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNavItems, adminNavGroups } from '../../lib/adminNav';
import { format } from 'date-fns';

interface NotificationLog {
  id: string;
  title: string;
  message: string;
  type: string;
  sent_to: string;
  sent_count: number;
  created_at: string;
}

export default function AdminNotifications() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', type: 'info', target: 'all' });
  const [userCount, setUserCount] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: users } = await supabase.from('profiles').select('id').eq('is_active', true);
    setUserCount((users || []).length);
    const { data } = await supabase.from('notification_logs').select('*').order('created_at', { ascending: false }).limit(50);
    setLogs(data || []);
    setLoading(false);
  }

  async function sendNotification() {
    if (!form.title || !form.message) return;
    setSending(true);
    let query = supabase.from('profiles').select('id');
    if (form.target === 'clients') query = query.eq('role', 'client');
    else if (form.target === 'companies') query = query.eq('role', 'company_admin');
    const { data: users } = await query.eq('is_active', true);
    const notifications = (users || []).map((u: any) => ({
      user_id: u.id,
      title: form.title,
      message: form.message,
      type: form.type,
    }));
    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications);
    }
    await supabase.from('notification_logs').insert({
      title: form.title,
      message: form.message,
      type: form.type,
      sent_to: form.target,
      sent_count: notifications.length,
    }).select().single();
    setSending(false);
    setSent(true);
    setForm({ title: '', message: '', type: 'info', target: 'all' });
    setShowForm(false);
    setTimeout(() => setSent(false), 3000);
    await loadData();
  }

  const filtered = logs.filter(l => l.title.toLowerCase().includes(search.toLowerCase()) || l.message.toLowerCase().includes(search.toLowerCase()));

  const typeColors: Record<string, string> = {
    info: 'bg-blue-100 text-blue-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-orange-100 text-orange-700',
    error: 'bg-red-100 text-red-700',
  };

  return (
    <DashboardLayout navItems={adminNavItems} navGroups={adminNavGroups} title="Njoftimet & Zile">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Njoftimet & Zile</h1>
            <p className="text-gray-500 text-sm mt-1">Menaxhim i njoftimeve te platformes</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors">
            <Plus className="w-4 h-4" />Njoftim i ri
          </button>
        </div>

        {sent && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <CheckCircle className="w-5 h-5" /><span>Njoftimi u deergua me sukses!</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Perdorues aktive', value: userCount, icon: Users, color: 'blue' },
            { label: 'Njoftime te derguar', value: logs.length, icon: Bell, color: 'green' },
            { label: 'Total i derguar', value: logs.reduce((s, l) => s + (l.sent_count || 0), 0), icon: Send, color: 'teal' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-${color}-50 flex items-center justify-center`}>
                <Icon className={`w-6 h-6 text-${color}-600`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Dergo Njoftim te Ri</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titulli</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="P.sh. Perditesim i platformes..." className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mesazhi</label>
                  <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    rows={4} placeholder="Shkruani mesazhin e njoftimit..." className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lloji</label>
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="info">Info</option>
                      <option value="success">Sukses</option>
                      <option value="warning">Paralajmerim</option>
                      <option value="error">Gabim</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Destinataret</label>
                    <select value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="all">Te gjithe</option>
                      <option value="clients">Klientet</option>
                      <option value="companies">Firmat</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Anulo
                </button>
                <button onClick={sendNotification} disabled={sending || !form.title || !form.message}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? 'Duke derguar...' : 'Dergo'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Kerkoni njoftime..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Nuk ka njoftime te derguar</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map(log => (
                <div key={log.id} className="px-6 py-4 flex items-start gap-4">
                  <div className={`mt-0.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${typeColors[log.type] || 'bg-gray-100 text-gray-600'}`}>{log.type}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm">{log.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{log.message}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-medium text-gray-700">{log.sent_count || 0} marre</div>
                    <div className="text-xs text-gray-400 mt-0.5">{format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}</div>
                    <div className="text-xs text-gray-400 capitalize">{log.sent_to === 'all' ? 'Te gjithe' : log.sent_to === 'clients' ? 'Klienet' : 'Firmat'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
