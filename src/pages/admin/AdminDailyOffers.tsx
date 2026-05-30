import { useState, useEffect } from 'react';
import { Zap, Plus, Trash2, CreditCard as Edit3, Search, Eye, EyeOff, Calendar, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNavItems, adminNavGroups } from '../../lib/adminNav';
import { localeFromI18n } from '../../lib/clientDashHelpers';
import ImageUploader from '../../components/common/ImageUploader';

interface DailyOffer {
  id: string;
  title: string;
  description: string;
  discount_percent: number;
  vehicle_id: string | null;
  company_id: string | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  image_url: string;
  created_at: string;
  vehicle_name?: string;
  company_name?: string;
}

const empty: Partial<DailyOffer> = {
  title: '', description: '', discount_percent: 10,
  vehicle_id: null, company_id: null,
  starts_at: new Date().toISOString().split('T')[0],
  ends_at: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  is_active: true, image_url: '',
};

export default function AdminDailyOffers() {
  const { t, i18n } = useTranslation();
  const dateLocale = localeFromI18n(i18n.language);
  const [offers, setOffers] = useState<DailyOffer[]>([]);
  const [vehicles, setVehicles] = useState<{ id: string; brand: string; model: string; company_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<DailyOffer>>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [{ data: offersData }, { data: vehiclesData }, { data: companiesData }] = await Promise.all([
      supabase.from('daily_offers').select('*').order('created_at', { ascending: false }),
      supabase.from('vehicles').select('id, brand, model, company_id, companies(name)').eq('is_published', true).limit(50),
      supabase.from('companies').select('id, name').eq('status', 'approved'),
    ]);
    const offersList = offersData || [];
    const vehiclesList = (vehiclesData || []).map((v: any) => ({ id: v.id, brand: v.brand, model: v.model, company_name: v.companies?.name || '' }));
    const vehicleMap: Record<string, string> = {};
    vehiclesList.forEach((v: any) => { vehicleMap[v.id] = `${v.brand} ${v.model}`; });
    const companyMap: Record<string, string> = {};
    (companiesData || []).forEach((c: any) => { companyMap[c.id] = c.name; });
    setOffers(offersList.map((o: any) => ({
      ...o,
      vehicle_name: o.vehicle_id ? vehicleMap[o.vehicle_id] : null,
      company_name: o.company_id ? companyMap[o.company_id] : null,
    })));
    setVehicles(vehiclesList);
    setLoading(false);
  }

  async function save() {
    if (!form.title || !form.starts_at || !form.ends_at) return;
    setSaving(true);
    const payload = {
      title: form.title, description: form.description, discount_percent: form.discount_percent,
      vehicle_id: form.vehicle_id || null, company_id: form.company_id || null,
      starts_at: form.starts_at, ends_at: form.ends_at,
      is_active: form.is_active, image_url: form.image_url,
    };
    if (editing) {
      await supabase.from('daily_offers').update(payload).eq('id', editing);
    } else {
      await supabase.from('daily_offers').insert(payload);
    }
    setSaving(false); setShowForm(false); setEditing(null); setForm(empty);
    await loadData();
  }

  async function toggleActive(id: string, val: boolean) {
    await supabase.from('daily_offers').update({ is_active: val }).eq('id', id);
    setOffers(o => o.map(offer => offer.id === id ? { ...offer, is_active: val } : offer));
  }

  async function deleteOffer(id: string) {
    await supabase.from('daily_offers').delete().eq('id', id);
    setOffers(o => o.filter(offer => offer.id !== id));
  }

  const filtered = offers.filter(o =>
    o.title.toLowerCase().includes(search.toLowerCase()) ||
    (o.vehicle_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.company_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const now = new Date();
  const active = offers.filter(o => o.is_active && new Date(o.starts_at) <= now && new Date(o.ends_at) >= now);
  const upcoming = offers.filter(o => o.is_active && new Date(o.starts_at) > now);

  return (
    <DashboardLayout navItems={adminNavItems} navGroups={adminNavGroups} title={t('adminDash.dailyOffers.pageTitle')}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('adminDash.dailyOffers.pageTitle')}</h1>
            <p className="text-gray-500 text-sm mt-1">{t('adminDash.dailyOffers.subtitle')}</p>
          </div>
          <button onClick={() => { setForm(empty); setEditing(null); setShowForm(true); }}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg font-medium">
            <Plus className="w-4 h-4" />{t('adminDash.dailyOffers.newOffer')}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: t('adminDash.dailyOffers.statTotal'), value: offers.length },
            { label: t('adminDash.dailyOffers.statActiveNow'), value: active.length, color: 'green' },
            { label: t('adminDash.dailyOffers.statUpcoming'), value: upcoming.length, color: 'blue' },
            { label: t('adminDash.dailyOffers.statExpired'), value: offers.filter(o => new Date(o.ends_at) < now).length, color: 'gray' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <div className={`text-2xl font-bold ${color ? `text-${color}-600` : 'text-gray-900'}`}>{value}</div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {active.length > 0 && (
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-4">
            <h3 className="font-semibold text-orange-800 mb-3 flex items-center gap-2"><Zap className="w-5 h-5" />{t('adminDash.dailyOffers.activeNowTitle', { count: active.length })}</h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {active.map(o => (
                <div key={o.id} className="bg-white rounded-xl p-4 border border-orange-100 flex-shrink-0 w-48">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 font-black text-sm">-{o.discount_percent}%</span>
                    <span className="text-xs font-semibold text-gray-900 line-clamp-2">{o.title}</span>
                  </div>
                  <div className="text-xs text-gray-500">{t('adminDash.dailyOffers.expiresOn', { date: new Date(o.ends_at).toLocaleString(dateLocale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) })}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-screen overflow-y-auto">
              <h2 className="text-lg font-bold text-gray-900 mb-4">{editing ? t('adminDash.dailyOffers.editTitle') : t('adminDash.dailyOffers.newOfferTitle')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminDash.dailyOffers.titleLabel')}</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder={t('adminDash.dailyOffers.titlePlaceholder')} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminDash.dailyOffers.descLabel')}</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminDash.dailyOffers.discountLabel')}</label>
                  <input type="number" value={form.discount_percent} onChange={e => setForm(f => ({ ...f, discount_percent: parseInt(e.target.value) }))}
                    min={1} max={100} className="w-32 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminDash.dailyOffers.startsAt')}</label>
                    <input type="date" value={form.starts_at?.split('T')[0] || ''} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminDash.dailyOffers.endsAt')}</label>
                    <input type="date" value={form.ends_at?.split('T')[0] || ''} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminDash.dailyOffers.vehicleLabel')}</label>
                  <select value={form.vehicle_id || ''} onChange={e => setForm(f => ({ ...f, vehicle_id: e.target.value || null }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="">{t('adminDash.dailyOffers.allVehicles')}</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.company_name})</option>)}
                  </select>
                </div>
                <div>
                  <ImageUploader
                    value={form.image_url || ''}
                    onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
                    bucket="ad-images"
                    pathPrefix="daily-offers"
                    aspectRatio="aspect-[16/9]"
                    label={t('adminDash.dailyOffers.imageLabel')}
                    emptyText={t('adminDash.dailyOffers.uploadImage')}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="offer_active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600" />
                  <label htmlFor="offer_active" className="text-sm text-gray-700">{t('adminDash.dailyOffers.activeNow')}</label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => { setShowForm(false); setEditing(null); setForm(empty); }}
                  className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm hover:bg-gray-50">{t('adminDash.dailyOffers.cancel')}</button>
                <button onClick={save} disabled={saving || !form.title}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editing ? t('adminDash.dailyOffers.saveChanges') : t('adminDash.dailyOffers.createOffer')}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('adminDash.dailyOffers.searchPlaceholder')}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><Zap className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>{t('adminDash.dailyOffers.emptyState')}</p></div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map(offer => {
                const isActive = offer.is_active && new Date(offer.starts_at) <= now && new Date(offer.ends_at) >= now;
                const isExpired = new Date(offer.ends_at) < now;
                return (
                  <div key={offer.id} className="px-6 py-4 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${isActive ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
                      -{offer.discount_percent}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm">{offer.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{offer.description}</div>
                      <div className="flex gap-3 mt-1">
                        {offer.vehicle_name && <span className="text-xs text-gray-400">{t('adminDash.dailyOffers.vehicleLine', { name: offer.vehicle_name })}</span>}
                        {offer.company_name && <span className="text-xs text-gray-400">{t('adminDash.dailyOffers.companyLine', { name: offer.company_name })}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {new Date(offer.starts_at).toLocaleDateString(dateLocale, { day: '2-digit', month: '2-digit' })} - {new Date(offer.ends_at).toLocaleDateString(dateLocale)}
                      </div>
                      <div className={`mt-1 px-2 py-0.5 rounded-full text-xs font-medium inline-block ${isActive ? 'bg-green-100 text-green-700' : isExpired ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-600'}`}>
                        {isActive ? t('adminDash.dailyOffers.statusActive') : isExpired ? t('adminDash.dailyOffers.statusExpired') : t('adminDash.dailyOffers.statusUpcoming')}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => toggleActive(offer.id, !offer.is_active)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                        {offer.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button onClick={() => { setForm(offer); setEditing(offer.id); setShowForm(true); }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => deleteOffer(offer.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
