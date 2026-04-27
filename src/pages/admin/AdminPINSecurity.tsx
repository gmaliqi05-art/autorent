import { useState, useEffect } from 'react';
import { Shield, Lock, Save, Loader2, CheckCircle, AlertTriangle, Trash2, Eye, EyeOff, Search, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNavItems, adminNavGroups } from '../../lib/adminNav';
import { format } from 'date-fns';

interface DeleteRequest {
  id: string;
  user_id: string;
  requested_at: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  user_name?: string;
  user_email?: string;
}

interface PINSettings {
  require_pin_for_delete: boolean;
  pin_expiry_minutes: number;
  max_attempts: number;
  lockout_minutes: number;
  notify_admin_on_delete: boolean;
  require_reason: boolean;
}

const defaultPINSettings: PINSettings = {
  require_pin_for_delete: true,
  pin_expiry_minutes: 5,
  max_attempts: 3,
  lockout_minutes: 30,
  notify_admin_on_delete: true,
  require_reason: true,
};

export default function AdminPINSecurity() {
  const [requests, setRequests] = useState<DeleteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<PINSettings>(defaultPINSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'requests' | 'settings'>('requests');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: settingsData } = await supabase.from('platform_settings').select('*').eq('key', 'pin_security_settings').maybeSingle();
    if (settingsData?.value) setSettings({ ...defaultPINSettings, ...(settingsData.value as Partial<PINSettings>) });

    const { data: deleteReqs } = await supabase.from('account_deletion_requests').select('*').order('requested_at', { ascending: false }).limit(50);
    if (deleteReqs && deleteReqs.length > 0) {
      const userIds = [...new Set(deleteReqs.map((r: any) => r.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', userIds);
      const profileMap: Record<string, any> = {};
      (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });
      setRequests(deleteReqs.map((r: any) => ({
        ...r,
        user_name: profileMap[r.user_id]?.full_name || 'Pa emer',
        user_email: profileMap[r.user_id]?.email || '',
      })));
    } else {
      setRequests([]);
    }
    setLoading(false);
  }

  async function saveSettings() {
    setSaving(true);
    const { data: ex } = await supabase.from('platform_settings').select('id').eq('key', 'pin_security_settings').maybeSingle();
    if (ex) await supabase.from('platform_settings').update({ value: settings as any }).eq('key', 'pin_security_settings');
    else await supabase.from('platform_settings').insert({ key: 'pin_security_settings', value: settings as any });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000);
  }

  async function handleRequest(id: string, action: 'approved' | 'rejected') {
    setActionLoading(id);
    await supabase.from('account_deletion_requests').update({ status: action }).eq('id', id);
    setRequests(r => r.map(req => req.id === id ? { ...req, status: action } : req));
    setActionLoading(null);
  }

  const filtered = requests.filter(r =>
    (r.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.user_email || '').toLowerCase().includes(search.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    pending: 'bg-orange-100 text-orange-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  return (
    <DashboardLayout navItems={adminNavItems} navGroups={adminNavGroups} title="Fshirje e Sigurt (PIN)">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fshirje e Sigurt (PIN)</h1>
          <p className="text-gray-500 text-sm mt-1">Menaxho kerkimet per fshirje llogarie dhe cilesimet e sigurise</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Kerkesa ne pritje', value: requests.filter(r => r.status === 'pending').length, color: 'orange' },
            { label: 'Te aprovuara', value: requests.filter(r => r.status === 'approved').length, color: 'green' },
            { label: 'Te refuzuara', value: requests.filter(r => r.status === 'rejected').length, color: 'red' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`bg-${color}-50 border border-${color}-100 rounded-xl p-4 flex items-center gap-4`}>
              <div className={`w-10 h-10 rounded-xl bg-${color}-100 flex items-center justify-center`}>
                <Shield className={`w-5 h-5 text-${color}-600`} />
              </div>
              <div>
                <div className={`text-2xl font-bold text-${color}-700`}>{value}</div>
                <div className={`text-xs text-${color}-600`}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          {(['requests', 'settings'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {t === 'requests' ? 'Kerkesa per Fshirje' : 'Cilesimet PIN'}
            </button>
          ))}
        </div>

        {tab === 'requests' && (
          <div className="bg-white rounded-xl border border-gray-100">
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Kerkoni perdorues..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Trash2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Nuk ka kerkesa per fshirje llogarie</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filtered.map(req => (
                  <div key={req.id} className="px-6 py-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm flex-shrink-0">
                      {(req.user_name || req.user_email || 'U')[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm">{req.user_name}</div>
                      <div className="text-xs text-gray-500">{req.user_email}</div>
                      {req.reason && <div className="text-xs text-gray-400 mt-1 italic">"{req.reason}"</div>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium mb-1 ${statusColors[req.status]}`}>
                        {req.status === 'pending' ? 'Ne pritje' : req.status === 'approved' ? 'Aprovuar' : 'Refuzuar'}
                      </div>
                      <div className="text-xs text-gray-400">{format(new Date(req.requested_at), 'dd/MM/yyyy')}</div>
                    </div>
                    {req.status === 'pending' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => handleRequest(req.id, 'approved')} disabled={actionLoading === req.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-medium transition-colors">
                          {actionLoading === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                          Aprovo
                        </button>
                        <button onClick={() => handleRequest(req.id, 'rejected')} disabled={actionLoading === req.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-medium transition-colors">
                          <X className="w-3 h-3" />Refuzo
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'settings' && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Lock className="w-5 h-5 text-primary-600" />Cilesimet e Sigurise PIN</h3>
              <button onClick={saveSettings} disabled={saving}
                className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saved ? 'U ruajt!' : 'Ruaj'}
              </button>
            </div>
            {[
              { key: 'require_pin_for_delete', label: 'Kerkoni PIN per fshirje llogarie', desc: 'Perdoruesit duhet te konfirmojne me PIN' },
              { key: 'notify_admin_on_delete', label: 'Njoftoni admin kur behet kerkesa', desc: 'Dergoni email tek super admin' },
              { key: 'require_reason', label: 'Kerkoni arsye per fshirje', desc: 'Perdoruesit duhet te japin arsyen' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div><div className="text-sm font-medium text-gray-700">{label}</div><div className="text-xs text-gray-500">{desc}</div></div>
                <button onClick={() => setSettings(s => ({ ...s, [key]: !(s as any)[key] }))}
                  className={`w-12 h-6 rounded-full transition-colors ${(settings as any)[key] ? 'bg-primary-600' : 'bg-gray-300'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${(settings as any)[key] ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            ))}
            <div className="grid grid-cols-3 gap-4 pt-2">
              {[
                { key: 'pin_expiry_minutes', label: 'Skadimi PIN (min)', min: 1, max: 60 },
                { key: 'max_attempts', label: 'Tentativa max', min: 1, max: 10 },
                { key: 'lockout_minutes', label: 'Bllokimi (min)', min: 5, max: 1440 },
              ].map(({ key, label, min, max }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input type="number" min={min} max={max} value={(settings as any)[key]}
                    onChange={e => setSettings(s => ({ ...s, [key]: parseInt(e.target.value) || min }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
