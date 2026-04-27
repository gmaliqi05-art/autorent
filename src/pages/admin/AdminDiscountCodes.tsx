import { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, CreditCard as Edit3, Search, Copy, CheckCircle, X, Loader2, Calendar, Percent, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNavItems, adminNavGroups } from '../../lib/adminNav';
import { format } from 'date-fns';
import { todayISO, addDaysISO } from '../../lib/dateDefaults';

interface DiscountCode {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  min_amount: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  description: string;
  created_at: string;
}

function makeEmpty(): Partial<DiscountCode> {
  return {
    code: '', type: 'percent', value: 10, min_amount: 0,
    max_uses: null, is_active: true,
    expires_at: addDaysISO(todayISO(), 30) + 'T23:59:59Z',
    description: '',
  };
}

const empty: Partial<DiscountCode> = makeEmpty();

export default function AdminDiscountCodes() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<Partial<DiscountCode>>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => { loadCodes(); }, []);

  async function loadCodes() {
    const { data } = await supabase.from('discount_codes').select('*').order('created_at', { ascending: false });
    setCodes(data || []);
    setLoading(false);
  }

  async function save() {
    if (!form.code || !form.value) return;
    setSaving(true);
    if (editing) {
      await supabase.from('discount_codes').update(form).eq('id', editing);
      setCodes(c => c.map(code => code.id === editing ? { ...code, ...form } as DiscountCode : code));
    } else {
      const { data } = await supabase.from('discount_codes').insert({ ...form, used_count: 0 }).select().single();
      if (data) setCodes(c => [data, ...c]);
    }
    setSaving(false);
    setShowForm(false);
    setEditing(null);
    setForm(makeEmpty());
  }

  async function toggleActive(id: string, val: boolean) {
    await supabase.from('discount_codes').update({ is_active: val }).eq('id', id);
    setCodes(c => c.map(code => code.id === id ? { ...code, is_active: val } : code));
  }

  async function deleteCode(id: string) {
    await supabase.from('discount_codes').delete().eq('id', id);
    setCodes(c => c.filter(code => code.id !== id));
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  function generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setForm(f => ({ ...f, code }));
  }

  const filtered = codes.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout navItems={adminNavItems} navGroups={adminNavGroups} title="Kode Zbritjesh">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kode Zbritjesh</h1>
            <p className="text-gray-500 text-sm mt-1">Krijoni dhe menaxhoni kodet e zbritjes per klientet</p>
          </div>
          <button onClick={() => { setForm(makeEmpty()); setEditing(null); setShowForm(true); }}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg font-medium">
            <Plus className="w-4 h-4" />Kode i ri
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total kode', value: codes.length },
            { label: 'Aktive', value: codes.filter(c => c.is_active).length },
            { label: 'Te perdorura sot', value: codes.reduce((s, c) => s + c.used_count, 0) },
            { label: 'Skaduar', value: codes.filter(c => c.expires_at && new Date(c.expires_at) < new Date()).length },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">{editing ? 'Ndrysho kodin' : 'Kode i ri zbritjeje'}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kodi *</label>
                  <div className="flex gap-2">
                    <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                      placeholder="P.sh. SUMMER20" className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    <button onClick={generateCode} className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                      Gjenero
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pershkrim</label>
                  <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Pershkrim i shkurter..." className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lloji</label>
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="percent">Perqindje (%)</option>
                      <option value="fixed">Shume fikse (€)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vlera *</label>
                    <div className="relative">
                      <input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: parseFloat(e.target.value) }))}
                        min={1} max={form.type === 'percent' ? 100 : undefined}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{form.type === 'percent' ? '%' : '€'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shuma minimale (€)</label>
                    <input type="number" value={form.min_amount} onChange={e => setForm(f => ({ ...f, min_amount: parseFloat(e.target.value) }))} min={0}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Perdorime max (0=pa limit)</label>
                    <input type="number" value={form.max_uses || ''} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value ? parseInt(e.target.value) : null }))} min={0}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skadon me (opsionale)</label>
                  <input type="date" value={form.expires_at?.split('T')[0] || ''} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value ? e.target.value + 'T23:59:59Z' : null }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600" />
                  <label htmlFor="is_active" className="text-sm text-gray-700">Aktiv menjëherë</label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => { setShowForm(false); setEditing(null); setForm(makeEmpty()); }}
                  className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">Anulo</button>
                <button onClick={save} disabled={saving || !form.code || !form.value}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editing ? 'Ruaj ndryshimet' : 'Krijo kodin'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Kerkoni kode..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Nuk ka kode zbritjesh</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['Kodi', 'Zbritja', 'Perdoruar', 'Limiti', 'Skadon', 'Statusi', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(code => {
                    const expired = code.expires_at && new Date(code.expires_at) < new Date();
                    return (
                      <tr key={code.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-gray-900 text-sm bg-gray-100 px-2 py-1 rounded">{code.code}</span>
                            <button onClick={() => copyCode(code.code)} className="text-gray-400 hover:text-gray-600">
                              {copied === code.code ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          {code.description && <div className="text-xs text-gray-500 mt-0.5">{code.description}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`flex items-center gap-1 text-sm font-semibold ${code.type === 'percent' ? 'text-green-600' : 'text-blue-600'}`}>
                            {code.type === 'percent' ? <Percent className="w-3.5 h-3.5" /> : <DollarSign className="w-3.5 h-3.5" />}
                            {code.value}{code.type === 'percent' ? '%' : '€'}
                          </span>
                          {code.min_amount > 0 && <div className="text-xs text-gray-400">min €{code.min_amount}</div>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{code.used_count} here</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{code.max_uses ? `${code.used_count}/${code.max_uses}` : 'Pa limit'}</td>
                        <td className="px-4 py-3 text-sm">
                          {code.expires_at ? (
                            <span className={expired ? 'text-red-500' : 'text-gray-600'}>
                              {format(new Date(code.expires_at), 'dd/MM/yyyy')}
                            </span>
                          ) : <span className="text-gray-400">Pa skadim</span>}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => toggleActive(code.id, !code.is_active)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${code.is_active && !expired ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {code.is_active && !expired ? 'Aktiv' : expired ? 'Skaduar' : 'Joaktiv'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button onClick={() => { setForm(code); setEditing(code.id); setShowForm(true); }}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={() => deleteCode(code.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
