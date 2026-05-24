import { useState, useEffect } from 'react';
import { Loader2, Upload, ShieldCheck, ShieldAlert, Clock, FileText, Sparkles, ExternalLink, AlertTriangle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { startIdentityVerification } from '../../lib/identityService';

interface DocumentsRow {
  client_id: string;
  license_front_url: string | null;
  license_back_url: string | null;
  license_number: string | null;
  license_expiry: string | null;
  license_categories: string[];
  id_document_url: string | null;
  id_type: 'passport' | 'national_id' | null;
  id_number: string | null;
  verified: boolean;
  verified_via: 'manual' | 'stripe_identity' | null;
  rejection_reason: string | null;
  stripe_verification_status: 'requires_input' | 'processing' | 'verified' | 'canceled' | 'requires_action' | null;
  stripe_verified_at: string | null;
}

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export default function ClientDocumentsCard({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const [doc, setDoc] = useState<DocumentsRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [startingIdentity, setStartingIdentity] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [licenseCategories, setLicenseCategories] = useState<string[]>([]);
  const [idType, setIdType] = useState<'passport' | 'national_id'>('national_id');
  const [idNumber, setIdNumber] = useState('');

  useEffect(() => { loadDoc(); }, [userId]);

  // Trajto callback nga Stripe Identity (returnUrl)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('identity_verification') === 'complete') {
      setMessage({ type: 'success', text: t('clientDash.profile.docs.stripeReturnMsg', 'Verifikimi po procesohet. Statusi do perditesohet automatikisht ne disa sekonda.') });
      // Hiq query param
      const url = new URL(window.location.href);
      url.searchParams.delete('identity_verification');
      window.history.replaceState({}, '', url.toString());
      // Reload status pas 3 sekondash (webhook duhet te kete mberritur)
      const t1 = setTimeout(() => loadDoc(), 3000);
      const t2 = setTimeout(() => loadDoc(), 8000);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadDoc() {
    setLoading(true);
    const { data } = await supabase
      .from('client_documents')
      .select('*')
      .eq('client_id', userId)
      .maybeSingle();
    if (data) {
      setDoc(data as DocumentsRow);
      setLicenseNumber(data.license_number || '');
      setLicenseExpiry(data.license_expiry || '');
      setLicenseCategories((data.license_categories as string[]) || []);
      setIdType((data.id_type as 'passport' | 'national_id') || 'national_id');
      setIdNumber(data.id_number || '');
    }
    setLoading(false);
  }

  async function ensureRow(): Promise<DocumentsRow | null> {
    if (doc) return doc;
    const { data, error } = await supabase
      .from('client_documents')
      .insert({ client_id: userId })
      .select()
      .maybeSingle();
    if (error) {
      setMessage({ type: 'error', text: error.message });
      return null;
    }
    const row = data as DocumentsRow;
    setDoc(row);
    return row;
  }

  async function uploadFile(field: 'license_front_url' | 'license_back_url' | 'id_document_url', file: File) {
    if (!ALLOWED.includes(file.type)) {
      setMessage({ type: 'error', text: t('clientDash.profile.docs.invalidType') });
      return;
    }
    if (file.size > MAX_SIZE) {
      setMessage({ type: 'error', text: t('clientDash.profile.docs.tooLarge') });
      return;
    }
    const existing = await ensureRow();
    if (!existing) return;
    setUploading(field);
    setMessage(null);
    const ext = file.name.split('.').pop();
    const path = `${userId}/${field}-${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from('client-documents').upload(path, file, { upsert: true });
    if (uploadErr) {
      setUploading(null);
      setMessage({ type: 'error', text: uploadErr.message });
      return;
    }
    const { data: signed } = await supabase.storage.from('client-documents').createSignedUrl(path, 60 * 60 * 24 * 365);
    const url = signed?.signedUrl || path;
    const { error: updateErr } = await supabase
      .from('client_documents')
      .update({ [field]: url, verified: false, rejection_reason: null, updated_at: new Date().toISOString() })
      .eq('client_id', userId);
    setUploading(null);
    if (updateErr) {
      setMessage({ type: 'error', text: updateErr.message });
      return;
    }
    setMessage({ type: 'success', text: t('clientDash.profile.docs.uploaded') });
    loadDoc();
  }

  async function saveMetadata() {
    await ensureRow();
    setSaving(true);
    setMessage(null);
    const { error } = await supabase
      .from('client_documents')
      .update({
        license_number: licenseNumber.trim() || null,
        license_expiry: licenseExpiry || null,
        license_categories: licenseCategories,
        id_type: idType,
        id_number: idNumber.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('client_id', userId);
    setSaving(false);
    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }
    setMessage({ type: 'success', text: t('clientDash.profile.docs.saved') });
    loadDoc();
  }

  function toggleCategory(cat: string) {
    setLicenseCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  }

  const badge = !doc || (!doc.license_front_url && !doc.id_document_url)
    ? { color: 'bg-red-50 text-red-700 border-red-200', icon: <ShieldAlert className="w-4 h-4" />, label: t('clientDash.profile.docs.statusMissing') }
    : doc.rejection_reason
      ? { color: 'bg-red-50 text-red-700 border-red-200', icon: <ShieldAlert className="w-4 h-4" />, label: t('clientDash.profile.docs.statusRejected') }
      : doc.verified
        ? { color: 'bg-green-50 text-green-700 border-green-200', icon: <ShieldCheck className="w-4 h-4" />, label: t('clientDash.profile.docs.statusVerified') }
        : doc.stripe_verification_status === 'requires_action'
          ? { color: 'bg-orange-50 text-orange-700 border-orange-200', icon: <AlertTriangle className="w-4 h-4" />, label: t('clientDash.profile.docs.statusRequiresAction', 'Kerkohet veprim') }
          : { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock className="w-4 h-4" />, label: t('clientDash.profile.docs.statusPending') };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold text-dark-950">{t('clientDash.profile.docs.title')}</h2>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.color}`}>
          {badge.icon}
          {badge.label}
        </span>
      </div>
      <p className="text-dark-500 text-sm mb-5">{t('clientDash.profile.docs.subtitle')}</p>

      {doc?.rejection_reason && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <strong className="block font-semibold">{t('clientDash.profile.docs.rejectionTitle')}</strong>
          <p className="mt-0.5">{doc.rejection_reason}</p>
        </div>
      )}

      {/* Stripe Identity verification - auto OCR */}
      {!doc?.verified && (
        <div className="mb-5 rounded-xl border-2 border-primary-200 bg-gradient-to-r from-primary-50 to-purple-50 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-dark-900 text-sm">
                {t('clientDash.profile.docs.stripeIdentityTitle', 'Verifikim automatik me Stripe Identity')}
              </h3>
              <p className="text-xs text-dark-600 mt-1">
                {t('clientDash.profile.docs.stripeIdentityDesc', 'Skanim automatik i patentes me OCR + match i fytyres. Verifikim ne 2 minuta — pa pritje per admin.')}
              </p>
              {doc?.stripe_verification_status === 'processing' && (
                <p className="mt-2 text-xs text-amber-700 font-medium inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {t('clientDash.profile.docs.stripeProcessing', 'Verifikimi po procesohet. Do njoftoheni kur te perfundoje.')}
                </p>
              )}
              {doc?.stripe_verification_status === 'requires_action' && (
                <div className="mt-2 rounded-lg border border-orange-300 bg-orange-50 px-3 py-2 text-xs text-orange-800 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>
                    {t('clientDash.profile.docs.stripeRequiresAction', 'Stripe kerkon veprim shtese. Klikoni "Vazhdo verifikimin" me poshte per te perfunduar (psh re-upload i dokumenteve me cilesi me te mire).')}
                  </span>
                </div>
              )}
              {doc?.stripe_verification_status === 'canceled' && (
                <div className="mt-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-xs text-dark-600 flex items-start gap-2">
                  <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>
                    {t('clientDash.profile.docs.stripeCanceled', 'Verifikimi u anulua. Provoni perseri.')}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={async () => {
                  setStartingIdentity(true);
                  setMessage(null);
                  const { error } = await startIdentityVerification('/dashboard/profili');
                  if (error) {
                    setStartingIdentity(false);
                    setMessage({ type: 'error', text: error });
                  }
                }}
                disabled={startingIdentity || doc?.stripe_verification_status === 'processing'}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-all"
              >
                {startingIdentity
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <ExternalLink className="w-4 h-4" />}
                {doc?.stripe_verification_status === 'requires_action'
                  ? t('clientDash.profile.docs.continueStripeVerification', 'Vazhdo verifikimin')
                  : doc?.stripe_verification_status === 'canceled'
                    ? t('clientDash.profile.docs.retryStripeVerification', 'Riprovo verifikimin')
                    : t('clientDash.profile.docs.startStripeVerification', 'Verifiko tani')}
              </button>
            </div>
          </div>
        </div>
      )}

      {doc?.verified && doc?.verified_via === 'stripe_identity' && (
        <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          <span>{t('clientDash.profile.docs.stripeVerifiedBadge', 'Verifikuar nga Stripe Identity')} {doc?.stripe_verified_at && `· ${new Date(doc.stripe_verified_at).toLocaleDateString()}`}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <FileSlot
              label={t('clientDash.profile.docs.licenseFront')}
              url={doc?.license_front_url}
              uploading={uploading === 'license_front_url'}
              onFile={f => uploadFile('license_front_url', f)}
            />
            <FileSlot
              label={t('clientDash.profile.docs.licenseBack')}
              url={doc?.license_back_url}
              uploading={uploading === 'license_back_url'}
              onFile={f => uploadFile('license_back_url', f)}
            />
            <FileSlot
              label={t('clientDash.profile.docs.idDoc')}
              url={doc?.id_document_url}
              uploading={uploading === 'id_document_url'}
              onFile={f => uploadFile('id_document_url', f)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-dark-700 mb-1">{t('clientDash.profile.docs.licenseNumber')}</label>
              <input
                type="text"
                value={licenseNumber}
                onChange={e => setLicenseNumber(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-700 mb-1">{t('clientDash.profile.docs.licenseExpiry')}</label>
              <input
                type="date"
                value={licenseExpiry}
                onChange={e => setLicenseExpiry(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-xs font-medium text-dark-700 mb-1.5">{t('clientDash.profile.docs.licenseCategories')}</label>
            <div className="flex flex-wrap gap-2">
              {['A', 'B', 'C', 'D', 'BE', 'CE'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    licenseCategories.includes(cat)
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-dark-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-dark-700 mb-1">{t('clientDash.profile.docs.idType')}</label>
              <select
                value={idType}
                onChange={e => setIdType(e.target.value as 'passport' | 'national_id')}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              >
                <option value="national_id">{t('clientDash.profile.docs.nationalId')}</option>
                <option value="passport">{t('clientDash.profile.docs.passport')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-700 mb-1">{t('clientDash.profile.docs.idNumber')}</label>
              <input
                type="text"
                value={idNumber}
                onChange={e => setIdNumber(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={saveMetadata}
              disabled={saving}
              className="px-5 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('clientDash.profile.docs.save')}
            </button>
            {message && (
              <span className={`text-sm font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {message.text}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function FileSlot({ label, url, uploading, onFile }: { label: string; url: string | null | undefined; uploading: boolean; onFile: (f: File) => void }) {
  return (
    <label className="group relative block cursor-pointer">
      <div className={`aspect-[4/3] rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center p-3 transition-colors ${
        url ? 'border-green-300 bg-green-50/40' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
      }`}>
        {uploading ? (
          <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
        ) : url ? (
          <>
            <FileText className="w-6 h-6 text-green-600 mb-1" />
            <p className="text-xs font-semibold text-green-700 truncate max-w-full">{label}</p>
            <p className="text-[10px] text-green-600 mt-0.5">✓</p>
          </>
        ) : (
          <>
            <Upload className="w-6 h-6 text-dark-400 mb-1" />
            <p className="text-xs font-medium text-dark-600">{label}</p>
            <p className="text-[10px] text-dark-400 mt-0.5">JPG / PNG / PDF</p>
          </>
        )}
      </div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = '';
        }}
        className="absolute inset-0 opacity-0 cursor-pointer"
        disabled={uploading}
      />
    </label>
  );
}
