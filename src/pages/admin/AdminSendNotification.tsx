import { useState, useEffect } from 'react';
import { Send, Users, Building2, User, Bell, CheckCircle, Loader2, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNavItems, adminNavGroups } from '../../lib/adminNav';

interface TargetGroup { label: string; value: string; count: number; icon: any; }

export default function AdminSendNotification() {
  const [form, setForm] = useState({ title: '', message: '', type: 'info', target: 'all', user_id: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [groups, setGroups] = useState<TargetGroup[]>([]);
  const [users, setUsers] = useState<{ id: string; full_name: string; email: string; role: string }[]>([]);
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => { loadGroups(); }, []);

  async function loadGroups() {
    const [{ data: all }, { data: clients }, { data: companies }] = await Promise.all([
      supabase.from('profiles').select('id').eq('is_active', true),
      supabase.from('profiles').select('id').eq('role', 'client').eq('is_active', true),
      supabase.from('profiles').select('id').eq('role', 'company_admin').eq('is_active', true),
    ]);
    setGroups([
      { label: 'Te gjithe perdoruesit', value: 'all', count: (all || []).length, icon: Users },
      { label: 'Klientet', value: 'clients', count: (clients || []).length, icon: User },
      { label: 'Firmat', value: 'companies', count: (companies || []).length, icon: Building2 },
      { label: 'Perdorues specifik', value: 'specific', count: 0, icon: Bell },
    ]);
  }

  async function loadUsers(search: string) {
    if (search.length < 2) { setUsers([]); return; }
    const { data } = await supabase.from('profiles').select('id, full_name, email, role')
      .or(`full_name.ilike.%${search}%,email.ilike.%${search}%`).limit(10);
    setUsers(data || []);
  }

  async function send() {
    if (!form.title || !form.message) return;
    setSending(true);
    let userIds: string[] = [];
    if (form.target === 'specific' && form.user_id) {
      userIds = [form.user_id];
    } else {
      let query = supabase.from('profiles').select('id').eq('is_active', true);
      if (form.target === 'clients') query = query.eq('role', 'client');
      else if (form.target === 'companies') query = query.eq('role', 'company_admin');
      const { data } = await query;
      userIds = (data || []).map((u: any) => u.id);
    }
    if (userIds.length > 0) {
      await supabase.from('notifications').insert(userIds.map(uid => ({
        user_id: uid, title: form.title, message: form.message, type: form.type,
      })));
      await supabase.from('notification_logs').insert({
        title: form.title, message: form.message, type: form.type,
        sent_to: form.target, sent_count: userIds.length,
      });
    }
    setSending(false);
    setSent(true);
    setForm({ title: '', message: '', type: 'info', target: 'all', user_id: '' });
    setUserSearch('');
    setUsers([]);
    setTimeout(() => setSent(false), 4000);
  }

  const selectedGroup = groups.find(g => g.value === form.target);
  const typeOptions = [
    { value: 'info', label: 'Informacion', color: 'bg-blue-100 text-blue-700' },
    { value: 'success', label: 'Sukses', color: 'bg-green-100 text-green-700' },
    { value: 'warning', label: 'Paralajmerim', color: 'bg-orange-100 text-orange-700' },
    { value: 'error', label: 'Gabim/Urgjent', color: 'bg-red-100 text-red-700' },
  ];

  return (
    <DashboardLayout navItems={adminNavItems} navGroups={adminNavGroups} title="Dergo Njoftime">
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dergo Njoftime</h1>
          <p className="text-gray-500 text-sm mt-1">Dergo njoftime ne kohe reale tek perdoruesit</p>
        </div>

        {sent && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-5 py-4 rounded-xl">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Njoftimi u dergua me sukses!</span>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Send className="w-5 h-5 text-primary-600" />Compose Njoftimit</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titulli i njoftimit *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="P.sh. Oferte e re, Ndryshim i politikave..." maxLength={100}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            <p className="text-xs text-gray-400 mt-1">{form.title.length}/100</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mesazhi *</label>
            <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              rows={5} maxLength={500} placeholder="Shkruani mesazhin e plote te njoftimit..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            <p className="text-xs text-gray-400 mt-1">{form.message.length}/500</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lloji i njoftimit</label>
            <div className="flex gap-2 flex-wrap">
              {typeOptions.map(t => (
                <button key={t.value} onClick={() => setForm(f => ({ ...f, type: t.value }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border-2 ${form.type === t.value ? `${t.color} border-current` : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Destinataret</label>
            <div className="grid grid-cols-2 gap-3">
              {groups.map(g => {
                const Icon = g.icon;
                return (
                  <button key={g.value} onClick={() => setForm(f => ({ ...f, target: g.value, user_id: '' }))}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${form.target === g.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${form.target === g.value ? 'bg-primary-100' : 'bg-gray-100'}`}>
                      <Icon className={`w-5 h-5 ${form.target === g.value ? 'text-primary-600' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-gray-900">{g.label}</div>
                      {g.value !== 'specific' && <div className="text-xs text-gray-500">{g.count} perdorues</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {form.target === 'specific' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kerko perdorues</label>
              <input value={userSearch} onChange={e => { setUserSearch(e.target.value); loadUsers(e.target.value); }}
                placeholder="Emri ose email..." className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              {users.length > 0 && (
                <div className="mt-2 border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto">
                  {users.map(u => (
                    <button key={u.id} onClick={() => { setForm(f => ({ ...f, user_id: u.id })); setUserSearch(u.full_name || u.email); setUsers([]); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${form.user_id === u.id ? 'bg-primary-50' : ''}`}>
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                        {(u.full_name || u.email)[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">{u.full_name || '(pa emer)'}</div>
                        <div className="text-xs text-gray-500">{u.email} · {u.role}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-500">
                Do te dergohet tek: <span className="font-semibold text-gray-800">
                  {form.target === 'specific' ? (form.user_id ? '1 perdorues' : '— zgjidhni perdoruesin') : `${selectedGroup?.count || 0} perdorues`}
                </span>
              </div>
            </div>
            <button onClick={send} disabled={sending || !form.title || !form.message || (form.target === 'specific' && !form.user_id)}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {sending ? 'Duke derguar...' : 'Dergo Njoftimin'}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
