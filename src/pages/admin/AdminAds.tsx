import { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit3, Trash2, ExternalLink, Eye, EyeOff, Check, Loader2, Megaphone, MousePointerClick, BarChart2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import type { PlatformAd } from '../../lib/types';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNavItems, adminNavGroups } from '../../lib/adminNav';
import { localeFromI18n } from '../../lib/clientDashHelpers';
import ImageUploader from '../../components/common/ImageUploader';

const POSITION_VALUES = ['homepage_banner', 'homepage_middle', 'sidebar', 'vehicle_list', 'booking_confirm'] as const;
const positionLabelKey: Record<string, string> = {
  homepage_banner: 'adminDash.ads.posHomepageBanner',
  homepage_middle: 'adminDash.ads.posHomepageMiddle',
  sidebar: 'adminDash.ads.posSidebar',
  vehicle_list: 'adminDash.ads.posVehicleList',
  booking_confirm: 'adminDash.ads.posBookingConfirm',
};

const emptyAd = {
  title: '',
  description: '',
  image_url: '',
  link_url: '',
  position: 'homepage_banner',
  is_active: true,
  start_date: '',
  end_date: '',
};

export default function AdminAds() {
  const { t, i18n } = useTranslation();
  const positions = POSITION_VALUES.map(value => ({ value, label: t(positionLabelKey[value]) }));
  const [ads, setAds] = useState<PlatformAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyAd);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadAds(); }, []);

  async function loadAds() {
    const { data } = await supabase.from('platform_ads').select('*').order('created_at', { ascending: false });
    setAds((data || []) as PlatformAd[]);
    setLoading(false);
  }

  function startEdit(ad: PlatformAd) {
    setEditing(ad.id);
    setCreating(false);
    setForm({
      title: ad.title,
      description: ad.description,
      image_url: ad.image_url,
      link_url: ad.link_url,
      position: ad.position,
      is_active: ad.is_active,
      start_date: ad.start_date ? ad.start_date.split('T')[0] : '',
      end_date: ad.end_date ? ad.end_date.split('T')[0] : '',
    });
  }

  function startCreate() {
    setCreating(true);
    setEditing(null);
    setForm({ ...emptyAd });
  }

  function cancelEdit() {
    setEditing(null);
    setCreating(false);
    setForm(emptyAd);
  }

  async function saveAd() {
    setSaving(true);
    const payload = {
      title: form.title,
      description: form.description,
      image_url: form.image_url,
      link_url: form.link_url,
      position: form.position,
      is_active: form.is_active,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      updated_at: new Date().toISOString(),
    };
    if (editing) {
      await supabase.from('platform_ads').update(payload).eq('id', editing);
    } else {
      await supabase.from('platform_ads').insert(payload);
    }
    cancelEdit();
    setSaving(false);
    loadAds();
  }

  async function deleteAd(id: string) {
    if (!confirm(t('adminDash.ads.confirmDelete'))) return;
    await supabase.from('platform_ads').delete().eq('id', id);
    loadAds();
  }

  async function toggleAd(id: string, active: boolean) {
    await supabase.from('platform_ads').update({ is_active: !active }).eq('id', id);
    loadAds();
  }

  const totalViews = ads.reduce((s, a) => s + a.view_count, 0);
  const totalClicks = ads.reduce((s, a) => s + a.click_count, 0);
  const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : '0';

  const inputClass = 'w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all';

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-950">{t('adminDash.ads.pageTitle')}</h1>
          <p className="text-dark-500 mt-1 text-[15px]">{t('adminDash.ads.pageSubtitle')}</p>
        </div>
        <button onClick={startCreate} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-all shadow-sm">
          <Plus className="w-4 h-4" />
          {t('adminDash.ads.newAd')}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><BarChart2 className="w-5 h-5 text-blue-600" /></div>
          <div><p className="text-xl font-bold text-dark-950">{totalViews}</p><p className="text-xs text-dark-500">{t('adminDash.ads.statTotalViews')}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center"><MousePointerClick className="w-5 h-5 text-green-600" /></div>
          <div><p className="text-xl font-bold text-dark-950">{totalClicks}</p><p className="text-xs text-dark-500">{t('adminDash.ads.statTotalClicks')}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><Megaphone className="w-5 h-5 text-amber-600" /></div>
          <div><p className="text-xl font-bold text-dark-950">{ctr}%</p><p className="text-xs text-dark-500">{t('adminDash.ads.statAvgCtr')}</p></div>
        </div>
      </div>

      {(creating || editing) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-dark-950 mb-5">{creating ? t('adminDash.ads.newAdTitle') : t('adminDash.ads.editAdTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-dark-600 mb-1.5">{t('adminDash.ads.title')}</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputClass} placeholder={t('adminDash.ads.titlePlaceholder')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-600 mb-1.5">{t('adminDash.ads.position')}</label>
              <select value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} className={inputClass}>
                {positions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-dark-600 mb-1.5">{t('adminDash.ads.description')}</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className={`${inputClass} resize-none`} />
            </div>
            <div className="md:col-span-2">
              <ImageUploader
                value={form.image_url}
                onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
                bucket="ad-images"
                pathPrefix="ads"
                aspectRatio="aspect-[16/9]"
                label={t('adminDash.ads.imageLabel')}
                emptyText={t('adminDash.ads.uploadImage')}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-600 mb-1.5">{t('adminDash.ads.linkUrl')}</label>
              <input value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))} className={inputClass} placeholder="https://..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-600 mb-1.5">{t('adminDash.ads.startDate')}</label>
              <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-600 mb-1.5">{t('adminDash.ads.endDate')}</label>
              <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className={inputClass} />
            </div>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="sr-only peer" />
              <div className="w-10 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600" />
            </label>
            <span className="text-sm text-dark-700">{t('adminDash.ads.active')}</span>
          </div>
          <div className="flex gap-3">
            <button onClick={saveAd} disabled={saving || !form.title} className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {t('adminDash.ads.save')}
            </button>
            <button onClick={cancelEdit} className="px-5 py-2.5 bg-gray-100 text-dark-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors">{t('adminDash.ads.cancel')}</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ads.map(ad => (
          <div key={ad.id} className={`bg-white rounded-lg border border-gray-200 overflow-hidden group ${!ad.is_active ? 'opacity-60' : ''}`}>
            {ad.image_url && (
              <div className="h-36 bg-gray-100 relative overflow-hidden">
                <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                {!ad.is_active && (
                  <div className="absolute inset-0 bg-dark-950/40 flex items-center justify-center">
                    <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full">{t('adminDash.ads.inactiveBadge')}</span>
                  </div>
                )}
              </div>
            )}
            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="text-sm font-bold text-dark-950">{ad.title}</h3>
                  <span className="inline-flex px-2 py-0.5 bg-gray-100 text-dark-500 text-[10px] font-semibold rounded mt-1">
                    {positions.find(p => p.value === ad.position)?.label || ad.position}
                  </span>
                </div>
                {ad.link_url && (
                  <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              {ad.description && <p className="text-xs text-dark-500 mb-3 line-clamp-2">{ad.description}</p>}
              <div className="flex items-center gap-4 text-[11px] text-dark-400 mb-3">
                <span>{t('adminDash.ads.viewsShort', { count: ad.view_count })}</span>
                <span>{t('adminDash.ads.clicksShort', { count: ad.click_count })}</span>
                {ad.start_date && <span>{t('adminDash.ads.fromDate', { date: new Date(ad.start_date).toLocaleDateString(localeFromI18n(i18n.language)) })}</span>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleAd(ad.id, ad.is_active)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-colors ${ad.is_active ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-50 text-dark-500 hover:bg-gray-100'}`}>
                  {ad.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {ad.is_active ? t('adminDash.ads.active') : t('adminDash.ads.inactive')}
                </button>
                <button onClick={() => startEdit(ad)} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-50 text-dark-600 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => deleteAd(ad.id)} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {ads.length === 0 && (
          <div className="md:col-span-2 bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Megaphone className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-dark-500">{t('adminDash.ads.emptyState')}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
