import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Loader2, Car, ArrowUpDown, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import type { Vehicle, Country, City } from '../lib/types';
import VehicleCard from '../components/vehicles/VehicleCard';

type VehicleWithCompany = Vehicle & {
  company?: {
    id: string;
    name: string;
    slug: string;
    city: string;
    rating: number;
    country_id: string | null;
    city_id: string | null;
  }
};

const PRICE_MIN = 0;
const PRICE_MAX = 500;

export default function VehicleListPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [vehicles, setVehicles] = useState<VehicleWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [transmission, setTransmission] = useState('');
  const [fuel, setFuel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [priceRange, setPriceRange] = useState<[number, number]>([PRICE_MIN, PRICE_MAX]);
  const [selectedCountryId, setSelectedCountryId] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [pickupDate, setPickupDate] = useState(searchParams.get('pickup') || '');
  const [returnDate, setReturnDate] = useState(searchParams.get('return') || '');

  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);

  const categories = useMemo(() => [
    { value: '', label: t('vehicles.all') },
    { value: 'ekonomike', label: t('vehicles.categories.ekonomike') },
    { value: 'kompakte', label: t('vehicles.categories.kompakte') },
    { value: 'sedan', label: t('vehicles.categories.sedan') },
    { value: 'suv', label: t('vehicles.categories.suv') },
    { value: 'luksoz', label: t('vehicles.categories.luksoz') },
    { value: 'minivan', label: t('vehicles.categories.minivan') },
    { value: 'furgon', label: t('vehicles.categories.furgon') },
  ], [t]);

  const transmissions = useMemo(() => [
    { value: '', label: t('vehicles.all') },
    { value: 'manuale', label: t('vehicles.transmissions.manuale') },
    { value: 'automatike', label: t('vehicles.transmissions.automatike') },
  ], [t]);

  const fuels = useMemo(() => [
    { value: '', label: t('vehicles.all') },
    { value: 'benzine', label: t('vehicles.fuels.benzine') },
    { value: 'nafte', label: t('vehicles.fuels.nafte') },
    { value: 'elektrike', label: t('vehicles.fuels.elektrike') },
    { value: 'hibride', label: t('vehicles.fuels.hibride') },
  ], [t]);

  const sortOptions = useMemo(() => [
    { value: 'newest', label: t('vehicles.sortNewest') },
    { value: 'price_asc', label: t('vehicles.sortPriceLow') },
    { value: 'price_desc', label: t('vehicles.sortPriceHigh') },
  ], [t]);

  useEffect(() => {
    loadCountries();
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchQuery), 250);
    return () => clearTimeout(id);
  }, [searchQuery]);

  useEffect(() => {
    loadVehicles();
  }, [category, transmission, fuel, sort, priceRange, selectedCountryId, selectedCityId, debouncedSearch, pickupDate, returnDate]);

  useEffect(() => {
    if (selectedCountryId && cities.length > 0) {
      const filtered = cities.filter((city) => city.country_id === selectedCountryId);
      setFilteredCities(filtered);
      if (filtered.length > 0 && selectedCityId && !filtered.find((c) => c.id === selectedCityId)) {
        setSelectedCityId('');
      }
    } else {
      setFilteredCities([]);
    }
  }, [selectedCountryId, cities]);

  useEffect(() => {
    const cityParam = searchParams.get('city');
    if (cityParam && cities.length > 0 && !selectedCityId) {
      const match = cities.find(c => c.id === cityParam)
        || cities.find(c => c.name.toLowerCase() === cityParam.toLowerCase());
      if (match) {
        setSelectedCountryId(match.country_id);
        setSelectedCityId(match.id);
      }
    }
  }, [cities, searchParams]);

  async function loadCountries() {
    const { data: countriesData } = await supabase
      .from('countries')
      .select('*')
      .order('name');
    setCountries((countriesData || []) as Country[]);

    const { data: citiesData } = await supabase
      .from('cities')
      .select('*')
      .order('name');
    setCities((citiesData || []) as City[]);
  }

  async function loadVehicles() {
    setLoading(true);
    let query = supabase
      .from('vehicles')
      .select('*, company:companies(id, name, slug, city, rating, country_id, city_id)')
      .eq('is_published', true)
      .eq('is_available', true)
      .eq('status', 'active')
      .is('deleted_at', null)
      .gte('price_per_day', priceRange[0])
      .lte('price_per_day', priceRange[1]);

    if (category) query = query.eq('category', category);
    if (transmission) query = query.eq('transmission', transmission);
    if (fuel) query = query.eq('fuel_type', fuel);

    if (sort === 'price_asc') query = query.order('price_per_day', { ascending: true });
    else if (sort === 'price_desc') query = query.order('price_per_day', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const { data } = await query.limit(100);
    let results = (data || []) as VehicleWithCompany[];

    if (selectedCountryId) {
      results = results.filter(v => v.company?.country_id === selectedCountryId);
    }

    if (selectedCityId) {
      results = results.filter(v => v.company?.city_id === selectedCityId);
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      results = results.filter(v =>
        `${v.brand} ${v.model}`.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q)
      );
    }

    if (pickupDate && returnDate && results.length > 0) {
      const ids = results.map(v => v.id);
      const { data: conflicts } = await supabase
        .from('bookings')
        .select('vehicle_id')
        .in('vehicle_id', ids)
        .in('status', ['pending', 'confirmed', 'active'])
        .lt('pickup_date', returnDate)
        .gt('return_date', pickupDate);
      const blocked = new Set((conflicts || []).map(c => c.vehicle_id as string));
      results = results.filter(v => !blocked.has(v.id));
    }

    setVehicles(results);
    setLoading(false);
  }

  function clearFilters() {
    setCategory('');
    setTransmission('');
    setFuel('');
    setSearchQuery('');
    setPriceRange([PRICE_MIN, PRICE_MAX]);
    setSort('newest');
    setSelectedCountryId('');
    setSelectedCityId('');
    setPickupDate('');
    setReturnDate('');
  }

  const hasActiveFilters = !!(category || transmission || fuel || priceRange[0] > PRICE_MIN || priceRange[1] < PRICE_MAX || selectedCountryId || selectedCityId || pickupDate || returnDate);

  return (
    <div className="min-h-screen bg-gray-50/80 pt-[68px]">
      <Helmet>
        <title>Automjete me qira - RentaKar</title>
        <meta name="description" content="Shfletoni qindra automjete me qira nga Kosova, Shqiperia dhe Maqedonia. Filtra sipas qytetit, kategorise, transmisionit dhe cmimit." />
        <link rel="canonical" href="https://rentcars.life/automjetet" />
        <meta property="og:title" content="Automjete me qira - RentaKar" />
        <meta property="og:url" content="https://rentcars.life/automjetet" />
      </Helmet>
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-dark-950 mb-2">{t('vehicles.title')}</h1>
          <p className="text-dark-500">{t('vehicles.pageDesc')}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className={`lg:w-64 shrink-0 ${filtersOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-dark-950 text-sm">{t('vehicles.filters')}</h3>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs text-primary-600 font-medium hover:text-primary-700 transition-colors">
                    {t('common.clear', 'Pastro')}
                  </button>
                )}
              </div>

              <div className="space-y-5">
                <FilterGroup label={t('common.search', 'Kerko')}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder={t('vehicles.searchPlaceholder')}
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-dark-900 placeholder:text-dark-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    />
                  </div>
                </FilterGroup>

                <div className="grid grid-cols-2 gap-2">
                  <FilterGroup label={t('vehicles.pickupDate', 'Marrja')}>
                    <div className="relative">
                      <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-400 pointer-events-none" />
                      <input
                        type="date"
                        value={pickupDate}
                        onChange={e => setPickupDate(e.target.value)}
                        className="w-full pl-8 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                      />
                    </div>
                  </FilterGroup>
                  <FilterGroup label={t('vehicles.returnDate', 'Kthimi')}>
                    <div className="relative">
                      <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-400 pointer-events-none" />
                      <input
                        type="date"
                        value={returnDate}
                        min={pickupDate || undefined}
                        onChange={e => setReturnDate(e.target.value)}
                        className="w-full pl-8 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                      />
                    </div>
                  </FilterGroup>
                </div>

                <FilterGroup label={t('vehicles.country')}>
                  <select
                    value={selectedCountryId}
                    onChange={e => setSelectedCountryId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  >
                    <option value="">{t('vehicles.allCountries')}</option>
                    {countries.map(country => (
                      <option key={country.id} value={country.id}>{country.name}</option>
                    ))}
                  </select>
                </FilterGroup>

                <FilterGroup label={t('vehicles.city')}>
                  <select
                    value={selectedCityId}
                    onChange={e => setSelectedCityId(e.target.value)}
                    disabled={!selectedCountryId}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">{t('vehicles.allCities')}</option>
                    {filteredCities.map(city => (
                      <option key={city.id} value={city.id}>{city.name}</option>
                    ))}
                  </select>
                </FilterGroup>

                <FilterGroup label={t('vehicles.category')}>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map(c => (
                      <button
                        key={c.value}
                        onClick={() => setCategory(c.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          category === c.value
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'bg-gray-50 text-dark-600 hover:bg-gray-100'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </FilterGroup>

                <FilterGroup label={t('vehicles.transmission')}>
                  <div className="flex gap-1.5">
                    {transmissions.map(tr => (
                      <button
                        key={tr.value}
                        onClick={() => setTransmission(tr.value)}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          transmission === tr.value
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'bg-gray-50 text-dark-600 hover:bg-gray-100'
                        }`}
                      >
                        {tr.label}
                      </button>
                    ))}
                  </div>
                </FilterGroup>

                <FilterGroup label={t('vehicles.fuel')}>
                  <div className="flex flex-wrap gap-1.5">
                    {fuels.map(f => (
                      <button
                        key={f.value}
                        onClick={() => setFuel(f.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          fuel === f.value
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'bg-gray-50 text-dark-600 hover:bg-gray-100'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </FilterGroup>

                <FilterGroup label={t('vehicles.priceRange', { min: priceRange[0], max: priceRange[1] })}>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-dark-500 mb-1">Min</label>
                      <input
                        type="number"
                        min={PRICE_MIN}
                        max={priceRange[1]}
                        step={5}
                        value={priceRange[0]}
                        onChange={e => {
                          const v = Math.max(PRICE_MIN, Math.min(priceRange[1], Number(e.target.value) || 0));
                          setPriceRange([v, priceRange[1]]);
                        }}
                        className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-dark-500 mb-1">Max</label>
                      <input
                        type="number"
                        min={priceRange[0]}
                        max={PRICE_MAX}
                        step={5}
                        value={priceRange[1]}
                        onChange={e => {
                          const v = Math.min(PRICE_MAX, Math.max(priceRange[0], Number(e.target.value) || 0));
                          setPriceRange([priceRange[0], v]);
                        }}
                        className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min={PRICE_MIN}
                    max={PRICE_MAX}
                    step={5}
                    value={priceRange[0]}
                    onChange={e => {
                      const v = Math.min(priceRange[1], Number(e.target.value));
                      setPriceRange([v, priceRange[1]]);
                    }}
                    className="w-full accent-primary-600 mt-2"
                  />
                  <input
                    type="range"
                    min={PRICE_MIN}
                    max={PRICE_MAX}
                    step={5}
                    value={priceRange[1]}
                    onChange={e => {
                      const v = Math.max(priceRange[0], Number(e.target.value));
                      setPriceRange([priceRange[0], v]);
                    }}
                    className="w-full accent-primary-600"
                  />
                  <div className="flex justify-between text-[10px] text-dark-400 mt-1">
                    <span>{PRICE_MIN}EUR</span>
                    <span>{PRICE_MAX}EUR</span>
                  </div>
                </FilterGroup>
              </div>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5 gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-dark-700 hover:bg-gray-50 transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {t('vehicles.filters')}
                  {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary-600" />}
                </button>
                <p className="text-sm text-dark-500">
                  {loading ? t('vehicles.searching') : `${vehicles.length} ${t('vehicles.results')}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-dark-400" />
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                  className="text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 text-dark-700 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
                >
                  {sortOptions.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-32">
                <Loader2 className="w-7 h-7 text-primary-600 animate-spin" />
              </div>
            ) : vehicles.length === 0 ? (
              <div className="text-center py-32">
                <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-dark-900 mb-1">{t('vehicles.noVehicles')}</h3>
                <p className="text-sm text-dark-500 mb-6">{t('vehicles.noVehiclesDesc')}</p>
                <button onClick={clearFilters} className="px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors">
                  {t('vehicles.clearFilters')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {vehicles.map(v => <VehicleCard key={v.id} vehicle={v} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-dark-700 mb-2">{label}</label>
      {children}
    </div>
  );
}
