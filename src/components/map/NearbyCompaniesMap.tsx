import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { supabase } from '../../lib/supabase';
import type { Company } from '../../lib/types';
import { MapPin, Navigation, Car, Star, Loader2, X, ArrowRight } from 'lucide-react';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

type CompanyWithDistance = Company & { distance?: number; vehicleCount?: number };

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function createCompanyIcon(name: string) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="52" viewBox="0 0 44 52">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.25"/>
        </filter>
      </defs>
      <path d="M22 0C10 0 0 10 0 22c0 16 22 30 22 30s22-14 22-30C44 10 34 0 22 0z" fill="#2276e7" filter="url(#shadow)"/>
      <circle cx="22" cy="22" r="13" fill="white"/>
      <text x="22" y="27" font-family="Inter,sans-serif" font-size="10" font-weight="700" fill="#2276e7" text-anchor="middle">${initials}</text>
    </svg>`;
  return L.divIcon({
    html: svg,
    iconSize: [44, 52],
    iconAnchor: [22, 52],
    popupAnchor: [0, -54],
    className: '',
  });
}

function createUserIcon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="14" fill="#22c55e" stroke="white" stroke-width="3"/>
      <circle cx="16" cy="16" r="5" fill="white"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    className: '',
  });
}

export default function NearbyCompaniesMap() {
  const navigate = useNavigate();
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [companies, setCompanies] = useState<CompanyWithDistance[]>([]);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [selected, setSelected] = useState<CompanyWithDistance | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('companies')
      .select('*')
      .eq('status', 'approved')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .then(async ({ data }) => {
        const comps = (data || []) as CompanyWithDistance[];
        const vehRes = await supabase
          .from('vehicles')
          .select('company_id')
          .eq('is_published', true)
          .eq('is_available', true)
          .is('deleted_at', null);
        const vehCounts: Record<string, number> = {};
        (vehRes.data || []).forEach(v => {
          vehCounts[v.company_id] = (vehCounts[v.company_id] || 0) + 1;
        });
        comps.forEach(c => { c.vehicleCount = vehCounts[c.id] || 0; });
        setCompanies(comps);
        setLoading(false);
      });
  }, []);

  const initMap = useCallback((centerLat: number, centerLng: number, zoom: number) => {
    if (!containerRef.current) return;
    if (mapRef.current) {
      mapRef.current.setView([centerLat, centerLng], zoom);
      return;
    }

    const map = L.map(containerRef.current, {
      center: [centerLat, centerLng],
      zoom,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
  }, []);

  useEffect(() => {
    if (loading) return;
    if (mapRef.current) return;
    initMap(42.6629, 21.1655, 8);
  }, [loading, initMap]);

  useEffect(() => {
    if (!mapRef.current || loading) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    companies.forEach(c => {
      if (c.latitude == null || c.longitude == null) return;
      const marker = L.marker([c.latitude, c.longitude], { icon: createCompanyIcon(c.name) })
        .addTo(mapRef.current!)
        .on('click', () => navigate(`/automjetet?company=${c.id}`));
      markersRef.current.push(marker);
    });
  }, [companies, loading, navigate]);

  const locateUser = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Shfletuesi juaj nuk e mbeshtet lokalizimin.');
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPos({ lat: latitude, lng: longitude });
        setLocating(false);

        if (!mapRef.current) {
          initMap(latitude, longitude, 12);
        } else {
          mapRef.current.setView([latitude, longitude], 12);
        }

        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([latitude, longitude]);
        } else {
          const m = L.marker([latitude, longitude], { icon: createUserIcon() })
            .addTo(mapRef.current!)
            .bindPopup('<b>Pozicioni juaj</b>');
          userMarkerRef.current = m;
        }

        setCompanies(prev =>
          prev
            .map(c => ({
              ...c,
              distance: c.latitude != null && c.longitude != null
                ? haversineKm(latitude, longitude, c.latitude, c.longitude)
                : undefined,
            }))
            .sort((a, b) => (a.distance ?? 99999) - (b.distance ?? 99999))
        );
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) setLocationError('Qasja ne vendndodhje u refuzua. Aktivizoni lokalizimin ne browser.');
        else setLocationError('Nuk mund te merret vendndodhja. Provoni perseri.');
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, [initMap]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-2xl">
        <Loader2 className="w-7 h-7 text-primary-600 animate-spin" />
      </div>
    );
  }

  const nearby = userPos
    ? companies.filter(c => c.distance != null && c.distance <= 50)
    : companies.slice(0, 6);

  return (
    <div className="flex flex-col lg:flex-row gap-0 rounded-2xl overflow-hidden border border-gray-200 shadow-lg" style={{ minHeight: 500 }}>
      <div className="flex-1 relative" style={{ minHeight: 380 }}>
        <div ref={containerRef} className="w-full h-full" style={{ minHeight: 380 }} />

        <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-2">
          <button
            onClick={locateUser}
            disabled={locating}
            className="flex items-center gap-2 px-3 py-2 bg-white text-dark-800 text-xs font-semibold rounded-xl shadow-md border border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-60"
          >
            {locating ? <Loader2 className="w-4 h-4 animate-spin text-primary-600" /> : <Navigation className="w-4 h-4 text-primary-600" />}
            {locating ? 'Lokalizim...' : 'Lokalizoni mua'}
          </button>
          {locationError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2 max-w-xs">
              {locationError}
            </div>
          )}
        </div>

        <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm border border-gray-100">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-primary-600" />
            <span className="text-xs text-dark-600 font-medium">Rent-a-car</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-dark-600 font-medium">Pozicioni juaj</span>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-80 bg-white flex flex-col overflow-hidden">
        <div className="px-4 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-dark-950 text-base">
            {userPos ? 'Kompanite me te aferta' : 'Te gjitha kompanite'}
          </h3>
          <p className="text-xs text-dark-400 mt-0.5">
            {userPos
              ? `${nearby.length} brenda 50 km`
              : 'Aktivizoni lokalizimin per rezultate me te aferta'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {nearby.length === 0 ? (
            <div className="p-6 text-center">
              <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-dark-400">Nuk ka kompani brenda 50 km.</p>
              <p className="text-xs text-dark-300 mt-1">Zgjeroni kerkimin tuaj.</p>
            </div>
          ) : (
            nearby.map(c => (
              <Link
                key={c.id}
                to={`/automjetet?company=${c.id}`}
                className={`block w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${selected?.id === c.id ? 'bg-primary-50 border-l-2 border-l-primary-600' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                    {c.logo_url ? (
                      <img src={c.logo_url} alt="" className="w-10 h-10 object-cover" />
                    ) : (
                      <Car className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-dark-900 truncate">{c.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-dark-400 truncate">{c.city}</span>
                      {c.vehicleCount != null && c.vehicleCount > 0 && (
                        <span className="text-xs text-primary-600 font-medium">{c.vehicleCount} vetura</span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    {c.distance != null && (
                      <p className="text-xs font-bold text-green-600">{c.distance.toFixed(1)} km</p>
                    )}
                    {c.rating > 0 && (
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-xs text-dark-500">{c.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-100">
          <Link to="/automjetet" className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors">
            Shiko te gjitha automjetet
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {selected && (
        <div className="absolute bottom-0 left-0 right-0 lg:left-auto lg:right-80 lg:bottom-3 lg:left-3 z-[1001]">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-4 mx-3 mb-3 lg:mx-0 lg:mb-0 max-w-sm">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                  {selected.logo_url ? (
                    <img src={selected.logo_url} alt="" className="w-10 h-10 object-cover" />
                  ) : (
                    <div className="w-10 h-10 flex items-center justify-center"><Car className="w-5 h-5 text-gray-400" /></div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-dark-950 text-sm">{selected.name}</p>
                  <p className="text-xs text-dark-400">{selected.city}{selected.address ? ` – ${selected.address}` : ''}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 text-dark-400 hover:text-dark-600 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-4 mb-3">
              {selected.vehicleCount != null && (
                <div className="flex items-center gap-1 text-xs text-dark-600">
                  <Car className="w-3.5 h-3.5 text-primary-600" />
                  {selected.vehicleCount} vetura disponibil
                </div>
              )}
              {selected.distance != null && (
                <div className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                  <Navigation className="w-3.5 h-3.5" />
                  {selected.distance.toFixed(1)} km
                </div>
              )}
              {selected.rating > 0 && (
                <div className="flex items-center gap-0.5 text-xs">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-dark-600">{selected.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            <Link
              to={`/automjetet?company=${selected.id}`}
              className="block text-center py-2 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition-colors"
            >
              Shiko automjetet e kesaj kompanie
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
