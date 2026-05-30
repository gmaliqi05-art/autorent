import { useState, useEffect } from 'react';
import { Search, Save, Loader2, Globe, FileText, Tag, TrendingUp, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNavItems, adminNavGroups } from '../../lib/adminNav';

interface SEOSettings {
  site_title: string;
  site_description: string;
  site_keywords: string;
  og_title: string;
  og_description: string;
  og_image_url: string;
  twitter_handle: string;
  robots_txt: string;
  sitemap_enabled: boolean;
  google_analytics_id: string;
  google_search_console: string;
  facebook_pixel_id: string;
  canonical_url: string;
  schema_org_type: string;
}

const defaultSEO: SEOSettings = {
  site_title: 'RentCar - Rent a Car Albania',
  site_description: 'Gjeni dhe rezervoni automjetin tuaj te preferuar ne Shqiperi. Cmime te arsyeshme, sherbim i shpejte.',
  site_keywords: 'rent a car, makineri me qera, albania, tirane',
  og_title: 'RentCar - Rezervoni makinen tuaj',
  og_description: 'Platforme e rezervimit te automjeteve ne Shqiperi',
  og_image_url: '',
  twitter_handle: '',
  robots_txt: 'User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /dashboard/',
  sitemap_enabled: true,
  google_analytics_id: '',
  google_search_console: '',
  facebook_pixel_id: '',
  canonical_url: '',
  schema_org_type: 'Organization',
};

export default function AdminSEO() {
  const [settings, setSettings] = useState<SEOSettings>(defaultSEO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'social' | 'technical' | 'analytics'>('basic');

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    const { data } = await supabase.from('platform_settings').select('*').eq('key', 'seo_settings').maybeSingle();
    if (data?.value) setSettings({ ...defaultSEO, ...(data.value as Partial<SEOSettings>) });
    setLoading(false);
  }

  async function saveSettings() {
    setSaving(true);
    const { data: existing } = await supabase.from('platform_settings').select('id').eq('key', 'seo_settings').maybeSingle();
    if (existing) {
      await supabase.from('platform_settings').update({ value: settings as any, updated_at: new Date().toISOString() }).eq('key', 'seo_settings');
    } else {
      await supabase.from('platform_settings').insert({ key: 'seo_settings', value: settings as any });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const tabs = [
    { id: 'basic', label: 'Baze & Meta', icon: FileText },
    { id: 'social', label: 'Social Media', icon: Globe },
    { id: 'technical', label: 'Teknik', icon: Tag },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  ] as const;

  return (
    <DashboardLayout navItems={adminNavItems} navGroups={adminNavGroups} title="SEO Google">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SEO & Google</h1>
            <p className="text-gray-500 text-sm mt-1">Optimizimi i motoreve te kerkimit</p>
          </div>
          <button onClick={saveSettings} disabled={saving}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? 'Duke ruajtur...' : saved ? 'U ruajt!' : 'Ruaj ndryshimet'}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-4 gap-6">
            <div className="col-span-1 bg-white rounded-xl border border-gray-100 p-4 h-fit">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors mb-1 text-left ${activeTab === id ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <Icon className="w-4 h-4" />{label}
                </button>
              ))}
            </div>

            <div className="col-span-3 bg-white rounded-xl border border-gray-100 p-6">
              {activeTab === 'basic' && (
                <div className="space-y-5">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Search className="w-5 h-5 text-primary-600" />Meta Tags Bazike</h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Titulli i faqes (Title Tag)</label>
                    <input value={settings.site_title} onChange={e => setSettings(s => ({ ...s, site_title: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    <p className="text-xs text-gray-400 mt-1">{settings.site_title.length}/60 karaktere (rekomandohet max 60)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pershkrimi (Meta Description)</label>
                    <textarea value={settings.site_description} onChange={e => setSettings(s => ({ ...s, site_description: e.target.value }))}
                      rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    <p className="text-xs text-gray-400 mt-1">{settings.site_description.length}/160 karaktere</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fjale Kyce (Keywords)</label>
                    <input value={settings.site_keywords} onChange={e => setSettings(s => ({ ...s, site_keywords: e.target.value }))}
                      placeholder="rent a car, albania, tirane..." className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL Kanonik</label>
                    <input value={settings.canonical_url} onChange={e => setSettings(s => ({ ...s, canonical_url: e.target.value }))}
                      placeholder="https://yourdomain.com" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>
              )}

              {activeTab === 'social' && (
                <div className="space-y-5">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Globe className="w-5 h-5 text-primary-600" />Open Graph & Social</h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">OG Title</label>
                    <input value={settings.og_title} onChange={e => setSettings(s => ({ ...s, og_title: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">OG Description</label>
                    <textarea value={settings.og_description} onChange={e => setSettings(s => ({ ...s, og_description: e.target.value }))}
                      rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">OG Image URL</label>
                    <input value={settings.og_image_url} onChange={e => setSettings(s => ({ ...s, og_image_url: e.target.value }))}
                      placeholder="https://..." className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Twitter Handle</label>
                    <input value={settings.twitter_handle} onChange={e => setSettings(s => ({ ...s, twitter_handle: e.target.value }))}
                      placeholder="@username" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Preview Social Card</p>
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      {settings.og_image_url && <img src={settings.og_image_url} alt="OG" className="w-full h-32 object-cover" loading="lazy" />}
                      <div className="p-3">
                        <p className="text-xs text-gray-400 uppercase">yourdomain.com</p>
                        <p className="font-semibold text-gray-900 text-sm mt-1">{settings.og_title || settings.site_title}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{settings.og_description || settings.site_description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'technical' && (
                <div className="space-y-5">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Tag className="w-5 h-5 text-primary-600" />Cilesimet Teknike</h2>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <p className="font-medium text-gray-700">Sitemap XML</p>
                      <p className="text-xs text-gray-500">Gjenerohet automatikisht te /sitemap.xml</p>
                    </div>
                    <button onClick={() => setSettings(s => ({ ...s, sitemap_enabled: !s.sitemap_enabled }))}
                      className={`w-12 h-6 rounded-full transition-colors ${settings.sitemap_enabled ? 'bg-primary-600' : 'bg-gray-300'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${settings.sitemap_enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">robots.txt</label>
                    <textarea value={settings.robots_txt} onChange={e => setSettings(s => ({ ...s, robots_txt: e.target.value }))}
                      rows={8} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Schema.org Type</label>
                    <select value={settings.schema_org_type} onChange={e => setSettings(s => ({ ...s, schema_org_type: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="Organization">Organization</option>
                      <option value="LocalBusiness">LocalBusiness</option>
                      <option value="AutoRental">AutoRental</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-5">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary-600" />Analytics & Tracking</h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Google Analytics ID</label>
                    <input value={settings.google_analytics_id} onChange={e => setSettings(s => ({ ...s, google_analytics_id: e.target.value }))}
                      placeholder="G-XXXXXXXXXX" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Google Search Console Verification</label>
                    <input value={settings.google_search_console} onChange={e => setSettings(s => ({ ...s, google_search_console: e.target.value }))}
                      placeholder="Verification code..." className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Facebook Pixel ID</label>
                    <input value={settings.facebook_pixel_id} onChange={e => setSettings(s => ({ ...s, facebook_pixel_id: e.target.value }))}
                      placeholder="000000000000" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-800 mb-1">Udhezim</p>
                    <p className="text-xs text-blue-600">Kodi i Google Analytics dhe Facebook Pixel do behet aktiv pas ruajtjes. Mund te duroje deri 24 ore per te filluar mbledhjen e te dhenave.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
