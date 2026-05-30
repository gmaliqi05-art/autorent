import { useState } from 'react';
import { Save, Loader2, CheckCircle, Link, AlignLeft, Calendar, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNavItems, adminNavGroups } from '../../lib/adminNav';
import { useNavigate } from 'react-router-dom';
import ImageUploader from '../../components/common/ImageUploader';

const POSITION_VALUES = ['homepage_banner', 'homepage_middle', 'sidebar', 'vehicle_list', 'booking_confirm'] as const;
const positionLabelKey: Record<string, string> = {
  homepage_banner: 'adminDash.createAd.posHomepageBannerLabel',
  homepage_middle: 'adminDash.createAd.posHomepageMiddleLabel',
  sidebar: 'adminDash.createAd.posSidebarLabel',
  vehicle_list: 'adminDash.createAd.posVehicleListLabel',
  booking_confirm: 'adminDash.createAd.posBookingConfirmLabel',
};
const positionDescKey: Record<string, string> = {
  homepage_banner: 'adminDash.createAd.posHomepageBannerDesc',
  homepage_middle: 'adminDash.createAd.posHomepageMiddleDesc',
  sidebar: 'adminDash.createAd.posSidebarDesc',
  vehicle_list: 'adminDash.createAd.posVehicleListDesc',
  booking_confirm: 'adminDash.createAd.posBookingConfirmDesc',
};

export default function AdminCreateAd() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const positions = POSITION_VALUES.map(value => ({ value, label: t(positionLabelKey[value]), desc: t(positionDescKey[value]) }));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', image_url: '', link_url: '',
    position: 'homepage_banner', is_active: true,
    start_date: '', end_date: '',
  });
  const [preview, setPreview] = useState(false);

  async function save() {
    if (!form.title) return;
    setSaving(true);
    await supabase.from('platform_ads').insert({
      ...form,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      click_count: 0,
      view_count: 0,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => navigate('/admin/reklamat'), 1500);
  }

  const selectedPos = positions.find(p => p.value === form.position);

  return (
    <DashboardLayout navItems={adminNavItems} navGroups={adminNavGroups} title={t('adminDash.createAd.pageTitle')}>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('adminDash.createAd.heading')}</h1>
            <p className="text-gray-500 text-sm mt-1">{t('adminDash.createAd.subtitle')}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setPreview(!preview)}
              className={`flex items-center gap-2 border px-4 py-2.5 rounded-lg text-sm font-medium ${preview ? 'border-primary-300 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              <Eye className="w-4 h-4" />{t('adminDash.createAd.preview')}
            </button>
            <button onClick={save} disabled={saving || !form.title}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? t('adminDash.createAd.saving') : saved ? t('adminDash.createAd.saved') : t('adminDash.createAd.publish')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-5">
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2"><AlignLeft className="w-5 h-5 text-primary-600" />{t('adminDash.createAd.content')}</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminDash.createAd.titleLabel')}</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder={t('adminDash.createAd.titlePlaceholder')} maxLength={100}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminDash.createAd.descLabel')}</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} placeholder={t('adminDash.createAd.descPlaceholder')} maxLength={250}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <p className="text-xs text-gray-400 mt-1">{form.description.length}/250</p>
              </div>
              <ImageUploader
                value={form.image_url}
                onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
                bucket="ad-images"
                pathPrefix="ads"
                aspectRatio="aspect-[16/9]"
                label={t('adminDash.createAd.imageLabel')}
                emptyText={t('adminDash.createAd.uploadImage')}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminDash.createAd.linkUrlLabel')}</label>
                <div className="relative">
                  <Link className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))}
                    placeholder="https://..." className="w-full pl-9 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Calendar className="w-5 h-5 text-primary-600" />{t('adminDash.createAd.period')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminDash.createAd.startsAt')}</label>
                  <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminDash.createAd.expiresAt')}</label>
                  <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div>
                  <div className="text-sm font-medium text-gray-700">{t('adminDash.createAd.publishNowTitle')}</div>
                  <div className="text-xs text-gray-500">{t('adminDash.createAd.publishNowDesc')}</div>
                </div>
                <button onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                  className={`w-12 h-6 rounded-full transition-colors ${form.is_active ? 'bg-primary-600' : 'bg-gray-300'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${form.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">{t('adminDash.createAd.positionTitle')}</h3>
              <div className="space-y-2">
                {positions.map(pos => (
                  <button key={pos.value} onClick={() => setForm(f => ({ ...f, position: pos.value }))}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${form.position === pos.value ? 'border-primary-500 bg-primary-50' : 'border-gray-100 hover:border-gray-200'}`}>
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${form.position === pos.value ? 'bg-primary-600' : 'bg-gray-300'}`} />
                    <div>
                      <div className={`text-sm font-medium ${form.position === pos.value ? 'text-primary-700' : 'text-gray-700'}`}>{pos.label}</div>
                      <div className="text-xs text-gray-400">{pos.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {preview && form.title && (
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">{t('adminDash.createAd.previewTitle')}</h3>
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  {form.image_url ? (
                    <img src={form.image_url} alt={form.title} className="w-full h-24 object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-24 bg-white border border-gray-200 flex items-center justify-center">
                      <span className="text-primary-400 text-sm">{t('adminDash.createAd.noImage')}</span>
                    </div>
                  )}
                  <div className="p-3">
                    <p className="font-semibold text-gray-900 text-sm">{form.title}</p>
                    {form.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{form.description}</p>}
                    {form.link_url && <p className="text-xs text-primary-600 mt-2 truncate">{form.link_url}</p>}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  <span className="px-2 py-1 bg-gray-100 rounded-lg">{selectedPos?.label}</span>
                  <span className={`px-2 py-1 rounded-lg ${form.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                    {form.is_active ? t('adminDash.createAd.active') : t('adminDash.createAd.inactive')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
