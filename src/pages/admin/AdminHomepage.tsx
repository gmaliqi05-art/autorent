import { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import {
  Save, Loader2, Globe, Image, Monitor, LayoutGrid, Eye,
  Upload, X, Check, ChevronDown, ChevronUp, RefreshCw, Palette,
  Type, AlignLeft, Link as LinkIcon, Car, Tag, Plus, Trash2, ArrowUp, ArrowDown
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import type { HeroSettings, LogoSettings, NavbarSettings, SectionsSettings } from '../../lib/types';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNavItems, adminNavGroups } from '../../lib/adminNav';
import { defaultHero, defaultLogo, defaultNavbar, defaultSections } from '../../lib/useHomepageSettings';
import { pickLocalized } from '../../lib/i18nHelpers';

/**
 * Disa fusha ne homepage_settings ruhen si objekte multilingual {sq, en, de}
 * (psh hero.subtitle, navbar.vehicles_link_text). React s'mund t'i render-oje
 * objekte si value te input-it -> CRASH.
 *
 * `normalizeLocalized()` i kthen ne stringa per editim ne gjuhen aktuale.
 * `mergeLocalized()` i kthen prap si objekte multilingual kur ruhen, duke
 * mbajtur vleren ne gjuhet e tjera.
 */
function normalizeLocalized<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && ('sq' in v || 'en' in v || 'de' in v)) {
      out[k] = pickLocalized(v as { sq?: string; en?: string; de?: string });
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

function mergeLocalized<T extends Record<string, unknown>>(
  edited: T,
  original: Partial<T>,
  lang: string,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(edited)) {
    const orig = original[k as keyof T];
    const newVal = edited[k];
    if (orig && typeof orig === 'object' && !Array.isArray(orig) && ('sq' in orig || 'en' in orig || 'de' in orig)) {
      out[k] = { ...(orig as object), [lang]: newVal };
    } else {
      out[k] = newVal;
    }
  }
  return out;
}

type Tab = 'hero' | 'logo' | 'navbar' | 'sections' | 'categories';

export default function AdminHomepage() {
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language || 'sq').slice(0, 2);

  const tabs: { id: Tab; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'hero', label: t('adminDash.homepage.tabHero'), icon: <Image className="w-4 h-4" />, desc: t('adminDash.homepage.tabHeroDesc') },
    { id: 'logo', label: t('adminDash.homepage.tabLogo'), icon: <Car className="w-4 h-4" />, desc: t('adminDash.homepage.tabLogoDesc') },
    { id: 'navbar', label: t('adminDash.homepage.tabNavbar'), icon: <Monitor className="w-4 h-4" />, desc: t('adminDash.homepage.tabNavbarDesc') },
    { id: 'sections', label: t('adminDash.homepage.tabSections'), icon: <LayoutGrid className="w-4 h-4" />, desc: t('adminDash.homepage.tabSectionsDesc') },
    { id: 'categories', label: t('adminDash.homepage.tabCategories'), icon: <Tag className="w-4 h-4" />, desc: t('adminDash.homepage.tabCategoriesDesc') },
  ];

  const [activeTab, setActiveTab] = useState<Tab>('hero');
  const [hero, setHero] = useState<HeroSettings>(defaultHero);
  const [logo, setLogo] = useState<LogoSettings>(defaultLogo);
  const [navbar, setNavbar] = useState<NavbarSettings>(defaultNavbar);
  const [sections, setSections] = useState<SectionsSettings>(defaultSections);
  // Ruajme te dhenat e papershtatura (me multilingual objects) per merge ne save
  const [rawData, setRawData] = useState<{
    hero: Record<string, unknown>;
    logo: Record<string, unknown>;
    navbar: Record<string, unknown>;
    sections: Record<string, unknown>;
  }>({ hero: {}, logo: {}, navbar: {}, sections: {} });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingHeroMobile, setUploadingHeroMobile] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const heroFileRef = useRef<HTMLInputElement | null>(null);
  const heroMobileFileRef = useRef<HTMLInputElement | null>(null);
  const logoFileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => { loadAll();   }, [currentLang]);

  async function loadAll() {
    const { data } = await supabase.from('homepage_settings').select('key, value');
    if (data) {
      const raw = { hero: {}, logo: {}, navbar: {}, sections: {} } as typeof rawData;
      for (const row of data) {
        const v = (row.value || {}) as Record<string, unknown>;
        if (row.key === 'hero') {
          raw.hero = v;
          setHero({ ...defaultHero, ...normalizeLocalized(v) } as HeroSettings);
        }
        if (row.key === 'logo') {
          raw.logo = v;
          setLogo({ ...defaultLogo, ...normalizeLocalized(v) } as LogoSettings);
        }
        if (row.key === 'navbar') {
          raw.navbar = v;
          setNavbar({ ...defaultNavbar, ...normalizeLocalized(v) } as NavbarSettings);
        }
        if (row.key === 'sections') {
          raw.sections = v;
          setSections({ ...defaultSections, ...normalizeLocalized(v) } as SectionsSettings);
        }
      }
      setRawData(raw);
    }
    setLoading(false);
  }

  const [saveError, setSaveError] = useState<string | null>(null);

  async function saveTab() {
    setSaving(true);
    setSaveError(null);
    const key = activeTab as string;
    let value: Record<string, unknown> = {};
    if (activeTab === 'hero') value = mergeLocalized(hero as unknown as Record<string, unknown>, rawData.hero, currentLang);
    if (activeTab === 'logo') value = mergeLocalized(logo as unknown as Record<string, unknown>, rawData.logo, currentLang);
    if (activeTab === 'navbar') value = mergeLocalized(navbar as unknown as Record<string, unknown>, rawData.navbar, currentLang);
    if (activeTab === 'sections') value = mergeLocalized(sections as unknown as Record<string, unknown>, rawData.sections, currentLang);

    const { error } = await supabase.from('homepage_settings').upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );
    setSaving(false);
    if (error) {
      setSaveError(error.message);
      return;
    }
    // Update raw cache me valuet e reja
    setRawData((prev) => ({ ...prev, [key]: value }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function uploadFile(file: File, path: string): Promise<string | null> {
    const { error } = await supabase.storage.from('homepage-media').upload(path, file, { upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from('homepage-media').getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleHeroImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingHero(true);
    const url = await uploadFile(file, `hero/${Date.now()}-${file.name}`);
    if (url) setHero(h => ({ ...h, image_url: url }));
    setUploadingHero(false);
  }

  async function handleHeroMobileImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingHeroMobile(true);
    const url = await uploadFile(file, `hero/mobile-${Date.now()}-${file.name}`);
    if (url) setHero(h => ({ ...h, image_url_mobile: url }));
    setUploadingHeroMobile(false);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const url = await uploadFile(file, `logo/${Date.now()}-${file.name}`);
    if (url) setLogo(l => ({ ...l, logo_url: url }));
    setUploadingLogo(false);
  }

  const inputClass = 'w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-dark-900 placeholder:text-dark-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all';
  const labelClass = 'block text-xs font-semibold text-dark-600 uppercase tracking-wide mb-1.5';

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
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-dark-950">{t('adminDash.homepage.title')}</h1>
          <p className="text-dark-500 mt-1 text-[15px]">
            {t('adminDash.homepage.subtitle')}
          </p>
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
            <Globe className="w-3.5 h-3.5 text-amber-700" />
            <span
              className="text-xs text-amber-800"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t('adminDash.homepage.editingLanguage', { lang: currentLang.toUpperCase() }), { ALLOWED_TAGS: ['strong', 'em', 'b'], ALLOWED_ATTR: [] }) }}
            />
          </div>
        </div>
        {activeTab !== 'categories' && (
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={saveTab}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all text-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? t('adminDash.homepage.saving') : saved ? t('adminDash.homepage.savedShort') : t('adminDash.homepage.saveChanges')}
            </button>
            {saveError && (
              <p className="text-xs text-red-600 max-w-xs text-right">{t('adminDash.homepage.saveError', { msg: saveError })}</p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden sticky top-[88px]">
            <div className="p-4 border-b border-gray-100">
              <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">{t('adminDash.homepage.sectionsLabel')}</p>
            </div>
            <div className="p-2 space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-start gap-3 px-3 py-3 rounded-xl transition-all text-left ${activeTab === tab.id ? 'bg-primary-50 text-primary-700' : 'text-dark-600 hover:bg-gray-50'}`}
                >
                  <span className={`mt-0.5 shrink-0 ${activeTab === tab.id ? 'text-primary-600' : 'text-dark-400'}`}>{tab.icon}</span>
                  <div>
                    <p className={`text-sm font-semibold ${activeTab === tab.id ? 'text-primary-700' : 'text-dark-700'}`}>{tab.label}</p>
                    <p className="text-xs text-dark-400 mt-0.5 leading-tight">{tab.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'hero' && (
            <HeroEditor
              hero={hero}
              setHero={setHero}
              uploadingHero={uploadingHero}
              heroFileRef={heroFileRef}
              onUpload={handleHeroImageUpload}
              uploadingHeroMobile={uploadingHeroMobile}
              heroMobileFileRef={heroMobileFileRef}
              onUploadMobile={handleHeroMobileImageUpload}
              inputClass={inputClass}
              labelClass={labelClass}
            />
          )}
          {activeTab === 'logo' && (
            <LogoEditor
              logo={logo}
              setLogo={setLogo}
              uploadingLogo={uploadingLogo}
              logoFileRef={logoFileRef}
              onUpload={handleLogoUpload}
              inputClass={inputClass}
              labelClass={labelClass}
            />
          )}
          {activeTab === 'navbar' && (
            <NavbarEditor
              navbar={navbar}
              setNavbar={setNavbar}
              inputClass={inputClass}
              labelClass={labelClass}
            />
          )}
          {activeTab === 'sections' && (
            <SectionsEditor
              sections={sections}
              setSections={setSections}
              inputClass={inputClass}
              labelClass={labelClass}
            />
          )}
          {activeTab === 'categories' && (
            <CategoriesEditor inputClass={inputClass} labelClass={labelClass} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-primary-600">{icon}</span>
          <h3 className="font-semibold text-dark-950 text-sm">{title}</h3>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-dark-400" /> : <ChevronDown className="w-4 h-4 text-dark-400" />}
      </button>
      {open && <div className="px-6 pb-6 pt-2 border-t border-gray-100">{children}</div>}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group select-none">
      <div
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative rounded-full transition-colors cursor-pointer shrink-0 ${checked ? 'bg-primary-600' : 'bg-gray-300'}`}
        style={{ width: '38px', height: '22px' }}
      >
        <span
          className={`absolute top-[2px] rounded-full bg-white shadow transition-transform`}
          style={{ width: '18px', height: '18px', left: '2px', transform: checked ? 'translateX(16px)' : 'translateX(0)' }}
        />
      </div>
      <span className="text-sm text-dark-700 group-hover:text-dark-900">{label}</span>
    </label>
  );
}

interface HeroEditorProps {
  hero: HeroSettings;
  setHero: React.Dispatch<React.SetStateAction<HeroSettings>>;
  uploadingHero: boolean;
  heroFileRef: React.RefObject<HTMLInputElement | null>;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingHeroMobile: boolean;
  heroMobileFileRef: React.RefObject<HTMLInputElement | null>;
  onUploadMobile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputClass: string;
  labelClass: string;
}

function HeroEditor({ hero, setHero, uploadingHero, heroFileRef, onUpload, uploadingHeroMobile, heroMobileFileRef, onUploadMobile, inputClass, labelClass }: HeroEditorProps) {
  const { t } = useTranslation();
  function set(field: keyof HeroSettings) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const val = e.target.type === 'range' || e.target.type === 'number' ? Number(e.target.value) : e.target.value;
      setHero(h => ({ ...h, [field]: val }));
    };
  }

  return (
    <div className="space-y-5">
      <SectionCard title={t('adminDash.homepage.heroBackgroundImage')} icon={<Image className="w-4 h-4" />}>
        <div className="space-y-4">
          {hero.image_url ? (
            <div className="relative rounded-xl overflow-hidden bg-gray-100 mb-3" style={{ aspectRatio: '21/9' }}>
              <img src={hero.image_url} alt="Hero" className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-dark-950/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <button
                  onClick={() => heroFileRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-dark-900 rounded-xl text-sm font-semibold"
                >
                  <Upload className="w-4 h-4" />
                  {t('adminDash.homepage.changeImage')}
                </button>
              </div>
              <button
                onClick={() => setHero(h => ({ ...h, image_url: '' }))}
                className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center bg-gray-50 mb-3">
              <Image className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-dark-500">{t('adminDash.homepage.noImageUploaded')}</p>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => heroFileRef.current?.click()}
              disabled={uploadingHero}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all shrink-0"
            >
              {uploadingHero ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploadingHero ? t('adminDash.homepage.uploading') : t('adminDash.homepage.uploadPhoto')}
            </button>
            <input ref={heroFileRef as React.LegacyRef<HTMLInputElement>} type="file" accept="image/*" className="hidden" onChange={onUpload} />
            <input
              type="text"
              value={hero.image_url}
              onChange={set('image_url')}
              placeholder={t('adminDash.homepage.orEnterImageUrl')}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t('adminDash.homepage.overlayOpacity', { value: hero.overlay_opacity })}</label>
            <input
              type="range"
              min={0}
              max={95}
              value={hero.overlay_opacity}
              onChange={set('overlay_opacity')}
              className="w-full accent-primary-600"
            />
            <div className="flex justify-between text-xs text-dark-400 mt-1">
              <span>{t('adminDash.homepage.overlayMin')}</span>
              <span>{t('adminDash.homepage.overlayMax')}</span>
            </div>
          </div>
          <div>
            <label className={labelClass}>{t('adminDash.homepage.imagePositionDesktop')}</label>
            <select
              value={hero.image_position_desktop || 'center'}
              onChange={(e) => setHero(h => ({ ...h, image_position_desktop: e.target.value }))}
              className={inputClass}
            >
              <option value="center">{t('adminDash.homepage.posCenter')}</option>
              <option value="left">{t('adminDash.homepage.posLeft')}</option>
              <option value="right">{t('adminDash.homepage.posRight')}</option>
              <option value="top">{t('adminDash.homepage.posTop')}</option>
              <option value="bottom">{t('adminDash.homepage.posBottom')}</option>
              <option value="30% center">{t('adminDash.homepage.pos30Left')}</option>
              <option value="70% center">{t('adminDash.homepage.pos70Left')}</option>
            </select>
          </div>
        </div>
      </SectionCard>

      <SectionCard title={t('adminDash.homepage.mobileImageTitle')} icon={<Image className="w-4 h-4" />}>
        <div className="space-y-4">
          <p className="text-xs text-dark-500 -mt-1">{t('adminDash.homepage.mobileImageDesc')}</p>
          {hero.image_url_mobile ? (
            <div className="relative rounded-xl overflow-hidden bg-gray-100 mb-3 mx-auto" style={{ aspectRatio: '9/16', maxWidth: '220px' }}>
              <img src={hero.image_url_mobile} alt="Hero Mobile" className="w-full h-full object-cover" style={{ objectPosition: hero.image_position_mobile || '70% center' }} loading="lazy" />
              <div className="absolute inset-0 bg-dark-950/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <button
                  onClick={() => heroMobileFileRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white text-dark-900 rounded-xl text-xs font-semibold"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {t('adminDash.homepage.change')}
                </button>
              </div>
              <button
                onClick={() => setHero(h => ({ ...h, image_url_mobile: '' }))}
                className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50 mb-3">
              <Image className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-dark-500">{t('adminDash.homepage.noMobilePhoto')}</p>
              <p className="text-xs text-dark-400 mt-1">{t('adminDash.homepage.noMobilePhotoDesc')}</p>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => heroMobileFileRef.current?.click()}
              disabled={uploadingHeroMobile}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all shrink-0"
            >
              {uploadingHeroMobile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploadingHeroMobile ? t('adminDash.homepage.uploading') : t('adminDash.homepage.uploadMobilePhoto')}
            </button>
            <input ref={heroMobileFileRef as React.LegacyRef<HTMLInputElement>} type="file" accept="image/*" className="hidden" onChange={onUploadMobile} />
            <input
              type="text"
              value={hero.image_url_mobile || ''}
              onChange={(e) => setHero(h => ({ ...h, image_url_mobile: e.target.value }))}
              placeholder={t('adminDash.homepage.orEnterImageUrl')}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t('adminDash.homepage.imagePositionMobile')}</label>
            <select
              value={hero.image_position_mobile || '70% center'}
              onChange={(e) => setHero(h => ({ ...h, image_position_mobile: e.target.value }))}
              className={inputClass}
            >
              <option value="center">{t('adminDash.homepage.posCenter')}</option>
              <option value="left">{t('adminDash.homepage.posLeft')}</option>
              <option value="right">{t('adminDash.homepage.posRight')}</option>
              <option value="top">{t('adminDash.homepage.posTop')}</option>
              <option value="bottom">{t('adminDash.homepage.posBottom')}</option>
              <option value="30% center">{t('adminDash.homepage.pos30Left')}</option>
              <option value="50% center">{t('adminDash.homepage.pos50Center')}</option>
              <option value="70% center">{t('adminDash.homepage.pos70LeftRecommended')}</option>
              <option value="center top">{t('adminDash.homepage.posCenterTop')}</option>
              <option value="center bottom">{t('adminDash.homepage.posCenterBottom')}</option>
            </select>
            <p className="text-xs text-dark-400 mt-1.5">{t('adminDash.homepage.mobilePositionHelp')}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title={t('adminDash.homepage.titleSubtitleSection')} icon={<Type className="w-4 h-4" />}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t('adminDash.homepage.titleLine1')}</label>
              <input type="text" value={hero.title_line1} onChange={set('title_line1')} className={inputClass} placeholder={t('adminDash.homepage.titleLine1Placeholder')} />
            </div>
            <div>
              <label className={labelClass}>{t('adminDash.homepage.titleLine2')}</label>
              <input type="text" value={hero.title_line2} onChange={set('title_line2')} className={inputClass} placeholder={t('adminDash.homepage.titleLine2Placeholder')} />
            </div>
          </div>
          <div>
            <label className={labelClass}>{t('adminDash.homepage.subtitleLabel')}</label>
            <textarea value={hero.subtitle} onChange={set('subtitle')} rows={3} className={inputClass + ' resize-none'} />
          </div>
          <div>
            <label className={labelClass}>{t('adminDash.homepage.badgeTextLabel')}</label>
            <input type="text" value={hero.badge_text} onChange={set('badge_text')} className={inputClass} placeholder={t('adminDash.homepage.badgePlaceholder')} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title={t('adminDash.homepage.searchFormSection')} icon={<AlignLeft className="w-4 h-4" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{t('adminDash.homepage.placeholderCity')}</label>
            <input type="text" value={hero.search_label_city} onChange={set('search_label_city')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t('adminDash.homepage.labelPickupDate')}</label>
            <input type="text" value={hero.search_label_pickup} onChange={set('search_label_pickup')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t('adminDash.homepage.labelReturnDate')}</label>
            <input type="text" value={hero.search_label_return} onChange={set('search_label_return')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t('adminDash.homepage.searchButtonText')}</label>
            <input type="text" value={hero.search_button_text} onChange={set('search_button_text')} className={inputClass} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title={t('adminDash.homepage.trustBadgesSection')} icon={<Globe className="w-4 h-4" />}>
        <div className="space-y-4">
          <Toggle
            checked={hero.show_trust_badges}
            onChange={v => setHero(h => ({ ...h, show_trust_badges: v }))}
            label={t('adminDash.homepage.showTrustBadges')}
          />
          {hero.show_trust_badges && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className={labelClass}>{t('adminDash.homepage.badge1Checkmark')}</label>
                <input type="text" value={hero.trust_badge_1} onChange={set('trust_badge_1')} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('adminDash.homepage.badge2Shield')}</label>
                <input type="text" value={hero.trust_badge_2} onChange={set('trust_badge_2')} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('adminDash.homepage.badge3Clock')}</label>
                <input type="text" value={hero.trust_badge_3} onChange={set('trust_badge_3')} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('adminDash.homepage.badge4Heart')}</label>
                <input type="text" value={hero.trust_badge_4} onChange={set('trust_badge_4')} className={inputClass} />
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      <div className="bg-dark-950 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/10">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wide">{t('adminDash.homepage.heroPreviewLabel')}</p>
        </div>
        <div className="relative" style={{ height: '220px' }}>
          {hero.image_url && (
            <img src={hero.image_url} alt="Preview" className="w-full h-full object-cover" loading="lazy" />
          )}
          <div className="absolute inset-0" style={{ background: `rgba(5,5,15,${hero.overlay_opacity / 100})` }} />
          <div className="absolute inset-0 flex flex-col justify-center px-8">
            {hero.badge_text && (
              <span className="inline-block w-fit text-xs font-semibold bg-primary-600/90 text-white px-3 py-1 rounded-full mb-3">
                {hero.badge_text}
              </span>
            )}
            <h1 className="text-2xl font-extrabold text-white leading-tight">
              {hero.title_line1 || t('adminDash.homepage.previewTitleLine1')}
              <br />
              <span className="gradient-text">{hero.title_line2 || t('adminDash.homepage.previewTitleLine2')}</span>
            </h1>
            <p className="text-white/70 text-sm mt-2 max-w-sm">{hero.subtitle}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface LogoEditorProps {
  logo: LogoSettings;
  setLogo: React.Dispatch<React.SetStateAction<LogoSettings>>;
  uploadingLogo: boolean;
  logoFileRef: React.RefObject<HTMLInputElement | null>;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputClass: string;
  labelClass: string;
}

function LogoEditor({ logo, setLogo, uploadingLogo, logoFileRef, onUpload, inputClass, labelClass }: LogoEditorProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-5">
      <SectionCard title={t('adminDash.homepage.logoSectionTitle')} icon={<Car className="w-4 h-4" />}>
        <div className="space-y-5">
          <div className="flex items-start gap-6 flex-wrap sm:flex-nowrap">
            <div className="shrink-0">
              <p className={labelClass}>{t('adminDash.homepage.currentLogo')}</p>
              <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden relative group">
                {logo.logo_url ? (
                  <>
                    <img src={logo.logo_url} alt="Logo" className="w-full h-full object-contain p-3" loading="lazy" />
                    <button
                      onClick={() => setLogo(l => ({ ...l, logo_url: '' }))}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <Car className="w-8 h-8 text-gray-300 mx-auto mb-1.5" />
                    <p className="text-xs text-gray-400">{t('adminDash.homepage.noLogo')}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 space-y-3 min-w-0">
              <div>
                <button
                  onClick={() => logoFileRef.current?.click()}
                  disabled={uploadingLogo}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all"
                >
                  {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploadingLogo ? t('adminDash.homepage.uploading') : t('adminDash.homepage.uploadLogo')}
                </button>
                <input ref={logoFileRef as React.LegacyRef<HTMLInputElement>} type="file" accept="image/*" className="hidden" onChange={onUpload} />
                <p className="text-xs text-dark-400 mt-1.5">{t('adminDash.homepage.logoUploadHint')}</p>
              </div>
              <div>
                <label className={labelClass}>{t('adminDash.homepage.orLogoUrl')}</label>
                <input
                  type="text"
                  value={logo.logo_url}
                  onChange={e => setLogo(l => ({ ...l, logo_url: e.target.value }))}
                  placeholder="https://..."
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('adminDash.homepage.siteNameLabel')}</label>
            <input
              type="text"
              value={logo.site_name}
              onChange={e => setLogo(l => ({ ...l, site_name: e.target.value }))}
              className={inputClass}
              placeholder="RentaKar"
            />
          </div>

          <div className="flex flex-col gap-3 pt-1">
            <Toggle
              checked={logo.show_icon}
              onChange={v => setLogo(l => ({ ...l, show_icon: v }))}
              label={t('adminDash.homepage.showIcon')}
            />
            <Toggle
              checked={logo.show_text}
              onChange={v => setLogo(l => ({ ...l, show_text: v }))}
              label={t('adminDash.homepage.showText')}
            />
          </div>
        </div>
      </SectionCard>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-xs font-semibold text-dark-600 uppercase tracking-wide mb-4">{t('adminDash.homepage.navbarPreview')}</p>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-dark-400 mb-1.5">{t('adminDash.homepage.previewTransparent')}</p>
            <div className="bg-dark-950 rounded-xl px-5 py-3 flex items-center gap-2.5">
              {logo.show_icon && (
                logo.logo_url ? (
                  <img src={logo.logo_url} alt="Logo" className="w-7 h-7 object-contain" loading="lazy" />
                ) : (
                  <div className="p-1.5 rounded-lg bg-white/10">
                    <Car className="w-4 h-4 text-white" />
                  </div>
                )
              )}
              {logo.show_text && (
                <span className="text-white font-bold text-base">{logo.site_name || 'RentaKar'}</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-dark-400 mb-1.5">{t('adminDash.homepage.previewWhite')}</p>
            <div className="bg-white border border-gray-200 rounded-xl px-5 py-3 flex items-center gap-2.5">
              {logo.show_icon && (
                logo.logo_url ? (
                  <img src={logo.logo_url} alt="Logo" className="w-7 h-7 object-contain" loading="lazy" />
                ) : (
                  <div className="p-1.5 rounded-lg bg-primary-600">
                    <Car className="w-4 h-4 text-white" />
                  </div>
                )
              )}
              {logo.show_text && (
                <span className="text-dark-950 font-bold text-base">{logo.site_name || 'RentaKar'}</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-dark-400 mb-1.5">{t('adminDash.homepage.previewFooter')}</p>
            <div className="bg-dark-950 rounded-xl px-5 py-3 flex items-center gap-2.5">
              {logo.show_icon && (
                logo.logo_url ? (
                  <img src={logo.logo_url} alt="Logo" className="w-6 h-6 object-contain" loading="lazy" />
                ) : (
                  <div className="p-1.5 rounded-lg bg-primary-600">
                    <Car className="w-4 h-4 text-white" />
                  </div>
                )
              )}
              {logo.show_text && (
                <span className="text-white font-bold text-base">{logo.site_name || 'RentaKar'}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface NavbarEditorProps {
  navbar: NavbarSettings;
  setNavbar: React.Dispatch<React.SetStateAction<NavbarSettings>>;
  inputClass: string;
  labelClass: string;
}

function NavbarEditor({ navbar, setNavbar, inputClass, labelClass }: NavbarEditorProps) {
  const { t } = useTranslation();
  const btnColors: { value: string; label: string; cls: string }[] = [
    { value: 'primary', label: t('adminDash.homepage.colorPrimary'), cls: 'bg-primary-600 text-white' },
    { value: 'dark', label: t('adminDash.homepage.colorDark'), cls: 'bg-dark-950 text-white' },
    { value: 'accent', label: t('adminDash.homepage.colorAccent'), cls: 'bg-accent-600 text-white' },
    { value: 'green', label: t('adminDash.homepage.colorGreen'), cls: 'bg-green-600 text-white' },
  ];

  return (
    <div className="space-y-5">
      <SectionCard title={t('adminDash.homepage.navLinksSection')} icon={<LinkIcon className="w-4 h-4" />}>
        <div className="space-y-4">
          <Toggle
            checked={navbar.show_vehicles_link}
            onChange={v => setNavbar(n => ({ ...n, show_vehicles_link: v }))}
            label={t('adminDash.homepage.showVehiclesLink')}
          />
          {navbar.show_vehicles_link && (
            <div>
              <label className={labelClass}>{t('adminDash.homepage.linkText')}</label>
              <input
                type="text"
                value={navbar.vehicles_link_text}
                onChange={e => setNavbar(n => ({ ...n, vehicles_link_text: e.target.value }))}
                className={inputClass}
              />
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title={t('adminDash.homepage.authButtonsSection')} icon={<Palette className="w-4 h-4" />}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t('adminDash.homepage.loginButtonText')}</label>
              <input
                type="text"
                value={navbar.login_button_text}
                onChange={e => setNavbar(n => ({ ...n, login_button_text: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t('adminDash.homepage.registerButtonText')}</label>
              <input
                type="text"
                value={navbar.register_button_text}
                onChange={e => setNavbar(n => ({ ...n, register_button_text: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>{t('adminDash.homepage.registerButtonColor')}</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {btnColors.map(c => (
                <button
                  key={c.value}
                  onClick={() => setNavbar(n => ({ ...n, register_button_color: c.value }))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${navbar.register_button_color === c.value ? 'border-primary-600 ring-2 ring-primary-600/20' : 'border-transparent'} ${c.cls}`}
                >
                  {navbar.register_button_color === c.value && <Check className="w-3 h-3" />}
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="bg-dark-950 rounded-2xl p-5">
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-3">{t('adminDash.homepage.navbarPreviewLabel')}</p>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-white/10">
              <Car className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-sm">RentaKar</span>
          </div>
          <div className="flex items-center gap-1.5">
            {navbar.show_vehicles_link && (
              <span className="text-white/80 text-xs font-medium px-3 py-1.5 bg-white/10 rounded-lg">
                {navbar.vehicles_link_text || 'Automjetet'}
              </span>
            )}
            <span className="text-white/80 text-xs font-medium px-3 py-1.5">
              {navbar.login_button_text || 'Kycu'}
            </span>
            <span className={`text-white text-xs font-semibold px-3 py-1.5 rounded-lg ${
              navbar.register_button_color === 'dark' ? 'bg-white text-dark-950' :
              navbar.register_button_color === 'accent' ? 'bg-accent-600' :
              navbar.register_button_color === 'green' ? 'bg-green-600' :
              'bg-primary-600'
            }`}>
              {navbar.register_button_text || 'Regjistrohu'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SectionsEditorProps {
  sections: SectionsSettings;
  setSections: React.Dispatch<React.SetStateAction<SectionsSettings>>;
  inputClass: string;
  labelClass: string;
}

function SectionsEditor({ sections, setSections, inputClass }: SectionsEditorProps) {
  const { t } = useTranslation();
  const sectionItems: { key: keyof SectionsSettings; label: string; titleKey?: keyof SectionsSettings; subtitleKey?: keyof SectionsSettings }[] = [
    { key: 'show_categories', label: t('adminDash.homepage.sectionCategories'), titleKey: 'categories_title', subtitleKey: 'categories_subtitle' },
    { key: 'show_featured', label: t('adminDash.homepage.sectionFeatured'), titleKey: 'featured_title', subtitleKey: 'featured_subtitle' },
    { key: 'show_how_it_works', label: t('adminDash.homepage.sectionHowItWorks') },
    { key: 'show_testimonials', label: t('adminDash.homepage.sectionTestimonials') },
    { key: 'show_company_cta', label: t('adminDash.homepage.sectionCompanyCta') },
    { key: 'show_trust_banner', label: t('adminDash.homepage.sectionTrustBanner') },
  ];

  return (
    <div className="space-y-5">
      <SectionCard title={t('adminDash.homepage.sectionsVisibility')} icon={<Eye className="w-4 h-4" />}>
        <div className="space-y-3">
          {sectionItems.map(item => (
            <div key={item.key} className="bg-gray-50 rounded-xl p-4">
              <Toggle
                checked={sections[item.key] as boolean}
                onChange={v => setSections(s => ({ ...s, [item.key]: v }))}
                label={item.label}
              />
              {item.titleKey && item.subtitleKey && sections[item.key] && (() => {
                const titleKey = item.titleKey as keyof SectionsSettings;
                const subtitleKey = item.subtitleKey as keyof SectionsSettings;
                return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 ml-12">
                  <div>
                    <label className="block text-xs font-medium text-dark-500 mb-1">{t('adminDash.homepage.mainTitle')}</label>
                    <input
                      type="text"
                      value={String(sections[titleKey] ?? '')}
                      onChange={e => setSections(s => ({ ...s, [titleKey]: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-dark-500 mb-1">{t('adminDash.homepage.subtitleBadge')}</label>
                    <input
                      type="text"
                      value={String(sections[subtitleKey] ?? '')}
                      onChange={e => setSections(s => ({ ...s, [subtitleKey]: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                </div>
                );
              })()}
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="bg-primary-50 border border-primary-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <RefreshCw className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-primary-800">{t('adminDash.homepage.changesNoticeTitle')}</p>
            <p className="text-xs text-primary-700 mt-1">{t('adminDash.homepage.changesNoticeDesc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

type CategoryRow = {
  key: string;
  sort_order: number;
  is_active: boolean;
  image_url: string;
  label_sq: string;
  label_en: string;
  label_de: string;
  default_min_price: number;
  vehicle_count?: number;
};

function CategoriesEditor({ inputClass, labelClass }: { inputClass: string; labelClass: string }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newRow, setNewRow] = useState<CategoryRow>({
    key: '', sort_order: 99, is_active: true, image_url: '',
    label_sq: '', label_en: '', label_de: '', default_min_price: 0,
  });

  useEffect(() => { loadRows(); }, []);

  async function loadRows() {
    setLoading(true);
    const { data } = await supabase
      .from('vehicle_categories_with_stats')
      .select('*')
      .order('sort_order', { ascending: true });
    setRows((data || []) as CategoryRow[]);
    setLoading(false);
  }

  function update(idx: number, patch: Partial<CategoryRow>) {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, ...patch } : r));
  }

  async function saveRow(row: CategoryRow) {
    setSaving(row.key);
    setError(null);
    const { data, error: err } = await supabase
      .from('vehicle_categories')
      .update({
        sort_order: row.sort_order,
        is_active: row.is_active,
        image_url: row.image_url,
        label_sq: row.label_sq,
        label_en: row.label_en,
        label_de: row.label_de,
        default_min_price: row.default_min_price,
        updated_at: new Date().toISOString(),
      })
      .eq('key', row.key)
      .select();
    setSaving(null);
    if (err) {
      setError(err.message);
      return;
    }
    if (!data || data.length === 0) {
      setError(t('adminDash.homepage.noRowUpdated'));
      return;
    }
    setSavedKey(row.key);
    setTimeout(() => setSavedKey(null), 2000);
    loadRows();
  }

  async function moveRow(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= rows.length) return;
    const a = rows[idx], b = rows[target];
    setError(null);
    const [r1, r2] = await Promise.all([
      supabase.from('vehicle_categories').update({ sort_order: b.sort_order }).eq('key', a.key).select(),
      supabase.from('vehicle_categories').update({ sort_order: a.sort_order }).eq('key', b.key).select(),
    ]);
    if (r1.error || r2.error) {
      setError((r1.error || r2.error)!.message);
      return;
    }
    loadRows();
  }

  async function deleteRow(key: string) {
    if (!confirm(t('adminDash.homepage.confirmDeleteCategory', { key }))) return;
    setError(null);
    const { error: err } = await supabase.from('vehicle_categories').delete().eq('key', key);
    if (err) setError(err.message);
    else loadRows();
  }

  async function addRow() {
    const key = newRow.key.trim().toLowerCase();
    if (!key || !/^[a-z0-9_]+$/.test(key)) {
      setError(t('adminDash.homepage.keyValidationError'));
      return;
    }
    setError(null);
    const { error: err } = await supabase.from('vehicle_categories').insert({
      key,
      sort_order: newRow.sort_order || rows.length + 1,
      is_active: newRow.is_active,
      image_url: newRow.image_url,
      label_sq: newRow.label_sq || key,
      label_en: newRow.label_en || newRow.label_sq || key,
      label_de: newRow.label_de || newRow.label_sq || key,
      default_min_price: newRow.default_min_price,
    });
    if (err) {
      setError(err.message);
      return;
    }
    setShowAdd(false);
    setNewRow({ key: '', sort_order: 99, is_active: true, image_url: '', label_sq: '', label_en: '', label_de: '', default_min_price: 0 });
    loadRows();
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <h2 className="text-lg font-bold text-dark-950">{t('adminDash.homepage.categoriesTitle')}</h2>
            <p className="text-sm text-dark-500 mt-1">{t('adminDash.homepage.categoriesSubtitle')}</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            {t('adminDash.homepage.addCategory')}
          </button>
        </div>
        {error && (
          <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>
        )}
      </div>

      {showAdd && (
        <div className="bg-white rounded-2xl border border-primary-200 p-6 space-y-4">
          <h3 className="text-sm font-bold text-dark-950">{t('adminDash.homepage.newCategory')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t('adminDash.homepage.keyLabel')}</label>
              <input className={inputClass} value={newRow.key} onChange={e => setNewRow({ ...newRow, key: e.target.value })} placeholder={t('adminDash.homepage.keyPlaceholder')} />
            </div>
            <div>
              <label className={labelClass}>{t('adminDash.homepage.imageUrl')}</label>
              <input className={inputClass} value={newRow.image_url} onChange={e => setNewRow({ ...newRow, image_url: e.target.value })} placeholder="https://" />
            </div>
            <div>
              <label className={labelClass}>{t('adminDash.homepage.nameSq')}</label>
              <input className={inputClass} value={newRow.label_sq} onChange={e => setNewRow({ ...newRow, label_sq: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>{t('adminDash.homepage.nameEn')}</label>
              <input className={inputClass} value={newRow.label_en} onChange={e => setNewRow({ ...newRow, label_en: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>{t('adminDash.homepage.nameDe')}</label>
              <input className={inputClass} value={newRow.label_de} onChange={e => setNewRow({ ...newRow, label_de: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>{t('adminDash.homepage.defaultMinPrice')}</label>
              <input type="number" className={inputClass} value={newRow.default_min_price} onChange={e => setNewRow({ ...newRow, default_min_price: Number(e.target.value) })} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={addRow} className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700">{t('adminDash.homepage.saveBtn')}</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-100 text-dark-700 text-sm font-semibold rounded-xl hover:bg-gray-200">{t('adminDash.homepage.cancelBtn')}</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {rows.map((row, idx) => (
          <div key={row.key} className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-start gap-4">
              <div className="w-24 h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                {row.image_url && <img src={row.image_url} alt={row.label_sq} className="w-full h-full object-cover" loading="lazy" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <code className="text-xs font-mono px-2 py-0.5 bg-gray-100 text-dark-700 rounded">{row.key}</code>
                  <span className="text-xs text-dark-500">{t('adminDash.homepage.publishedVehiclesCount', { count: row.vehicle_count || 0 })}</span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-dark-700">
                    <input
                      type="checkbox"
                      checked={row.is_active}
                      onChange={e => update(idx, { is_active: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    {t('adminDash.homepage.activeLabel')}
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className={labelClass}>{t('adminDash.homepage.langSq')}</label>
                    <input className={inputClass} value={row.label_sq} onChange={e => update(idx, { label_sq: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>{t('adminDash.homepage.langEn')}</label>
                    <input className={inputClass} value={row.label_en} onChange={e => update(idx, { label_en: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>{t('adminDash.homepage.langDe')}</label>
                    <input className={inputClass} value={row.label_de} onChange={e => update(idx, { label_de: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className={labelClass}>{t('adminDash.homepage.imageUrl')}</label>
                    <input className={inputClass} value={row.image_url} onChange={e => update(idx, { image_url: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>{t('adminDash.homepage.defaultMinPriceShort')}</label>
                    <input type="number" className={inputClass} value={row.default_min_price} onChange={e => update(idx, { default_min_price: Number(e.target.value) })} />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  onClick={() => moveRow(idx, -1)}
                  disabled={idx === 0}
                  className="p-2 rounded-lg bg-gray-50 text-dark-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  title={t('adminDash.homepage.moveUp')}
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveRow(idx, 1)}
                  disabled={idx === rows.length - 1}
                  className="p-2 rounded-lg bg-gray-50 text-dark-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  title={t('adminDash.homepage.moveDown')}
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteRow(row.key)}
                  className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                  title={t('adminDash.homepage.deleteTooltip')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => saveRow(row)}
                disabled={saving === row.key}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50"
              >
                {saving === row.key ? <Loader2 className="w-4 h-4 animate-spin" /> : savedKey === row.key ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {savedKey === row.key ? t('adminDash.homepage.savedBtn') : t('adminDash.homepage.saveCategory')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
