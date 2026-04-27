import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Loader2, Car, ArrowUpDown } from 'lucide-react';
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

const categories = [
  { value: '', label: 'Te gjitha' },
  { value: 'ekonomike', label: 'Ekonomike' },
  { value: 'kompakte', label: 'Kompakte' },
  { value: 'sedan', label: 'Sedan' },
  { value: 'suv', label: 'SUV' },
  { value: 'luksoz', label: 'Luksoze' },
  { value: 'minivan', label: 'Minivan' },
  { value: 'furgon', label: 'Furgon' },
];

const transmissions = [
  { value: '', label: 'Te gjitha' },
  { value: 'manuale', label: 'Manuale' },
  { value: 'automatike', label: 'Automatike' },
];

const fuels = [
  { value: '', label: 'Te gjitha' },
  { value: 'benzine', label: 'Benzine' },
  { value: 'nafte', label: 'Nafte' },
  { value: 'elektrike', label: 'Elektrike' },
  { value: 'hibride', label: 'Hibride' },
];

const sortOptions = [
  { value: 'newest', label: 'Me te rejat' },
  { value: 'price_asc', label: 'Cmimi: i ulet' },
  { value: 'price_desc', label: 'Cmimi: i larte' },
];

export default function VehicleListPage() {
  const [searchParams] = useSearchParams();
  const [vehicles, setVehicles] = useState<VehicleWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [transmission, setTransmission] = useState('');
  const [fuel, setFuel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [selectedCountryId, setSelectedCountryId] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');

  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);

  useEffect(() => {
    loadCountries();
  }, []);

  useEffect(() => {
    loadVehicles();
  }, [category, transmission, fuel, sort, priceRange, selectedCountryId, selectedCityId]);

  useEffect(() => {
    if (selectedCountryId && cities.length > 0) {
      const filtered = cities.filter((city) => city.country_id === selectedCountryId);
      setFilteredCities(filtered);
      if (filtered.length > 0 && !filtered.find((c) => c.id === selectedCityId)) {
        setSelectedCityId('');
      }
    } else {
      setFilteredCities([]);
      setSelectedCityId('');
    }
  }, [selectedCountryId, cities]);

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
      .gte('price_per_day', priceRange[0])
      .lte('price_per_day', priceRange[1]);

    if (category) query = query.eq('category', category);
    if (transmission) query = query.eq('transmission', transmission);
    if (fuel) query = query.eq('fuel_type', fuel);

    if (sort === 'price_asc') query = query.order('price_per_day', { ascending: true });
    else if (sort === 'price_desc') query = query.order('price_per_day', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const { data } = await query.limit(50);
    let results = (data || []) as VehicleWithCompany[];

    if (selectedCountryId) {
      results = results.filter(v => v.company?.country_id === selectedCountryId);
    }

    if (selectedCityId) {
      results = results.filter(v => v.company?.city_id === selectedCityId);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(v =>
        `${v.brand} ${v.model}`.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q)
      );
    }

    setVehicles(results);
    setLoading(false);
  }

  function clearFilters() {
    setCategory('');
    setTransmission('');
    setFuel('');
    setSearchQuery('');
    setPriceRange([0, 200]);
    setSort('newest');
    setSelectedCountryId('');
    setSelectedCityId('');
  }

  const hasActiveFilters = category || transmission || fuel || priceRange[0] > 0 || priceRange[1] < 200 || selectedCountryId || selectedCityId;

  return (
    <div className="min-h-screen bg-gray-50/80 pt-[68px]">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-dark-950 mb-2">Automjetet ne dispozicion</h1>
          <p className="text-dark-500">Gjeni automjetin perfekt per udhetimin tuaj</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className={`lg:w-64 shrink-0 ${filtersOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-dark-950 text-sm">Filtrat</h3>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs text-primary-600 font-medium hover:text-primary-700 transition-colors">
                    Pastro
                  </button>
                )}
              </div>

              <div className="space-y-5">
                <FilterGroup label="Kerko">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && loadVehicles()}
                      placeholder="p.sh. BMW X5..."
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-dark-900 placeholder:text-dark-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    />
                  </div>
                </FilterGroup>

                <FilterGroup label="Shteti">
                  <select
                    value={selectedCountryId}
                    onChange={e => setSelectedCountryId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  >
                    <option value="">Te gjitha shtetet</option>
                    {countries.map(country => (
                      <option key={country.id} value={country.id}>{country.name}</option>
                    ))}
                  </select>
                </FilterGroup>

                <FilterGroup label="Qyteti">
                  <select
                    value={selectedCityId}
                    onChange={e => setSelectedCityId(e.target.value)}
                    disabled={!selectedCountryId}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Te gjitha qytetet</option>
                    {filteredCities.map(city => (
                      <option key={city.id} value={city.id}>{city.name}</option>
                    ))}
                  </select>
                </FilterGroup>

                <FilterGroup label="Kategoria">
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

                <FilterGroup label="Transmisioni">
                  <div className="flex gap-1.5">
                    {transmissions.map(t => (
                      <button
                        key={t.value}
                        onClick={() => setTransmission(t.value)}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          transmission === t.value
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'bg-gray-50 text-dark-600 hover:bg-gray-100'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </FilterGroup>

                <FilterGroup label="Karburanti">
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

                <FilterGroup label={`Cmimi: ${priceRange[0]}EUR - ${priceRange[1]}EUR`}>
                  <input
                    type="range"
                    min={0}
                    max={200}
                    step={5}
                    value={priceRange[1]}
                    onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="w-full accent-primary-600"
                  />
                  <div className="flex justify-between text-[10px] text-dark-400 mt-1">
                    <span>0EUR</span>
                    <span>200EUR</span>
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
                  Filtrat
                  {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary-600" />}
                </button>
                <p className="text-sm text-dark-500">
                  {loading ? 'Duke kerkuar...' : `${vehicles.length} automjete`}
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
                <h3 className="text-lg font-semibold text-dark-900 mb-1">Nuk u gjeten automjete</h3>
                <p className="text-sm text-dark-500 mb-6">Provoni te ndryshoni filtrat ose kerkimin.</p>
                <button onClick={clearFilters} className="px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors">
                  Pastro filtrat
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
