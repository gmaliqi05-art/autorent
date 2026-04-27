import { useState } from 'react';
import { Plus, Save, Loader2, CheckCircle, Image, Link, AlignLeft, Calendar, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNavItems, adminNavGroups } from '../../lib/adminNav';
import { useNavigate } from 'react-router-dom';

const positions = [
  { value: 'homepage_banner', label: 'Banner kryesor i Ballines', desc: 'Vendoset ne kryefaqe, shume vizibel' },
  { value: 'homepage_middle', label: 'Mes i Ballines', desc: 'Banner ne mes te faqes kryesore' },
  { value: 'sidebar', label: 'Sidebar', desc: 'Paneli anesore i faqeve' },
  { value: 'vehicle_list', label: 'Lista e Automjeteve', desc: 'Midis listimit te automjeteve' },
  { value: 'booking_confirm', label: 'Konfirmim Rezervimi', desc: 'Pas konfirmimit te rezervimit' },
];

export default function AdminCreateAd() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', image_url: '', link_url: '',
    position: 'homepage_banner', is_active: true,
    start_date: '', end_date: '',
  });
  const [preview, setPreview] = useState(false);

  async function save() {
    if (!form.title) return;
    setSaving(true);
    await supabase.from('platform_ads').insert({
      ...form,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      click_count: 0,
      view_count: 0,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => navigate('/admin/reklamat'), 1500);
  }

  const selectedPos = positions.find(p => p.value === form.position);

  return (
    <DashboardLayout navItems={adminNavItems} navGroups={adminNavGroups} title="Krijo Reklame">
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Krijo Reklame te Re</h1>
            <p className="text-gray-500 text-sm mt-1">Shto nje reklame te re ne platforme</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setPreview(!preview)}
              className={`flex items-center gap-2 border px-4 py-2.5 rounded-lg text-sm font-medium ${preview ? 'border-primary-300 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              <Eye className="w-4 h-4" />Preview
            </button>
            <button onClick={save} disabled={saving || !form.title}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? 'Duke ruajtur...' : saved ? 'U ruajt!' : 'Publiko'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-5">
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2"><AlignLeft className="w-5 h-5 text-primary-600" />Permbajtja</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titulli i Reklames *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="P.sh. Oferte speciale - 20% zbritje..." maxLength={100}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pershkrim</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} placeholder="Pershkrim i shkurter i reklames..." maxLength={250}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <p className="text-xs text-gray-400 mt-1">{form.description.length}/250</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Imazhit</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Image className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                      placeholder="https://images.pexels.com/..." className="w-full pl-9 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>
                {form.image_url && <img src={form.image_url} alt="Preview" className="mt-2 h-24 w-full object-cover rounded-lg border border-gray-200" />}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL destinacioni (ku shkon klikimi)</label>
                <div className="relative">
                  <Link className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))}
                    placeholder="https://..." className="w-full pl-9 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Calendar className="w-5 h-5 text-primary-600" />Periudha</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fillon me</label>
                  <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skadon me</label>
                  <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div>
                  <div className="text-sm font-medium text-gray-700">Publiko menjëherë</div>
                  <div className="text-xs text-gray-500">Reklama do shfaqet ne platforme menjëherë</div>
                </div>
                <button onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                  className={`w-12 h-6 rounded-full transition-colors ${form.is_active ? 'bg-primary-600' : 'bg-gray-300'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${form.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Pozicioni</h3>
              <div className="space-y-2">
                {positions.map(pos => (
                  <button key={pos.value} onClick={() => setForm(f => ({ ...f, position: pos.value }))}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${form.position === pos.value ? 'border-primary-500 bg-primary-50' : 'border-gray-100 hover:border-gray-200'}`}>
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${form.position === pos.value ? 'bg-primary-600' : 'bg-gray-300'}`} />
                    <div>
                      <div className={`text-sm font-medium ${form.position === pos.value ? 'text-primary-700' : 'text-gray-700'}`}>{pos.label}</div>
                      <div className="text-xs text-gray-400">{pos.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {preview && form.title && (
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">Preview</h3>
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  {form.image_url ? (
                    <img src={form.image_url} alt={form.title} className="w-full h-24 object-cover" />
                  ) : (
                    <div className="w-full h-24 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                      <span className="text-primary-400 text-sm">Pa imazh</span>
                    </div>
                  )}
                  <div className="p-3">
                    <p className="font-semibold text-gray-900 text-sm">{form.title}</p>
                    {form.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{form.description}</p>}
                    {form.link_url && <p className="text-xs text-primary-600 mt-2 truncate">{form.link_url}</p>}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  <span className="px-2 py-1 bg-gray-100 rounded-lg">{selectedPos?.label}</span>
                  <span className={`px-2 py-1 rounded-lg ${form.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                    {form.is_active ? 'Aktive' : 'Joaktive'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
