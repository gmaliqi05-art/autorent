import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, Trash2, Mail, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { clientNavItems } from '../../lib/clientNav';
import type { Country, City } from '../../lib/types';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ClientDocumentsCard from '../../components/profile/ClientDocumentsCard';

const inputClass = 'w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all';

function passwordStrength(pw: string): { score: number; labelKey: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const keys = ['veryWeak', 'weak', 'fair', 'good', 'strong', 'max'];
  const colors = ['bg-red-500', 'bg-red-400', 'bg-amber-400', 'bg-amber-500', 'bg-green-500', 'bg-green-600'];
  return { score, labelKey: keys[Math.min(score, 5)], color: colors[Math.min(score, 5)] };
}

function validatePasswordRules(pw: string): string | null {
  if (pw.length < 8) return 'tooShort';
  if (!/[A-Z]/.test(pw)) return 'needsUpper';
  if (!/[0-9]/.test(pw)) return 'needsDigit';
  return null;
}

export default function ClientProfile() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
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

  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [changingEmail, setChangingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => { loadLocations(); }, []);

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
      setProfileMessage({ type: 'error', text: t('clientDash.profile.saveError') });
    } else {
      await refreshProfile();
      setProfileMessage({ type: 'success', text: t('clientDash.profile.saveSuccess') });
    }
    setSaving(false);
    setTimeout(() => setProfileMessage(null), 3000);
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);
    const ruleError = validatePasswordRules(newPassword);
    if (ruleError) {
      setPasswordMessage({ type: 'error', text: t(`clientDash.profile.passwordRule.${ruleError}`) });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: t('clientDash.profile.passwordMismatch') });
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordMessage({ type: 'error', text: error.message || t('clientDash.profile.passwordError') });
    } else {
      setPasswordMessage({ type: 'success', text: t('clientDash.profile.passwordSuccess') });
      setNewPassword('');
      setConfirmPassword('');
    }
    setChangingPassword(false);
    setTimeout(() => setPasswordMessage(null), 3000);
  }

  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault();
    setEmailMessage(null);
    if (!newEmail.includes('@') || newEmail.length < 5) {
      setEmailMessage({ type: 'error', text: t('clientDash.profile.invalidEmail') });
      return;
    }
    setChangingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setChangingEmail(false);
    if (error) {
      setEmailMessage({ type: 'error', text: error.message });
      return;
    }
    setEmailMessage({ type: 'success', text: t('clientDash.profile.emailChangeRequested') });
    setNewEmail('');
    setTimeout(() => { setShowEmailChange(false); setEmailMessage(null); }, 4000);
  }

  async function handleDeleteAccount() {
    if (!user) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`;
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleting(false);
        setDeleteError(body?.error || t('clientDash.profile.deleteError'));
        return;
      }
      await signOut();
      navigate('/');
    } catch (err) {
      setDeleting(false);
      setDeleteError((err as Error).message);
    }
  }

  const strength = passwordStrength(newPassword);

  return (
    <DashboardLayout title={t('clientNav.profile')} navItems={clientNavItems}>
      <div className="max-w-xl">
        <h1 className="text-2xl font-bold text-dark-950 mb-1">{t('clientDash.profile.title')}</h1>
        <p className="text-dark-500 mb-8 text-[15px]">{t('clientDash.profile.subtitle')}</p>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">{t('clientDash.profile.email')}</label>
              <div className="flex items-center gap-2">
                <input type="email" value={profile?.email || ''} disabled className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-dark-400 cursor-not-allowed" />
                <button
                  type="button"
                  onClick={() => { setShowEmailChange(v => !v); setNewEmail(''); setEmailMessage(null); }}
                  className="px-3 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-dark-700 hover:bg-gray-50 transition-colors inline-flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {t('clientDash.profile.changeEmail')}
                </button>
              </div>
              {showEmailChange && (
                <div className="mt-3 p-4 border border-primary-100 bg-primary-50/40 rounded-xl">
                  <p className="text-xs text-dark-600 mb-2">{t('clientDash.profile.emailChangeHelp')}</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      placeholder={t('clientDash.profile.newEmailPlaceholder')}
                      className={`${inputClass} py-2`}
                    />
                    <button
                      type="button"
                      onClick={handleEmailChange}
                      disabled={changingEmail}
                      className="px-4 py-2 bg-primary-600 text-white text-xs font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all inline-flex items-center gap-2 whitespace-nowrap"
                    >
                      {changingEmail && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {t('clientDash.profile.sendLink')}
                    </button>
                  </div>
                  {emailMessage && (
                    <p className={`text-xs mt-2 font-medium ${emailMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                      {emailMessage.text}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">{t('clientDash.profile.fullName')}</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">{t('clientDash.profile.phone')}</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder={t('clientDash.profile.phonePlaceholder')} className={`${inputClass} placeholder:text-dark-300`} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1.5">{t('clientDash.profile.country')}</label>
                <select value={selectedCountryId} onChange={e => setSelectedCountryId(e.target.value)} className={inputClass}>
                  <option value="">{t('clientDash.profile.selectCountry')}</option>
                  {countries.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1.5">{t('clientDash.profile.city')}</label>
                <select value={selectedCityId} onChange={e => setSelectedCityId(e.target.value)} className={inputClass} disabled={!selectedCountryId || filteredCities.length === 0}>
                  <option value="">{t('clientDash.profile.selectCity')}</option>
                  {filteredCities.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={saving} className="px-6 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? t('clientDash.profile.saving') : t('clientDash.profile.save')}
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

        {user && <ClientDocumentsCard userId={user.id} />}

        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
          <h2 className="text-lg font-semibold text-dark-950 mb-1">{t('clientDash.profile.changePassword')}</h2>
          <p className="text-dark-500 text-sm mb-5">{t('clientDash.profile.changePasswordSubtitle')}</p>
          <form onSubmit={handlePasswordChange} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">{t('clientDash.profile.newPassword')}</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  placeholder={t('clientDash.profile.newPasswordPlaceholder')}
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
              {newPassword.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i < strength.score ? strength.color : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-dark-500 mt-1.5">
                    {t('clientDash.profile.passwordStrength')}: <span className="font-semibold">{t(`clientDash.profile.passwordStrengthLabel.${strength.labelKey}`)}</span>
                  </p>
                  <p className="text-[11px] text-dark-400 mt-0.5">{t('clientDash.profile.passwordRequirements')}</p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">{t('clientDash.profile.confirmPassword')}</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  placeholder={t('clientDash.profile.confirmPasswordPlaceholder')}
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
                {changingPassword ? t('clientDash.profile.changing') : t('clientDash.profile.changeButton')}
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

        <div className="bg-white rounded-2xl border border-red-100 p-6 mt-6">
          <h2 className="text-lg font-semibold text-red-900 mb-1">{t('clientDash.profile.dangerZone')}</h2>
          <p className="text-sm text-dark-500 mb-4">{t('clientDash.profile.deleteAccountDesc')}</p>
          <button
            type="button"
            onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(''); setDeleteError(null); }}
            className="px-5 py-2.5 border-2 border-red-300 text-red-700 text-sm font-semibold rounded-xl hover:bg-red-50 transition-colors inline-flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {t('clientDash.profile.deleteAccount')}
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark-950/40 backdrop-blur-sm" onClick={() => !deleting && setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-lg border border-gray-200 p-6 w-full max-w-md shadow-xl">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-dark-900 mb-2">{t('clientDash.profile.deleteModalTitle')}</h3>
              <p className="text-sm text-dark-600">{t('clientDash.profile.deleteModalDesc')}</p>
            </div>

            <label className="block text-xs font-medium text-dark-700 mb-1.5">
              {t('clientDash.profile.deleteConfirmLabel', { word: 'FSHIJ' })}
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              className={`${inputClass} mb-4`}
              disabled={deleting}
            />

            {deleteError && (
              <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{deleteError}</p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-dark-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
              >
                {t('clientDash.profile.cancel')}
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmText !== 'FSHIJ'}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('clientDash.profile.confirmDelete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
