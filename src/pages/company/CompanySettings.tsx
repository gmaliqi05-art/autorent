import { useState, useEffect, lazy, Suspense } from 'react';
import { Loader2, CheckCircle2, AlertCircle, MapPin, Navigation } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Company } from '../../lib/types';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { companyNavItems } from '../../lib/companyNav';

const LocationPickerMap = lazy(() => import('../../components/map/LocationPickerMap'));

interface FormState {
  name: string;
  logo_url: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  license_number: string;
  latitude: number | null;
  longitude: number | null;
}

const initialForm: FormState = {
  name: '',
  logo_url: '',
  description: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  country: '',
  license_number: '',
  latitude: null,
  longitude: null,
};

export default function CompanySettings() {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [geoLocating, setGeoLocating] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('companies')
      .select('*')
      .eq('owner_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const c = data as Company;
          setCompany(c);
          setForm({
            name: c.name || '',
            logo_url: c.logo_url || '',
            description: c.description || '',
            phone: c.phone || '',
            email: c.email || '',
            address: c.address || '',
            city: c.city || '',
            country: c.country || '',
            license_number: c.license_number || '',
            latitude: c.latitude ?? null,
            longitude: c.longitude ?? null,
          });
        }
        setLoading(false);
      });
  }, [user]);

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
        description: form.description,
        phone: form.phone,
        email: form.email,
        address: form.address,
        city: form.city,
        country: form.country,
        license_number: form.license_number,
        latitude: form.latitude,
        longitude: form.longitude,
        updated_at: new Date().toISOString(),
      })
      .eq('id', company.id);

    setSaving(false);

    if (error) {
      setFeedback({ type: 'error', message: 'Ndodhi nje gabim gjate ruajtjes. Provoni perseri.' });
    } else {
      setFeedback({ type: 'success', message: 'Ndryshimet u ruajten me sukses!' });
      setTimeout(() => setFeedback(null), 3000);
    }
  }

  function updateField(field: keyof FormState, value: string) {
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

  const inputClass = 'w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all';

  if (loading) {
    return (
      <DashboardLayout title="Cilesimet" navItems={companyNavItems}>
        <div className="flex items-center justify-center h-64">
          <div className="w-7 h-7 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Cilesimet" navItems={companyNavItems}>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-dark-950 mb-1">Cilesimet e kompanise</h1>
        <p className="text-dark-500 mb-8 text-[15px]">Perditesoni informacionet dhe vendndodhjen e kompanise suaj</p>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <h2 className="text-sm font-semibold text-dark-400 uppercase tracking-wide">Informacionet bazike</h2>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">Emri i kompanise</label>
              <input type="text" value={form.name} onChange={e => updateField('name', e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">Logo URL</label>
              <input type="url" value={form.logo_url} onChange={e => updateField('logo_url', e.target.value)} placeholder="https://" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">Pershkrimi</label>
              <textarea value={form.description} onChange={e => updateField('description', e.target.value)} rows={3} className={`${inputClass} resize-none`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">Numri i licences</label>
              <input type="text" value={form.license_number} onChange={e => updateField('license_number', e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <h2 className="text-sm font-semibold text-dark-400 uppercase tracking-wide">Kontakti</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1.5">Telefoni</label>
                <input type="tel" value={form.phone} onChange={e => updateField('phone', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={e => updateField('email', e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <h2 className="text-sm font-semibold text-dark-400 uppercase tracking-wide">Vendndodhja & Harta</h2>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">Adresa</label>
              <input type="text" value={form.address} onChange={e => updateField('address', e.target.value)} className={inputClass} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1.5">Qyteti</label>
                <input type="text" value={form.city} onChange={e => updateField('city', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1.5">Shteti</label>
                <input type="text" value={form.country} onChange={e => updateField('country', e.target.value)} className={inputClass} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-dark-700">Pozicioni ne harte</p>
                  <p className="text-xs text-dark-400 mt-0.5">Kliko ne harte ose zvarrit markesin per te caktuar vendndodhjen sakte. Ky lokacion do shfaqet ne homepage.</p>
                </div>
                <button
                  type="button"
                  onClick={locateMe}
                  disabled={geoLocating}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 text-xs font-semibold rounded-xl hover:bg-primary-100 transition-colors disabled:opacity-60 ml-4 shrink-0"
                >
                  {geoLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                  Vendosi ketu
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
                  Vendndodhja e caktuar: {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}
                </div>
              ) : (
                <p className="mt-2 text-xs text-dark-400">Nuk eshte caktuar ende. Kliko ne harte ose perdor "Vendosi ketu".</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 pb-4">
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Duke ruajtur...' : 'Ruaj ndryshimet'}
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
