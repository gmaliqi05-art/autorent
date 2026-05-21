/**
 * 🔒 PROTECTED COMPONENT — DO NOT DELETE OR REVERT
 *
 * Komponent i ripërdorshëm për ngarkimin e imazheve në Supabase Storage.
 * Përdoret nga: CompanyVehicles, CompanySettings, AdminCreateAd, AdminAds,
 * AdminDailyOffers (dhe çdo formë tjetër që pranon imazh).
 *
 * Përparësi mbi URL input:
 *  - Imazhet ruhen vetë (jo lidhje që mund të vdesin)
 *  - Validim madhësie + lloji file
 *  - Preview menjëherë
 *  - RLS i Supabase mbron uploads
 */
import { useRef, useState } from 'react';
import { Upload, X, Loader2, ImagePlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';

interface ImageUploaderProps {
  /** URL ekzistuese (kur editohet) */
  value: string;
  /** Callback kur ngarkohet ose hiqet imazhi */
  onChange: (url: string) => void;
  /** Bucket-i ku ngarkohet (p.sh. 'vehicle-images', 'company-media', 'ad-images') */
  bucket: 'vehicle-images' | 'company-media' | 'ad-images' | 'homepage-media';
  /** Prefiks i path-it brenda bucket-it (p.sh. companyId, 'ads/', 'logos/') */
  pathPrefix?: string;
  /** Aspect ratio i preview-së ne tailwind (p.sh. 'aspect-video', 'aspect-square') */
  aspectRatio?: string;
  /** Label opsional */
  label?: string;
  /** Madhësia max ne MB (default 5) */
  maxSizeMB?: number;
  /** Lloji i imazheve te lejuara */
  accept?: string;
  /** Nese duhet butoni "Hiq" */
  allowRemove?: boolean;
  /** Tekst i butonit te ngarkimit kur s'ka imazh */
  emptyText?: string;
}

export default function ImageUploader({
  value,
  onChange,
  bucket,
  pathPrefix = '',
  aspectRatio = 'aspect-video',
  label,
  maxSizeMB = 5,
  accept = 'image/jpeg,image/png,image/webp',
  allowRemove = true,
  emptyText,
}: ImageUploaderProps) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const placeholderText = emptyText ?? t('uploader.emptyText');

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validim madhesia
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(t('uploader.sizeTooLarge', { size: maxSizeMB }));
      e.target.value = '';
      return;
    }

    // Validim lloji
    if (!accept.split(',').some((typ) => file.type === typ.trim())) {
      setError(t('uploader.invalidType'));
      e.target.value = '';
      return;
    }

    setUploading(true);

    // Krijo path unik
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const prefix = pathPrefix ? `${pathPrefix.replace(/\/$/, '')}/` : '';
    const path = `${prefix}${filename}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      e.target.value = '';
      return;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
    e.target.value = '';
  }

  async function handleRemove() {
    if (!value) return;
    // Provoj te fshij file-in nga storage (nese URL i takon ketij bucket-i)
    if (value.includes(`/storage/v1/object/public/${bucket}/`)) {
      const path = value.split(`/storage/v1/object/public/${bucket}/`)[1];
      if (path) {
        await supabase.storage.from(bucket).remove([path]).catch(() => {});
      }
    }
    onChange('');
  }

  return (
    <div>
      {label && (
        <label className="block text-xs font-semibold text-dark-600 uppercase tracking-wide mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        onChange={handleFile}
        className="hidden"
      />

      {value ? (
        <div className={`relative ${aspectRatio} bg-gray-100 rounded-xl overflow-hidden border border-gray-200 group`}>
          <img src={value} alt="" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-dark-950/0 group-hover:bg-dark-950/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-2 bg-white text-dark-900 text-xs font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50 shadow-lg"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploading ? t('common.uploading') : t('uploader.change')}
            </button>
            {allowRemove && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={uploading}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 disabled:opacity-50 shadow-lg"
              >
                <X className="w-3.5 h-3.5" />
                {t('common.remove')}
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className={`w-full ${aspectRatio} bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-dark-400 hover:border-primary-400 hover:bg-primary-50/30 hover:text-primary-600 transition-all disabled:opacity-50`}
        >
          {uploading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs font-medium">{t('common.uploading')}</span>
            </>
          ) : (
            <>
              <ImagePlus className="w-7 h-7" />
              <span className="text-xs font-medium">{placeholderText}</span>
              <span className="text-[10px] text-dark-400">{t('uploader.sizeNote', { size: maxSizeMB })}</span>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
