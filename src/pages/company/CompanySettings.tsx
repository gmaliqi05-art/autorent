import { useState, useEffect, lazy, Suspense } from 'react';
import { Loader2, CheckCircle2, AlertCircle, MapPin, Navigation, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Company } from '../../lib/types';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { companyNavItems } from '../../lib/companyNav';
import ImageUploader from '../../components/common/ImageUploader';

const LocationPickerMap = lazy(() => import('../../components/map/LocationPickerMap'));

type WorkingHours = Record<string, { open: string; close: string } | null>;

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

const DEFAULT_HOURS: WorkingHours = {
  monday: { open: '08:00', close: '20:00' },
  tuesday: { open: '08:00', close: '20:00' },
  wednesday: { open: '08:00', close: '20:00' },
  thursday: { open: '08:00', close: '20:00' },
  friday: { open: '08:00', close: '20:00' },
  saturday: { open: '09:00', close: '18:00' },
  sunday: null,
};

interface FormState {
  name: string;
  logo_url: string;
  cover_image_url: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  license_number: string;
  latitude: number | null;
  longitude: number | null;
  working_hours: WorkingHours;
}

const initialForm: FormState = {
  name: '',
  logo_url: '',
  cover_image_url: '',
  description: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  country: '',
  license_number: '',
  latitude: null,
  longitude: null,
  working_hours: DEFAULT_HOURS,
};

export default function CompanySettings() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [geoLocating, setGeoLocating] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  function loadData() {
    setLoading(true);
    setLoadError(false);
    supabase
      .from('companies')
      .select('*')
      .eq('owner_id', user!.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          setLoadError(true);
          setLoading(false);
          return;
        }
        if (data) {
          const c = data as Company;
          setCompany(c);
          const hours = (c.working_hours && Object.keys(c.working_hours).length > 0)
            ? (c.working_hours as WorkingHours)
            : DEFAULT_HOURS;
          setForm({
            name: c.name || '',
            logo_url: c.logo_url || '',
            cover_image_url: c.cover_image_url || '',
            description: c.description || '',
            phone: c.phone || '',
            email: c.email || '',
            address: c.address || '',
            city: c.city || '',
            country: c.country || '',
            license_number: c.license_number || '',
            latitude: c.latitude ?? null,
            longitude: c.longitude ?? null,
            working_hours: hours,
          });
        }
        setLoading(false);
      });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!company) return;
    setSaving(true);
    setFeedback(null);

    const { error } = await supabase
      .from('companies')
      .update({
        name: form.name,
        logo_url: form.logo_url,
        cover_image_url: form.cover_image_url,
        description: form.description,
        phone: form.phone,
        email: form.email,
        address: form.address,
        city: form.city,
        country: form.country,
        license_number: form.license_number,
        latitude: form.latitude,
        longitude: form.longitude,
        working_hours: form.working_hours,
        updated_at: new Date().toISOString(),
      })
      .eq('id', company.id);

    setSaving(false);

    if (error) {
      setFeedback({ type: 'error', message: t('companyDash.settings.saveError') });
    } else {
      setFeedback({ type: 'success', message: t('companyDash.settings.savedSuccess') });
      setTimeout(() => setFeedback(null), 3000);
    }
  }

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function locateMe() {
    if (!navigator.geolocation) return;
    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
        setGeoLocating(false);
      },
      () => setGeoLocating(false),
      { timeout: 10000 }
    );
  }

  function setDayClosed(day: string, closed: boolean) {
    setForm(prev => ({
      ...prev,
      working_hours: {
        ...prev.working_hours,
        [day]: closed ? null : { open: '08:00', close: '20:00' },
      },
    }));
  }

  function setDayTime(day: string, field: 'open' | 'close', value: string) {
    setForm(prev => {
      const current = prev.working_hours[day] || { open: '08:00', close: '20:00' };
      return {
        ...prev,
        working_hours: {
          ...prev.working_hours,
          [day]: { ...current, [field]: value },
        },
      };
    });
  }

  const inputClass = 'w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all';

  if (loading) {
    return (
      <DashboardLayout title={t('companyDash.settings.title')} navItems={companyNavItems}>
        <div className="flex items-center justify-center h-64">
          <div className="w-7 h-7 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (loadError) {
    return (
      <DashboardLayout title={t('companyDash.settings.title')} navItems={companyNavItems}>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-sm text-dark-600">{t('companyDash.common.loadError')}</p>
          <button onClick={loadData} className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700">
            {t('companyDash.common.tryAgain')}
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!company) {
    return (
      <DashboardLayout title={t('companyDash.settings.title')} navItems={companyNavItems}>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <AlertCircle className="w-8 h-8 text-amber-500" />
          <p className="text-sm text-dark-600">{t('companyDash.common.noCompany')}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={t('companyDash.settings.title')} navItems={companyNavItems}>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-dark-950 mb-1">{t('companyDash.settings.heading')}</h1>
        <p className="text-dark-500 mb-8 text-[15px]">{t('companyDash.settings.subtitle')}</p>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <h2 className="text-sm font-semibold text-dark-400 uppercase tracking-wide">{t('companyDash.settings.sectionBasic')}</h2>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">{t('companyDash.settings.name')}</label>
              <input type="text" value={form.name} onChange={e => updateField('name', e.target.value)} required className={inputClass} />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">{t('companyDash.settings.logo')}</label>
              <div className="flex items-start gap-4">
                <div className="w-24">
                  <ImageUploader
                    value={form.logo_url}
                    onChange={(url) => updateField('logo_url', url)}
                    bucket="company-media"
                    pathPrefix={company?.id || ''}
                    aspectRatio="aspect-square"
                    maxSizeMB={2}
                    emptyText="Ngarko logo"
                  />
                </div>
                <div className="flex-1 flex items-center text-xs text-dark-400">
                  {t('companyDash.settings.logoHint')}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">{t('companyDash.settings.cover')}</label>
              <ImageUploader
                value={form.cover_image_url}
                onChange={(url) => updateField('cover_image_url', url)}
                bucket="company-media"
                pathPrefix={company?.id || ''}
                aspectRatio="aspect-[3/1]"
                maxSizeMB={5}
                emptyText="Ngarko cover image"
              />
              <p className="mt-1.5 text-xs text-dark-400">{t('companyDash.settings.coverHint')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">{t('companyDash.settings.description')}</label>
              <textarea value={form.description} onChange={e => updateField('description', e.target.value)} rows={3} className={`${inputClass} resize-none`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">{t('companyDash.settings.licenseNumber')}</label>
              <input type="text" value={form.license_number} onChange={e => updateField('license_number', e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-dark-400" />
              <h2 className="text-sm font-semibold text-dark-400 uppercase tracking-wide">{t('companyDash.settings.sectionHours')}</h2>
            </div>
            <p className="text-xs text-dark-500 -mt-2">{t('companyDash.settings.hoursHint')}</p>
            <div className="space-y-2">
              {DAYS.map(day => {
                const entry = form.working_hours[day];
                const closed = entry === null;
                return (
                  <div key={day} className="flex flex-wrap items-center gap-3 py-1.5 border-b last:border-0 border-gray-100">
                    <div className="w-28 text-sm font-medium text-dark-800">{t(`companyDash.settings.days.${day}`)}</div>
                    <label className="inline-flex items-center gap-2 text-xs font-medium text-dark-600">
                      <input
                        type="checkbox"
                        checked={!closed}
                        onChange={e => setDayClosed(day, !e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      {closed ? t('companyDash.settings.closed') : t('companyDash.settings.open')}
                    </label>
                    {!closed && entry && (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={entry.open}
                          onChange={e => setDayTime(day, 'open', e.target.value)}
                          className="px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-sm"
                        />
                        <span className="text-dark-400">-</span>
                        <input
                          type="time"
                          value={entry.close}
                          onChange={e => setDayTime(day, 'close', e.target.value)}
                          className="px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <h2 className="text-sm font-semibold text-dark-400 uppercase tracking-wide">{t('companyDash.settings.sectionContact')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1.5">{t('companyDash.settings.phone')}</label>
                <input type="tel" value={form.phone} onChange={e => updateField('phone', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1.5">{t('companyDash.settings.email')}</label>
                <input type="email" value={form.email} onChange={e => updateField('email', e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <h2 className="text-sm font-semibold text-dark-400 uppercase tracking-wide">{t('companyDash.settings.sectionLocation')}</h2>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">{t('companyDash.settings.address')}</label>
              <input type="text" value={form.address} onChange={e => updateField('address', e.target.value)} className={inputClass} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1.5">{t('companyDash.settings.city')}</label>
                <input type="text" value={form.city} onChange={e => updateField('city', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1.5">{t('companyDash.settings.country')}</label>
                <input type="text" value={form.country} onChange={e => updateField('country', e.target.value)} className={inputClass} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-dark-700">{t('companyDash.settings.mapPosition')}</p>
                  <p className="text-xs text-dark-400 mt-0.5">{t('companyDash.settings.mapHint')}</p>
                </div>
                <button
                  type="button"
                  onClick={locateMe}
                  disabled={geoLocating}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 text-xs font-semibold rounded-xl hover:bg-primary-100 transition-colors disabled:opacity-60 ml-4 shrink-0"
                >
                  {geoLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                  {t('companyDash.settings.locateMe')}
                </button>
              </div>

              <Suspense fallback={
                <div className="h-80 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
                </div>
              }>
                <LocationPickerMap
                  lat={form.latitude}
                  lng={form.longitude}
                  onChange={(lat, lng) => setForm(f => ({ ...f, latitude: lat, longitude: lng }))}
                  height="320px"
                />
              </Suspense>

              {form.latitude && form.longitude ? (
                <div className="mt-2 flex items-center gap-2 text-xs text-green-700 font-medium bg-green-50 px-3 py-2 rounded-lg">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {t('companyDash.settings.locationSet')}: {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}
                </div>
              ) : (
                <p className="mt-2 text-xs text-dark-400">{t('companyDash.settings.locationNotSet')}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 pb-4">
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? t('companyDash.common.saving') : t('companyDash.settings.saveChanges')}
            </button>
            {feedback && feedback.type === 'success' && (
              <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                {feedback.message}
              </span>
            )}
            {feedback && feedback.type === 'error' && (
              <span className="flex items-center gap-1.5 text-sm text-red-600 font-medium animate-fade-in">
                <AlertCircle className="w-4 h-4" />
                {feedback.message}
              </span>
            )}
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
