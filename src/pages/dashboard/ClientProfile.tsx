import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { clientNavItems } from '../../lib/clientNav';
import type { Country, City } from '../../lib/types';
import DashboardLayout from '../../components/layout/DashboardLayout';

const inputClass = 'w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all';

export default function ClientProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [selectedCountryId, setSelectedCountryId] = useState(profile?.country_id || '');
  const [selectedCityId, setSelectedCityId] = useState(profile?.city_id || '');
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [saving, setSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setSelectedCountryId(profile.country_id || '');
      setSelectedCityId(profile.city_id || '');
    }
  }, [profile]);

  useEffect(() => {
    if (selectedCountryId && cities.length > 0) {
      const filtered = cities.filter(c => c.country_id === selectedCountryId);
      setFilteredCities(filtered);
      if (filtered.length > 0 && !filtered.find(c => c.id === selectedCityId)) {
        setSelectedCityId('');
      }
    } else {
      setFilteredCities([]);
    }
  }, [selectedCountryId, cities]);

  async function loadLocations() {
    const [countriesRes, citiesRes] = await Promise.all([
      supabase.from('countries').select('*').order('name'),
      supabase.from('cities').select('*').order('name'),
    ]);
    setCountries((countriesRes.data || []) as Country[]);
    setCities((citiesRes.data || []) as City[]);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setProfileMessage(null);
    const { error } = await supabase.from('profiles').update({
      full_name: fullName,
      phone,
      country_id: selectedCountryId || null,
      city_id: selectedCityId || null,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);
    if (error) {
      setProfileMessage({ type: 'error', text: 'Ndodhi nje gabim gjate ruajtjes. Ju lutem provoni perseri.' });
    } else {
      await refreshProfile();
      setProfileMessage({ type: 'success', text: 'U ruajt me sukses!' });
    }
    setSaving(false);
    setTimeout(() => setProfileMessage(null), 3000);
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Fjalekalimi duhet te kete te pakten 6 karaktere.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Fjalekalimi i ri nuk perputhet me konfirmimin.' });
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordMessage({ type: 'error', text: error.message || 'Ndodhi nje gabim gjate ndryshimit te fjalekalimit.' });
    } else {
      setPasswordMessage({ type: 'success', text: 'Fjalekalimi u ndryshua me sukses!' });
      setNewPassword('');
      setConfirmPassword('');
    }
    setChangingPassword(false);
    setTimeout(() => setPasswordMessage(null), 3000);
  }

  return (
    <DashboardLayout title="Profili" navItems={clientNavItems}>
      <div className="max-w-xl">
        <h1 className="text-2xl font-bold text-dark-950 mb-1">Profili im</h1>
        <p className="text-dark-500 mb-8 text-[15px]">Perditesoni informacionet tuaja personale</p>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">Email</label>
              <input type="email" value={profile?.email || ''} disabled className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-dark-400 cursor-not-allowed" />
              <p className="text-[11px] text-dark-400 mt-1">Emaili nuk mund te ndryshohet</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">Emri i plote</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">Numri i telefonit</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+383 4X XXX XXX" className={`${inputClass} placeholder:text-dark-300`} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1.5">Shteti</label>
                <select value={selectedCountryId} onChange={e => setSelectedCountryId(e.target.value)} className={inputClass}>
                  <option value="">Zgjidhni shtetin</option>
                  {countries.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1.5">Qyteti</label>
                <select value={selectedCityId} onChange={e => setSelectedCityId(e.target.value)} className={inputClass} disabled={!selectedCountryId || filteredCities.length === 0}>
                  <option value="">Zgjidhni qytetin</option>
                  {filteredCities.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={saving} className="px-6 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Duke ruajtur...' : 'Ruaj ndryshimet'}
              </button>
              {profileMessage && (
                <span className={`flex items-center gap-1.5 text-sm font-medium animate-fade-in ${profileMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {profileMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {profileMessage.text}
                </span>
              )}
            </div>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-6">
          <h2 className="text-lg font-semibold text-dark-950 mb-1">Ndrysho fjalekalimin</h2>
          <p className="text-dark-500 text-sm mb-5">Vendosni nje fjalekalim te ri per llogarine tuaj</p>
          <form onSubmit={handlePasswordChange} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">Fjalekalimi i ri</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  placeholder="Minimum 6 karaktere"
                  className={`${inputClass} pr-11 placeholder:text-dark-300`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600 transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">Konfirmo fjalekalimin e ri</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Perseritni fjalekalimin"
                  className={`${inputClass} pr-11 placeholder:text-dark-300`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={changingPassword} className="px-6 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all flex items-center gap-2">
                {changingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                {changingPassword ? 'Duke ndryshuar...' : 'Ndrysho fjalekalimin'}
              </button>
              {passwordMessage && (
                <span className={`flex items-center gap-1.5 text-sm font-medium animate-fade-in ${passwordMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {passwordMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {passwordMessage.text}
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
