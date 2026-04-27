import { useState, useEffect, useRef } from 'react';
import {
  Save, Loader2, Globe, Image, Monitor, LayoutGrid, Eye,
  Upload, X, Check, ChevronDown, ChevronUp, RefreshCw, Palette,
  Type, AlignLeft, Link as LinkIcon, Car
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { HeroSettings, LogoSettings, NavbarSettings, SectionsSettings } from '../../lib/types';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNavItems, adminNavGroups } from '../../lib/adminNav';
import { defaultHero, defaultLogo, defaultNavbar, defaultSections } from '../../lib/useHomepageSettings';

type Tab = 'hero' | 'logo' | 'navbar' | 'sections';

const tabs: { id: Tab; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'hero', label: 'Hero / Balline', icon: <Image className="w-4 h-4" />, desc: 'Imazhi, titulli, butoni i kerkimit' },
  { id: 'logo', label: 'Logo & Emri', icon: <Car className="w-4 h-4" />, desc: 'Logo e platformes ne te gjitha vendet' },
  { id: 'navbar', label: 'Shiriti Kryesor', icon: <Monitor className="w-4 h-4" />, desc: 'Lidhjet dhe butonat e navigimit' },
  { id: 'sections', label: 'Seksionet', icon: <LayoutGrid className="w-4 h-4" />, desc: 'Visibility dhe titujt e seksioneve' },
];

export default function AdminHomepage() {
  const [activeTab, setActiveTab] = useState<Tab>('hero');
  const [hero, setHero] = useState<HeroSettings>(defaultHero);
  const [logo, setLogo] = useState<LogoSettings>(defaultLogo);
  const [navbar, setNavbar] = useState<NavbarSettings>(defaultNavbar);
  const [sections, setSections] = useState<SectionsSettings>(defaultSections);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingHeroMobile, setUploadingHeroMobile] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const heroFileRef = useRef<HTMLInputElement>(null);
  const heroMobileFileRef = useRef<HTMLInputElement>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const { data } = await supabase.from('homepage_settings').select('key, value');
    if (data) {
      for (const row of data) {
        if (row.key === 'hero') setHero({ ...defaultHero, ...(row.value as Partial<HeroSettings>) });
        if (row.key === 'logo') setLogo({ ...defaultLogo, ...(row.value as Partial<LogoSettings>) });
        if (row.key === 'navbar') setNavbar({ ...defaultNavbar, ...(row.value as Partial<NavbarSettings>) });
        if (row.key === 'sections') setSections({ ...defaultSections, ...(row.value as Partial<SectionsSettings>) });
      }
    }
    setLoading(false);
  }

  async function saveTab() {
    setSaving(true);
    let key = activeTab as string;
    let value: Record<string, unknown> = {};
    if (activeTab === 'hero') value = hero as unknown as Record<string, unknown>;
    if (activeTab === 'logo') value = logo as unknown as Record<string, unknown>;
    if (activeTab === 'navbar') value = navbar as unknown as Record<string, unknown>;
    if (activeTab === 'sections') value = sections as unknown as Record<string, unknown>;

    await supabase.from('homepage_settings').upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );
    setSaving(false);
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
          <h1 className="text-2xl font-bold text-dark-950">Menaxhimi i Ballines</h1>
          <p className="text-dark-500 mt-1 text-[15px]">Kontrollo komplet Homepage-in, logon, navigimin dhe seksionet</p>
        </div>
        <button
          onClick={saveTab}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all text-sm shadow-sm shadow-primary-600/20"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Duke ruajtur...' : saved ? 'U ruajt!' : 'Ruaj ndryshimet'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden sticky top-[88px]">
            <div className="p-4 border-b border-gray-100">
              <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Seksionet</p>
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
        </div>
      </div>
    </DashboardLayout>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
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
  function set(field: keyof HeroSettings) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const val = e.target.type === 'range' || e.target.type === 'number' ? Number(e.target.value) : e.target.value;
      setHero(h => ({ ...h, [field]: val }));
    };
  }

  return (
    <div className="space-y-5">
      <SectionCard title="Imazhi i Sfondit" icon={<Image className="w-4 h-4" />}>
        <div className="space-y-4">
          {hero.image_url ? (
            <div className="relative rounded-xl overflow-hidden bg-gray-100 mb-3" style={{ aspectRatio: '21/9' }}>
              <img src={hero.image_url} alt="Hero" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-dark-950/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <button
                  onClick={() => heroFileRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-dark-900 rounded-xl text-sm font-semibold"
                >
                  <Upload className="w-4 h-4" />
                  Ndrysho imazhin
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
              <p className="text-sm text-dark-500">Nuk ka imazh te ngarkuar</p>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => heroFileRef.current?.click()}
              disabled={uploadingHero}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all shrink-0"
            >
              {uploadingHero ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploadingHero ? 'Duke ngarkuar...' : 'Ngarko foto'}
            </button>
            <input ref={heroFileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
            <input
              type="text"
              value={hero.image_url}
              onChange={set('image_url')}
              placeholder="ose vendos URL te imazhit..."
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Errësia e sfondit: {hero.overlay_opacity}%</label>
            <input
              type="range"
              min={0}
              max={95}
              value={hero.overlay_opacity}
              onChange={set('overlay_opacity')}
              className="w-full accent-primary-600"
            />
            <div className="flex justify-between text-xs text-dark-400 mt-1">
              <span>0% (transparent)</span>
              <span>95% (shume i errët)</span>
            </div>
          </div>
          <div>
            <label className={labelClass}>Pozicioni i imazhit (Desktop)</label>
            <select
              value={hero.image_position_desktop || 'center'}
              onChange={(e) => setHero(h => ({ ...h, image_position_desktop: e.target.value }))}
              className={inputClass}
            >
              <option value="center">Qendër</option>
              <option value="left">Majtas</option>
              <option value="right">Djathtas</option>
              <option value="top">Lart</option>
              <option value="bottom">Poshtë</option>
              <option value="30% center">30% nga e majta</option>
              <option value="70% center">70% nga e majta</option>
            </select>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Imazhi për Mobile / Tablet" icon={<Image className="w-4 h-4" />}>
        <div className="space-y-4">
          <p className="text-xs text-dark-500 -mt-1">Ngarko një foto të dedikuar për ekrane më të vogla (vertikale ose katror funksionon më mirë). Nëse e lë bosh, do të përdoret foto kryesore me pozicionim të rregulluar.</p>
          {hero.image_url_mobile ? (
            <div className="relative rounded-xl overflow-hidden bg-gray-100 mb-3 mx-auto" style={{ aspectRatio: '9/16', maxWidth: '220px' }}>
              <img src={hero.image_url_mobile} alt="Hero Mobile" className="w-full h-full object-cover" style={{ objectPosition: hero.image_position_mobile || '70% center' }} />
              <div className="absolute inset-0 bg-dark-950/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <button
                  onClick={() => heroMobileFileRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white text-dark-900 rounded-xl text-xs font-semibold"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Ndrysho
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
              <p className="text-sm text-dark-500">Nuk ka foto mobile</p>
              <p className="text-xs text-dark-400 mt-1">Do të përdoret foto kryesore me pozicionin e rregulluar</p>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => heroMobileFileRef.current?.click()}
              disabled={uploadingHeroMobile}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all shrink-0"
            >
              {uploadingHeroMobile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploadingHeroMobile ? 'Duke ngarkuar...' : 'Ngarko foto mobile'}
            </button>
            <input ref={heroMobileFileRef} type="file" accept="image/*" className="hidden" onChange={onUploadMobile} />
            <input
              type="text"
              value={hero.image_url_mobile || ''}
              onChange={(e) => setHero(h => ({ ...h, image_url_mobile: e.target.value }))}
              placeholder="ose vendos URL te imazhit..."
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Pozicioni i imazhit (Mobile / Tablet)</label>
            <select
              value={hero.image_position_mobile || '70% center'}
              onChange={(e) => setHero(h => ({ ...h, image_position_mobile: e.target.value }))}
              className={inputClass}
            >
              <option value="center">Qendër</option>
              <option value="left">Majtas</option>
              <option value="right">Djathtas</option>
              <option value="top">Lart</option>
              <option value="bottom">Poshtë</option>
              <option value="30% center">30% nga e majta</option>
              <option value="50% center">Qendër (50%)</option>
              <option value="70% center">70% nga e majta (rekomandohet)</option>
              <option value="center top">Qendër lart</option>
              <option value="center bottom">Qendër poshtë</option>
            </select>
            <p className="text-xs text-dark-400 mt-1.5">Përcakton se cila pjesë e fotos qëndron e dukshme në ekrane të vogla.</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Titulli dhe Nëntitulli" icon={<Type className="w-4 h-4" />}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Titulli - Rreshti 1</label>
              <input type="text" value={hero.title_line1} onChange={set('title_line1')} className={inputClass} placeholder="Udhetoni me stil," />
            </div>
            <div>
              <label className={labelClass}>Titulli - Rreshti 2 (gradient)</label>
              <input type="text" value={hero.title_line2} onChange={set('title_line2')} className={inputClass} placeholder="rezervoni me lehte." />
            </div>
          </div>
          <div>
            <label className={labelClass}>Nëntitulli</label>
            <textarea value={hero.subtitle} onChange={set('subtitle')} rows={3} className={inputClass + ' resize-none'} />
          </div>
          <div>
            <label className={labelClass}>Badge text (opsional, shfaqet mbi titull)</label>
            <input type="text" value={hero.badge_text} onChange={set('badge_text')} className={inputClass} placeholder="p.sh: #1 Platforma ne Kosove" />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Forma e Kerkimit" icon={<AlignLeft className="w-4 h-4" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Placeholder - Qyteti</label>
            <input type="text" value={hero.search_label_city} onChange={set('search_label_city')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Label - Data e marrjes</label>
            <input type="text" value={hero.search_label_pickup} onChange={set('search_label_pickup')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Label - Data e kthimit</label>
            <input type="text" value={hero.search_label_return} onChange={set('search_label_return')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Teksti i butonit Kerko</label>
            <input type="text" value={hero.search_button_text} onChange={set('search_button_text')} className={inputClass} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Trust Badges" icon={<Globe className="w-4 h-4" />}>
        <div className="space-y-4">
          <Toggle
            checked={hero.show_trust_badges}
            onChange={v => setHero(h => ({ ...h, show_trust_badges: v }))}
            label="Shfaq buxhetat e besimit nen formen e kerkimit"
          />
          {hero.show_trust_badges && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className={labelClass}>Badge 1 (Checkmark)</label>
                <input type="text" value={hero.trust_badge_1} onChange={set('trust_badge_1')} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Badge 2 (Shield)</label>
                <input type="text" value={hero.trust_badge_2} onChange={set('trust_badge_2')} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Badge 3 (Clock)</label>
                <input type="text" value={hero.trust_badge_3} onChange={set('trust_badge_3')} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Badge 4 (Heart)</label>
                <input type="text" value={hero.trust_badge_4} onChange={set('trust_badge_4')} className={inputClass} />
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      <div className="bg-dark-950 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/10">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wide">Parashikim Hero</p>
        </div>
        <div className="relative" style={{ height: '220px' }}>
          {hero.image_url && (
            <img src={hero.image_url} alt="Preview" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0" style={{ background: `rgba(5,5,15,${hero.overlay_opacity / 100})` }} />
          <div className="absolute inset-0 flex flex-col justify-center px-8">
            {hero.badge_text && (
              <span className="inline-block w-fit text-xs font-semibold bg-primary-600/90 text-white px-3 py-1 rounded-full mb-3">
                {hero.badge_text}
              </span>
            )}
            <h1 className="text-2xl font-extrabold text-white leading-tight">
              {hero.title_line1 || 'Titulli i rreshtit 1'}
              <br />
              <span className="gradient-text">{hero.title_line2 || 'Titulli i rreshtit 2'}</span>
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
  return (
    <div className="space-y-5">
      <SectionCard title="Logo e Platformes" icon={<Car className="w-4 h-4" />}>
        <div className="space-y-5">
          <div className="flex items-start gap-6 flex-wrap sm:flex-nowrap">
            <div className="shrink-0">
              <p className={labelClass}>Logo aktuale</p>
              <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden relative group">
                {logo.logo_url ? (
                  <>
                    <img src={logo.logo_url} alt="Logo" className="w-full h-full object-contain p-3" />
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
                    <p className="text-xs text-gray-400">Pa logo</p>
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
                  {uploadingLogo ? 'Duke ngarkuar...' : 'Ngarko logon'}
                </button>
                <input ref={logoFileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
                <p className="text-xs text-dark-400 mt-1.5">PNG me sfond transparent rekomandohet. Maks: 5MB</p>
              </div>
              <div>
                <label className={labelClass}>ose URL e logos</label>
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
            <label className={labelClass}>Emri i platformes (shfaqet prane logos)</label>
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
              label="Shfaq ikonën / logon e ngarkuar"
            />
            <Toggle
              checked={logo.show_text}
              onChange={v => setLogo(l => ({ ...l, show_text: v }))}
              label="Shfaq emrin e platformes prane logos"
            />
          </div>
        </div>
      </SectionCard>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <p className="text-xs font-semibold text-dark-600 uppercase tracking-wide mb-4">Parashikim ne Navbar</p>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-dark-400 mb-1.5">Transparent (mbi Hero)</p>
            <div className="bg-dark-950 rounded-xl px-5 py-3 flex items-center gap-2.5">
              {logo.show_icon && (
                logo.logo_url ? (
                  <img src={logo.logo_url} alt="Logo" className="w-7 h-7 object-contain" />
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
            <p className="text-xs text-dark-400 mb-1.5">E bardhe (scroll)</p>
            <div className="bg-white border border-gray-200 rounded-xl px-5 py-3 flex items-center gap-2.5">
              {logo.show_icon && (
                logo.logo_url ? (
                  <img src={logo.logo_url} alt="Logo" className="w-7 h-7 object-contain" />
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
            <p className="text-xs text-dark-400 mb-1.5">Footer</p>
            <div className="bg-dark-950 rounded-xl px-5 py-3 flex items-center gap-2.5">
              {logo.show_icon && (
                logo.logo_url ? (
                  <img src={logo.logo_url} alt="Logo" className="w-6 h-6 object-contain" />
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
  const btnColors: { value: string; label: string; cls: string }[] = [
    { value: 'primary', label: 'Kaltërt (Primary)', cls: 'bg-primary-600 text-white' },
    { value: 'dark', label: 'E zezë (Dark)', cls: 'bg-dark-950 text-white' },
    { value: 'accent', label: 'Portokalli (Accent)', cls: 'bg-accent-600 text-white' },
    { value: 'green', label: 'Gjelbërt', cls: 'bg-green-600 text-white' },
  ];

  return (
    <div className="space-y-5">
      <SectionCard title="Lidhjet e Navigimit" icon={<LinkIcon className="w-4 h-4" />}>
        <div className="space-y-4">
          <Toggle
            checked={navbar.show_vehicles_link}
            onChange={v => setNavbar(n => ({ ...n, show_vehicles_link: v }))}
            label="Shfaq linkun 'Automjetet'"
          />
          {navbar.show_vehicles_link && (
            <div>
              <label className={labelClass}>Teksti i linkut</label>
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

      <SectionCard title="Butonat e Hyrjes" icon={<Palette className="w-4 h-4" />}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Teksti "Kycu"</label>
              <input
                type="text"
                value={navbar.login_button_text}
                onChange={e => setNavbar(n => ({ ...n, login_button_text: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Teksti "Regjistrohu"</label>
              <input
                type="text"
                value={navbar.register_button_text}
                onChange={e => setNavbar(n => ({ ...n, register_button_text: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Ngjyra e butonit Regjistrohu</label>
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
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-3">Parashikim Navbar</p>
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

const sectionItems = [
  { key: 'show_categories' as const, label: 'Kategorite e automjeteve', titleKey: 'categories_title' as const, subtitleKey: 'categories_subtitle' as const },
  { key: 'show_featured' as const, label: 'Automjetet e zgjedhura', titleKey: 'featured_title' as const, subtitleKey: 'featured_subtitle' as const },
  { key: 'show_how_it_works' as const, label: 'Si funksionon' },
  { key: 'show_testimonials' as const, label: 'Pershtypjet e klienteve' },
  { key: 'show_company_cta' as const, label: 'Thirrja per kompanite (CTA)' },
  { key: 'show_trust_banner' as const, label: 'Baneri i Besimit (fund ballina)' },
];

function SectionsEditor({ sections, setSections, inputClass, labelClass }: SectionsEditorProps) {
  return (
    <div className="space-y-5">
      <SectionCard title="Visibility dhe Titujt e Seksioneve" icon={<Eye className="w-4 h-4" />}>
        <div className="space-y-3">
          {sectionItems.map(item => (
            <div key={item.key} className="bg-gray-50 rounded-xl p-4">
              <Toggle
                checked={sections[item.key]}
                onChange={v => setSections(s => ({ ...s, [item.key]: v }))}
                label={item.label}
              />
              {'titleKey' in item && sections[item.key] && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 ml-12">
                  <div>
                    <label className="block text-xs font-medium text-dark-500 mb-1">Titulli kryesor</label>
                    <input
                      type="text"
                      value={sections[item.titleKey]}
                      onChange={e => setSections(s => ({ ...s, [item.titleKey]: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-dark-500 mb-1">Nëntitulli (badge sipër)</label>
                    <input
                      type="text"
                      value={sections[item.subtitleKey]}
                      onChange={e => setSections(s => ({ ...s, [item.subtitleKey]: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="bg-primary-50 border border-primary-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <RefreshCw className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-primary-800">Ndryshimet hyjnë menjëherë pas ruajtjes</p>
            <p className="text-xs text-primary-700 mt-1">Seksionet e çaktivizuara fshihen nga Homepage. Titujt e perditesuar shfaqen menjëherë per vizituesit e rinj.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
