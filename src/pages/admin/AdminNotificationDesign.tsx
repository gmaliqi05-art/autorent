import { useState, useEffect } from 'react';
import { Bell, Save, Loader2, CheckCircle, Palette, Smartphone, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNavItems, adminNavGroups } from '../../lib/adminNav';

interface BadgeSettings {
  color_info: string;
  color_success: string;
  color_warning: string;
  color_error: string;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  animation: 'bounce' | 'pulse' | 'none';
  show_count: boolean;
  max_count: number;
  sound_enabled: boolean;
  push_enabled: boolean;
  desktop_notifications: boolean;
}

const defaults: BadgeSettings = {
  color_info: '#3B82F6',
  color_success: '#10B981',
  color_warning: '#F59E0B',
  color_error: '#EF4444',
  position: 'top-right',
  animation: 'pulse',
  show_count: true,
  max_count: 99,
  sound_enabled: false,
  push_enabled: false,
  desktop_notifications: false,
};

export default function AdminNotificationDesign() {
  const [settings, setSettings] = useState<BadgeSettings>(defaults);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewCount, setPreviewCount] = useState(5);

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    const { data } = await supabase.from('platform_settings').select('*').eq('key', 'notification_badge_settings').maybeSingle();
    if (data?.value) setSettings({ ...defaults, ...(data.value as Partial<BadgeSettings>) });
  }

  async function save() {
    setSaving(true);
    const { data: ex } = await supabase.from('platform_settings').select('id').eq('key', 'notification_badge_settings').maybeSingle();
    if (ex) await supabase.from('platform_settings').update({ value: settings as any }).eq('key', 'notification_badge_settings');
    else await supabase.from('platform_settings').insert({ key: 'notification_badge_settings', value: settings as any });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000);
  }

  return (
    <DashboardLayout navItems={adminNavItems} navGroups={adminNavGroups} title="Dizajni Badge & Push">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dizajni Badge & Push</h1>
            <p className="text-gray-500 text-sm mt-1">Personalizoni pamjen e njoftimeve dhe badge-ve</p>
          </div>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? 'Duke ruajtur...' : saved ? 'U ruajt!' : 'Ruaj'}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-5">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Palette className="w-5 h-5 text-primary-600" />Ngjyrat e Badge</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'color_info', label: 'Info (blerta)' },
                  { key: 'color_success', label: 'Sukses (gjelbert)' },
                  { key: 'color_warning', label: 'Paralajmerim (orange)' },
                  { key: 'color_error', label: 'Gabim (kug)' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-3">
                    <input type="color" value={(settings as any)[key]} onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                    <div>
                      <div className="text-sm font-medium text-gray-700">{label}</div>
                      <div className="text-xs text-gray-400 font-mono">{(settings as any)[key]}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Pozicioni & Animacioni</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pozicioni i badge</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['top-right', 'top-left', 'bottom-right', 'bottom-left'] as const).map(pos => (
                      <button key={pos} onClick={() => setSettings(s => ({ ...s, position: pos }))}
                        className={`py-2.5 px-4 rounded-lg text-sm border-2 transition-colors ${settings.position === pos ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                        {pos.replace('-', ' ').replace('top', 'Lart').replace('bottom', 'Poshte').replace('right', 'Djathtas').replace('left', 'Majtas')}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Animacioni</label>
                  <div className="flex gap-2">
                    {(['bounce', 'pulse', 'none'] as const).map(anim => (
                      <button key={anim} onClick={() => setSettings(s => ({ ...s, animation: anim }))}
                        className={`py-2 px-4 rounded-lg text-sm border-2 transition-colors ${settings.animation === anim ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                        {anim === 'bounce' ? 'Bounce' : anim === 'pulse' ? 'Pulse' : 'Pa animacion'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Shfaq numrin e njoftimeve</div>
                    <div className="text-xs text-gray-500">Badge do shfaqe numrin</div>
                  </div>
                  <button onClick={() => setSettings(s => ({ ...s, show_count: !s.show_count }))}
                    className={`w-12 h-6 rounded-full transition-colors ${settings.show_count ? 'bg-primary-600' : 'bg-gray-300'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${settings.show_count ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Smartphone className="w-5 h-5 text-primary-600" />Push Notifications</h3>
              {[
                { key: 'sound_enabled', label: 'Zeri i njoftimeve', desc: 'Luaj nje ze kur merret nje njoftim' },
                { key: 'push_enabled', label: 'Push Notifications', desc: 'Dergo push notifications ne browser' },
                { key: 'desktop_notifications', label: 'Desktop Notifications', desc: 'Shfaq njoftimet ne desktop' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-gray-700">{label}</div>
                    <div className="text-xs text-gray-500">{desc}</div>
                  </div>
                  <button onClick={() => setSettings(s => ({ ...s, [key]: !(s as any)[key] }))}
                    className={`w-12 h-6 rounded-full transition-colors ${(settings as any)[key] ? 'bg-primary-600' : 'bg-gray-300'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${(settings as any)[key] ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Eye className="w-5 h-5 text-primary-600" />Preview</h3>
              <div className="bg-gray-100 rounded-xl p-4 relative h-48 flex items-center justify-center">
                <div className="bg-white rounded-lg p-3 shadow text-xs text-gray-500 w-20 text-center">
                  <Bell className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                  Ikona
                </div>
                <div className={`absolute w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg
                  ${settings.position === 'top-right' ? 'top-4 right-4' : settings.position === 'top-left' ? 'top-4 left-4' : settings.position === 'bottom-right' ? 'bottom-4 right-4' : 'bottom-4 left-4'}
                  ${settings.animation === 'pulse' ? 'animate-pulse' : settings.animation === 'bounce' ? 'animate-bounce' : ''}`}
                  style={{ backgroundColor: settings.color_error }}>
                  {settings.show_count ? Math.min(previewCount, settings.max_count) : ''}
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-500 mb-2">Numri preview: {previewCount}</label>
                <input type="range" min={0} max={150} value={previewCount} onChange={e => setPreviewCount(+e.target.value)}
                  className="w-full accent-primary-600" />
              </div>
            </div>

            {[
              { type: 'info', label: 'Info', color: settings.color_info },
              { type: 'success', label: 'Sukses', color: settings.color_success },
              { type: 'warning', label: 'Paralajmerim', color: settings.color_warning },
              { type: 'error', label: 'Gabim', color: settings.color_error },
            ].map(({ type, label, color }) => (
              <div key={type} className="bg-white rounded-lg border border-gray-100 p-3 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <div className="text-sm font-medium text-gray-700">{label}</div>
                <div className="ml-auto text-xs font-mono text-gray-400">{color}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
