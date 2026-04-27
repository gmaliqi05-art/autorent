import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Fuel, Users, Cog, Loader2, Star, ChevronLeft, ChevronRight, Pause, Play, Navigation } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Vehicle } from '../../lib/types';
import type { HomepageSettings } from '../../lib/useHomepageSettings';

const VEHICLES_PER_PAGE = 6;
const ROTATION_INTERVAL = 10000;

type VehicleWithCompany = Vehicle & {
  company?: { id: string; name: string; slug: string; city: string; rating: number; latitude?: number; longitude?: number };
  distance?: number;
};

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

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function FeaturedVehicles({ settings }: { settings?: HomepageSettings }) {
  const [allVehicles, setAllVehicles] = useState<VehicleWithCompany[]>([]);
  const [rawVehicles, setRawVehicles] = useState<VehicleWithCompany[]>([]);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from('vehicles')
      .select('*, company:companies(id, name, slug, city, rating, latitude, longitude)')
      .eq('is_published', true)
      .eq('is_available', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(60)
      .then(({ data }) => {
        const shuffled = shuffleArray(data || []);
        setRawVehicles(shuffled);
        setAllVehicles(shuffled);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const { lat, lng } = (e as CustomEvent).detail;
      setUserPos({ lat, lng });
    };
    window.addEventListener('userLocationUpdated', handler);
    return () => window.removeEventListener('userLocationUpdated', handler);
  }, []);

  useEffect(() => {
    if (!userPos || rawVehicles.length === 0) return;
    const sorted = rawVehicles
      .map(v => ({
        ...v,
        distance: v.company?.latitude && v.company?.longitude
          ? haversineKm(userPos.lat, userPos.lng, v.company.latitude, v.company.longitude)
          : undefined,
      }))
      .sort((a, b) => {
        if (a.distance != null && b.distance != null) return a.distance - b.distance;
        if (a.distance != null) return -1;
        if (b.distance != null) return 1;
        return 0;
      });
    setAllVehicles(sorted);
    setCurrentPage(0);
  }, [userPos, rawVehicles]);

  const totalPages = Math.max(1, Math.ceil(allVehicles.length / VEHICLES_PER_PAGE));

  const goToPage = useCallback((page: number) => {
    setIsTransitioning(true);
    setProgress(0);
    setTimeout(() => {
      setCurrentPage(page % totalPages);
      setIsTransitioning(false);
    }, 400);
  }, [totalPages]);

  const goNext = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const goPrev = useCallback(() => {
    goToPage((currentPage - 1 + totalPages) % totalPages);
  }, [currentPage, totalPages, goToPage]);

  useEffect(() => {
    if (allVehicles.length <= VEHICLES_PER_PAGE || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
      return;
    }

    setProgress(0);

    progressRef.current = setInterval(() => {
      setProgress(prev => {
        const next = prev + (100 / (ROTATION_INTERVAL / 50));
        return next >= 100 ? 100 : next;
      });
    }, 50);

    timerRef.current = setInterval(() => {
      goNext();
    }, ROTATION_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [allVehicles.length, isPaused, currentPage, goNext]);

  const startIdx = currentPage * VEHICLES_PER_PAGE;
  const currentVehicles = allVehicles.slice(startIdx, startIdx + VEHICLES_PER_PAGE);

  if (loading) {
    return (
      <section className="py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 text-primary-600 animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  if (allVehicles.length === 0) return null;

  return (
    <section className="py-24 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-14 gap-4">
          <div>
            <p className="text-primary-600 font-semibold text-sm tracking-wide uppercase mb-2">{settings?.sections.featured_subtitle ?? 'Te zgjedhura'}</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-dark-950 leading-tight">
              {userPos ? 'Automjetet me te aferta me ju' : (settings?.sections.featured_title ?? 'Automjete te rekomanduara')}
            </h2>
            {userPos && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-green-600 font-medium">
                <Navigation className="w-3.5 h-3.5" />
                Renditur sipas distances nga pozicioni juaj
              </div>
            )}
          </div>
          <Link to="/automjetet" className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors group">
            Shiko te gjitha
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div
          ref={containerRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-400 ${
              isTransitioning ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'
            }`}
          >
            {currentVehicles.map(v => (
              <VehicleItem key={v.id} vehicle={v} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-10 flex flex-col items-center gap-5">
              <div className="w-full max-w-xs h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-600 rounded-full transition-all duration-100 ease-linear"
                  style={{ width: `${isPaused ? progress : progress}%` }}
                />
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={goPrev}
                  className="p-2 rounded-xl bg-white border border-gray-200 text-dark-500 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95"
                  aria-label="Mbrapa"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goToPage(i)}
                      className={`transition-all duration-300 rounded-full ${
                        i === currentPage
                          ? 'w-8 h-2.5 bg-primary-600'
                          : 'w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label={`Faqja ${i + 1}`}
                    />
                  ))}
                </div>

                <button
                  onClick={goNext}
                  className="p-2 rounded-xl bg-white border border-gray-200 text-dark-500 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95"
                  aria-label="Para"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className={`p-2 rounded-xl border transition-all active:scale-95 ${
                    isPaused
                      ? 'bg-primary-50 border-primary-200 text-primary-600'
                      : 'bg-white border-gray-200 text-dark-500 hover:bg-gray-50'
                  }`}
                  aria-label={isPaused ? 'Vazhdo' : 'Ndalo'}
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </button>
              </div>

              <p className="text-xs text-dark-400">
                {currentPage + 1} / {totalPages} ({allVehicles.length} automjete gjithsej)
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function VehicleItem({ vehicle }: { vehicle: VehicleWithCompany }) {
  return (
    <Link
      to={'/automjetet/' + vehicle.id}
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-dark-950/5 hover:-translate-y-1 transition-all duration-300"
    >
      <div className="aspect-[16/10] bg-gray-100 overflow-hidden relative">
        <img
          src={vehicle.main_image_url || 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop'}
          alt={vehicle.brand + ' ' + vehicle.model}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-xs font-semibold text-dark-800 shadow-sm capitalize">
            {vehicle.category}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="px-3 py-1 rounded-lg bg-primary-600 text-xs font-bold text-white shadow-sm">
            {vehicle.price_per_day} EUR/dite
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-lg font-bold text-dark-900 group-hover:text-primary-600 transition-colors">
            {vehicle.brand} {vehicle.model}
          </h3>
          <span className="text-xs text-dark-400 font-medium mt-1">{vehicle.year}</span>
        </div>

        {vehicle.company && (
          <div className="flex items-center gap-1.5 mb-4 flex-wrap">
            <MapPin className="w-3 h-3 text-dark-400 shrink-0" />
            <span className="text-xs text-dark-500 truncate">{vehicle.company.name} — {vehicle.company.city}</span>
            <div className="flex items-center gap-2 ml-auto">
              {vehicle.distance != null && (
                <span className="flex items-center gap-0.5 text-xs text-green-600 font-semibold">
                  <Navigation className="w-3 h-3" />
                  {vehicle.distance.toFixed(0)} km
                </span>
              )}
              {vehicle.company.rating > 0 && (
                <span className="flex items-center gap-0.5 text-xs text-accent-600 font-medium">
                  <Star className="w-3 h-3 fill-accent-500 text-accent-500" />
                  {vehicle.company.rating}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-5 pt-4 border-t border-gray-50">
          <div className="flex items-center gap-1.5 text-xs text-dark-500">
            <Cog className="w-3.5 h-3.5 text-dark-400" />
            {vehicle.transmission === 'automatike' ? 'Auto' : 'Manuale'}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-dark-500">
            <Fuel className="w-3.5 h-3.5 text-dark-400" />
            <span className="capitalize">{vehicle.fuel_type}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-dark-500">
            <Users className="w-3.5 h-3.5 text-dark-400" />
            {vehicle.seats} vende
          </div>
        </div>
      </div>
    </Link>
  );
}
