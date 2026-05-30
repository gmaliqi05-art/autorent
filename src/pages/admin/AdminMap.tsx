import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { supabase } from '../../lib/supabase';
import type { Company } from '../../lib/types';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNavItems, adminNavGroups } from '../../lib/adminNav';
import { MapPin, Building2, Car, Star, Navigation, Loader2, Search, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

type CompanyWithMeta = Company & { vehicleCount?: number };

function createCompanyIcon(name: string, hasLocation: boolean) {
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const color = hasLocation ? '#2276e7' : '#94a3b8';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
      <defs>
        <filter id="sh" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.2"/>
        </filter>
      </defs>
      <path d="M20 0C9 0 0 9 0 20c0 15 20 28 20 28s20-13 20-28C40 9 31 0 20 0z" fill="${color}" filter="url(#sh)"/>
      <circle cx="20" cy="20" r="12" fill="white"/>
      <text x="20" y="24.5" font-family="Inter,sans-serif" font-size="9" font-weight="700" fill="${color}" text-anchor="middle">${initials}</text>
    </svg>`;
  return L.divIcon({ html: svg, iconSize: [40, 48], iconAnchor: [20, 48], popupAnchor: [0, -50], className: '' });
}

function AdminMapView() {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [companies, setCompanies] = useState<CompanyWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CompanyWithMeta | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'with_location' | 'without_location'>('all');
  const [saving, setSaving] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    supabase
      .from('companies')
      .select('*')
      .order('name', { ascending: true })
      .then(async ({ data }) => {
        const comps = (data || []) as CompanyWithMeta[];
        const vehRes = await supabase
          .from('vehicles')
          .select('company_id')
          .eq('is_published', true)
          .eq('is_available', true);
        const vehCounts: Record<string, number> = {};
        (vehRes.data || []).forEach(v => {
          vehCounts[v.company_id] = (vehCounts[v.company_id] || 0) + 1;
        });
        comps.forEach(c => { c.vehicleCount = vehCounts[c.id] || 0; });
        setCompanies(comps);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (loading || !containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { center: [41.5, 20.5], zoom: 7 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
  }, [loading]);

  useEffect(() => {
    if (!mapRef.current || loading) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current.clear();
    companies.forEach(c => {
      if (c.latitude == null || c.longitude == null) return;
      const marker = L.marker([c.latitude, c.longitude], { icon: createCompanyIcon(c.name, true) })
        .addTo(mapRef.current!)
        .on('click', () => setSelected(c));
      markersRef.current.set(c.id, marker);
    });
  }, [companies, loading]);

  const focusCompany = useCallback((c: CompanyWithMeta) => {
    setSelected(c);
    if (mapRef.current && c.latitude && c.longitude) {
      mapRef.current.setView([c.latitude, c.longitude], 14);
    }
  }, []);

  const removeLocation = useCallback(async (c: CompanyWithMeta) => {
    setSaving(c.id);
    const { error } = await supabase
      .from('companies')
      .update({ latitude: null, longitude: null })
      .eq('id', c.id);
    setSaving(null);
    if (!error) {
      setCompanies(prev => prev.map(x => x.id === c.id ? { ...x, latitude: null, longitude: null } : x));
      setSelected(null);
      setFeedback({ id: c.id, type: 'success' });
      setTimeout(() => setFeedback(null), 2000);
    } else {
      setFeedback({ id: c.id, type: 'error' });
      setTimeout(() => setFeedback(null), 3000);
    }
  }, []);

  const filtered = companies.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || (c.city || '').toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (filter === 'with_location') return c.latitude != null && c.longitude != null;
    if (filter === 'without_location') return c.latitude == null || c.longitude == null;
    return true;
  });

  const withLocation = companies.filter(c => c.latitude != null).length;
  const withoutLocation = companies.length - withLocation;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={<Building2 className="w-5 h-5 text-primary-600" />} label="Kompani gjithsej" value={companies.length} bg="bg-primary-50" />
        <StatCard icon={<MapPin className="w-5 h-5 text-green-600" />} label="Me lokacion" value={withLocation} bg="bg-green-50" />
        <StatCard icon={<MapPin className="w-5 h-5 text-amber-500" />} label="Pa lokacion" value={withoutLocation} bg="bg-amber-50" />
        <StatCard icon={<Car className="w-5 h-5 text-blue-600" />} label="Vetura aktive" value={companies.reduce((s, c) => s + (c.vehicleCount || 0), 0)} bg="bg-blue-50" />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-gray-100">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Kerko kompani ose qytet..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'with_location', 'without_location'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${filter === f ? 'bg-primary-600 text-white' : 'bg-gray-100 text-dark-600 hover:bg-gray-200'}`}
              >
                {f === 'all' ? 'Te gjitha' : f === 'with_location' ? 'Me lokacion' : 'Pa lokacion'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row" style={{ minHeight: 520 }}>
          <div className="w-full lg:w-72 border-r border-gray-100 overflow-y-auto" style={{ maxHeight: 580 }}>
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-dark-400 text-sm">Nuk ka rezultate.</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filtered.map(c => (
                  <button
                    key={c.id}
                    onClick={() => focusCompany(c)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${selected?.id === c.id ? 'bg-primary-50 border-l-2 border-l-primary-600' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                        {c.logo_url ? <img src={c.logo_url} alt="" className="w-9 h-9 object-cover" /> : <Building2 className="w-4 h-4 text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-dark-900 truncate">{c.name}</p>
                        <p className="text-xs text-dark-400 truncate">{c.city || '—'}</p>
                      </div>
                      <div className="shrink-0">
                        {c.latitude != null ? (
                          <span className="w-2 h-2 rounded-full bg-green-500 block" title="Ka lokacion" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-gray-300 block" title="Pa lokacion" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 relative" style={{ minHeight: 420 }}>
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
              </div>
            ) : (
              <div ref={containerRef} className="w-full h-full" style={{ minHeight: 420 }} />
            )}

            {selected && (
              <div className="absolute top-3 right-3 z-[1000] w-72">
                <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                        {selected.logo_url ? <img src={selected.logo_url} alt="" className="w-9 h-9 object-cover" /> : <Building2 className="w-4 h-4 text-gray-400" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-dark-950 truncate">{selected.name}</p>
                        <p className="text-xs text-dark-400">{selected.city}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelected(null)} className="p-1 text-dark-400 hover:text-dark-700 rounded-lg shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-dark-400">Vetura</p>
                      <p className="text-sm font-bold text-dark-900">{selected.vehicleCount || 0}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-dark-400">Vleresimi</p>
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <p className="text-sm font-bold text-dark-900">{selected.rating > 0 ? selected.rating.toFixed(1) : '—'}</p>
                      </div>
                    </div>
                  </div>

                  {selected.latitude != null && selected.longitude != null ? (
                    <div className="mb-3 bg-green-50 rounded-lg px-3 py-2 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-green-600 shrink-0" />
                      <p className="text-xs text-green-700 font-medium">
                        {selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}
                      </p>
                    </div>
                  ) : (
                    <div className="mb-3 bg-amber-50 rounded-lg px-3 py-2 flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <p className="text-xs text-amber-700 font-medium">Nuk ka lokacion te caktuar</p>
                    </div>
                  )}

                  {feedback?.id === selected.id && (
                    <div className={`mb-3 flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 ${feedback.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      <CheckCircle className="w-3.5 h-3.5" />
                      {feedback.type === 'success' ? 'Lokacioni u hoq!' : 'Ndodhi nje gabim.'}
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <Link
                      to={`/admin/kompanite`}
                      className="block text-center py-2 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Shiko ne Admin Kompanite
                    </Link>
                    {selected.latitude != null && (
                      <button
                        onClick={() => removeLocation(selected)}
                        disabled={saving === selected.id}
                        className="flex items-center justify-center gap-1.5 py-2 bg-red-50 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors disabled:opacity-60"
                      >
                        {saving === selected.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                        Hiq lokacionin
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm border border-gray-100">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-primary-600" />
                <span className="text-xs text-dark-600 font-medium">Kompani</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-xs text-dark-600 font-medium">Me lokacion</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
        <Navigation className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Si te vendosni lokacionin e nje kompanie?</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Kompania duhet te hyje ne <strong>Kompania &rarr; Cilesimet</strong> dhe te caktoje vendndodhjen e saj ne harten interaktive. Lokacioni do shfaqet automatikisht ne harten publike.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: number; bg: string }) {
  return (
    <div className={`${bg} rounded-2xl p-4`}>
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs font-medium text-dark-600">{label}</span></div>
      <p className="text-2xl font-bold text-dark-950">{value}</p>
    </div>
  );
}

export default function AdminMap() {
  return (
    <DashboardLayout title="Harta e kompanive" navItems={adminNavItems} navGroups={adminNavGroups}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark-950 mb-1">Harta e kompanive</h1>
        <p className="text-dark-500 text-[15px]">Shikoni dhe menaxhoni vendndodhjet e te gjitha kompanive ne platforme</p>
      </div>
      <AdminMapView />
    </DashboardLayout>
  );
}
