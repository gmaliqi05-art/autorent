import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Car, Eye, EyeOff, Loader2, CheckCircle2, User, Building2, Check, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { SubscriptionPlan, Country, City } from '../lib/types';
import TurnstileWidget from '../components/auth/TurnstileWidget';

type TabType = 'client' | 'company';
type BillingCycle = 'monthly' | 'yearly';

export default function RegisterPage() {
  const { t } = useTranslation();
  const { signUp, signUpCompany, user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialTab = searchParams.get('role') === 'company' ? 'company' : 'client';
  const initialPlanId = searchParams.get('plan') || '';
  const initialBilling = (searchParams.get('billing') === 'yearly' ? 'yearly' : 'monthly') as BillingCycle;
  const referralFromUrl = searchParams.get('ref') || '';

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [billing, setBilling] = useState<BillingCycle>(initialBilling);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCountryId, setSelectedCountryId] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId);

  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');

  useEffect(() => {
    if (user && profile && !success) {
      const path = profile.role === 'company_admin' ? '/kompania' : '/dashboard';
      navigate(path, { replace: true });
    }
  }, [user, profile, navigate, success]);

  useEffect(() => {
    if (countries.length === 0) {
      loadCountries();
    }
    if (activeTab === 'company') {
      if (plans.length === 0) {
        loadPlans();
      }
    }
  }, [activeTab]);

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

  async function loadPlans() {
    setPlansLoading(true);
    const { data } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    const loaded = (data || []) as SubscriptionPlan[];
    setPlans(loaded);
    if (loaded.length > 0) {
      if (initialPlanId && loaded.find(p => p.id === initialPlanId)) {
        setSelectedPlanId(initialPlanId);
      } else if (!selectedPlanId) {
        const popular = loaded.find(p => p.is_popular);
        const mid = loaded.length > 1 ? loaded[Math.floor(loaded.length / 2)] : loaded[0];
        setSelectedPlanId((popular || mid).id);
      }
    }
    setPlansLoading(false);
  }

  async function loadCountries() {
    const { data: countriesData } = await supabase
      .from('countries')
      .select('*')
      .order('name');
    const loadedCountries = (countriesData || []) as Country[];
    setCountries(loadedCountries);

    const { data: citiesData } = await supabase
      .from('cities')
      .select('*')
      .order('name');
    const loadedCities = (citiesData || []) as City[];
    setCities(loadedCities);

    if (loadedCountries.length > 0 && !selectedCountryId) {
      const kosovo = loadedCountries.find((c) => c.code === 'XK');
      if (kosovo) {
        setSelectedCountryId(kosovo.id);
      }
    }
  }

  function resetForm() {
    setFullName('');
    setEmail('');
    setPassword('');
    setCompanyName('');
    setPhone('');
    setSelectedCountryId('');
    setSelectedCityId('');
    setError('');
    if (activeTab === 'company' && countries.length > 0) {
      const kosovo = countries.find((c) => c.code === 'XK');
      if (kosovo) {
        setSelectedCountryId(kosovo.id);
      }
    }
  }

  function handleTabChange(tab: TabType) {
    setActiveTab(tab);
    resetForm();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError(t('auth.passwordMin'));
      return;
    }
    if (!captchaToken) {
      setError(t('auth.captchaRequired') || 'Plotesoni verifikimin CAPTCHA');
      return;
    }

    setLoading(true);

    if (activeTab === 'company') {
      if (!companyName.trim()) {
        setError(t('auth.companyNameRequired'));
        setLoading(false);
        return;
      }
      if (!phone.trim()) {
        setError(t('auth.phoneRequired'));
        setLoading(false);
        return;
      }
      if (!selectedCountryId) {
        setError(t('auth.countryRequired'));
        setLoading(false);
        return;
      }
      if (!selectedCityId) {
        setError(t('auth.cityRequired'));
        setLoading(false);
        return;
      }

      const selectedCountry = countries.find((c) => c.id === selectedCountryId);
      const selectedCity = cities.find((c) => c.id === selectedCityId);

      const result = await signUpCompany({
        email,
        password,
        fullName,
        companyName: companyName.trim(),
        phone: phone.trim(),
        city: selectedCity?.name || '',
        country: selectedCountry?.name || '',
        cityId: selectedCityId,
        countryId: selectedCountryId,
        subscriptionPlanId: selectedPlanId || undefined,
        billingCycle: billing,
        captchaToken,
      });

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      setSuccess(true);
      setLoading(false);
      setTimeout(() => navigate('/kompania'), 1500);
    } else {
      const result = await signUp(email, password, fullName, selectedCountryId || undefined, selectedCityId || undefined, captchaToken);
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      // Apliko kodin e referimit nese ka ne URL (silent — mos blloko signup-in).
      if (referralFromUrl) {
        try {
          const { applyReferralCode } = await import('../lib/useLoyalty');
          await applyReferralCode(referralFromUrl);
        } catch { /* ignore — useri mund ta apliko me vone */ }
      }
      setSuccess(true);
      setLoading(false);
      setTimeout(() => navigate('/dashboard'), 1500);
    }
  }

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  const getPlanPrice = (plan: SubscriptionPlan) => {
    if (billing === 'yearly' && plan.price_yearly > 0) {
      return Math.round(plan.price_yearly / 12);
    }
    return plan.price_monthly;
  };

  const inputClass =
    'w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-dark-900 placeholder:text-dark-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all';

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src={
            activeTab === 'company'
              ? 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop'
              : 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop'
          }
          alt={activeTab === 'company' ? 'Business team' : 'Car on road'}
          className="absolute inset-0 w-full h-full object-cover transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-dark-950/90 via-dark-950/70 to-primary-950/60" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">RentaKar</span>
          </Link>
          <div>
            {activeTab === 'company' ? (
              <>
                <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
                  {t('auth.growBusinessTitle')}<br />{t('auth.growBusinessTitle2')}
                </h2>
                <p className="text-white/60 text-lg leading-relaxed max-w-md mb-8">
                  {t('auth.growBusinessDesc')}
                </p>
                <div className="space-y-3">
                  {[
                    t('auth.growBenefit1'),
                    t('auth.growBenefit2'),
                    t('auth.growBenefit3'),
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span className="text-white/70 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
                {selectedPlan && (
                  <div className="mt-8 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                    <p className="text-white/50 text-xs uppercase tracking-wide font-semibold mb-1">{t('auth.selectedPlan')}</p>
                    <p className="text-white font-bold text-lg">{selectedPlan.name}</p>
                    <p className="text-white/70 text-sm">
                      {billing === 'yearly' && selectedPlan.price_yearly > 0
                        ? `${Math.round(selectedPlan.price_yearly / 12)} ${t('auth.perMonthEur')} · ${selectedPlan.price_yearly} ${t('auth.perYearEur')}`
                        : selectedPlan.price_monthly === 0
                          ? t('auth.free')
                          : `${selectedPlan.price_monthly} ${t('auth.perMonthEur')}`
                      }
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
                  {t('auth.startJourneyTitle')}<br />{t('auth.startJourneyTitle2')}
                </h2>
                <p className="text-white/60 text-lg leading-relaxed max-w-md mb-8">
                  {t('auth.startJourneyDesc')}
                </p>
                <div className="space-y-3">
                  {[
                    t('auth.startBenefit1'),
                    t('auth.startBenefit2'),
                    t('auth.startBenefit3'),
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span className="text-white/70 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <p className="text-white/30 text-sm">&copy; {new Date().getFullYear()} Booking Shpk</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 sm:px-10 py-12 bg-gray-50 overflow-y-auto">
        <div className={`w-full ${activeTab === 'company' ? 'max-w-[600px]' : 'max-w-[440px]'}`}>
          <div className="lg:hidden mb-10">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary-600">
                <Car className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-dark-950">RentaKar</span>
            </Link>
          </div>

          {success ? (
            <div className="text-center py-16 animate-scale-in">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-dark-950 mb-2">
                {activeTab === 'company' ? t('auth.companyRegistered') : t('auth.accountCreated')}
              </h2>
              <p className="text-dark-500">
                {activeTab === 'company'
                  ? t('auth.redirectingCompany')
                  : t('auth.redirectingClient')}
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-dark-950 mb-1.5">{t('auth.registerTitle')}</h1>
              <p className="text-dark-500 mb-6 text-[15px]">{t('auth.registerSubtitle')}</p>

              <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                <button
                  type="button"
                  onClick={() => handleTabChange('client')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'client'
                      ? 'bg-white text-dark-900 shadow-sm'
                      : 'text-dark-400 hover:text-dark-600'
                  }`}
                >
                  <User className="w-4 h-4" />
                  {t('auth.tabClient')}
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('company')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'company'
                      ? 'bg-white text-dark-900 shadow-sm'
                      : 'text-dark-400 hover:text-dark-600'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  {t('auth.tabCompany')}
                </button>
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                  {error}
                </div>
              )}

              {activeTab === 'company' && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-dark-700">{t('auth.selectPlan')}</label>
                    <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => setBilling('monthly')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                          billing === 'monthly' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-400 hover:text-dark-600'
                        }`}
                      >
                        {t('auth.monthly')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setBilling('yearly')}
                        className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                          billing === 'yearly' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-400 hover:text-dark-600'
                        }`}
                      >
                        {t('auth.yearly')}
                        <span className={`text-[9px] font-bold px-1 py-0.5 rounded-full ${billing === 'yearly' ? 'bg-green-100 text-green-700' : 'bg-green-100 text-green-700'}`}>{t('auth.save20')}</span>
                      </button>
                    </div>
                  </div>

                  {plansLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {plans.map((plan) => {
                        const isSelected = selectedPlanId === plan.id;
                        const price = getPlanPrice(plan);
                        return (
                          <button
                            key={plan.id}
                            type="button"
                            onClick={() => setSelectedPlanId(plan.id)}
                            className={`relative text-left p-3.5 rounded-xl border-2 transition-all ${
                              isSelected
                                ? 'border-primary-500 bg-primary-50/50 shadow-sm shadow-primary-100'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            {plan.is_popular && (
                              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap">
                                <Star className="w-2 h-2" />
                                {t('auth.popular')}
                              </span>
                            )}
                            <div className="flex items-start justify-between mb-1.5">
                              <span className="text-xs font-bold text-dark-900 leading-tight">{plan.name}</span>
                              {isSelected && (
                                <div className="w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center shrink-0 ml-1">
                                  <Check className="w-2.5 h-2.5 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="mb-1">
                              {price === 0 ? (
                                <span className="text-base font-bold text-dark-950">{t('auth.free')}</span>
                              ) : (
                                <>
                                  <span className="text-base font-bold text-dark-950">{price}</span>
                                  <span className="text-[10px] text-dark-400"> {t('auth.perMonthEur')}</span>
                                </>
                              )}
                            </div>
                            {billing === 'yearly' && plan.price_yearly > 0 && (
                              <p className="text-[10px] text-green-600 font-medium">{plan.price_yearly} {t('auth.perYearEur')}</p>
                            )}
                            <div className="mt-1.5 pt-1.5 border-t border-gray-100">
                              <p className="text-[10px] text-dark-400 leading-tight">
                                {plan.max_vehicles === -1 ? t('auth.noLimit') : t('auth.vehiclesCount', { count: plan.max_vehicles })}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {selectedPlan && selectedPlan.price_monthly > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-blue-800">{selectedPlan.name} · {billing === 'yearly' ? t('auth.yearlyBilling') : t('auth.monthlyBilling')}</p>
                          <p className="text-xs text-blue-600 mt-0.5">
                            {billing === 'yearly'
                              ? t('auth.yearlySaving', { total: selectedPlan.price_yearly, saving: selectedPlan.price_monthly * 12 - selectedPlan.price_yearly })
                              : t('auth.monthlyAuto', { price: selectedPlan.price_monthly })
                            }
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-900">
                            {billing === 'yearly' ? `${Math.round(selectedPlan.price_yearly / 12)}` : `${selectedPlan.price_monthly}`}
                            <span className="text-xs font-normal text-blue-600"> {t('auth.perMonthEur')}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="reg-fullname" className="block text-sm font-medium text-dark-700 mb-1.5">
                    {activeTab === 'company' ? t('auth.ownerName') : t('auth.fullName')}
                  </label>
                  <input
                    id="reg-fullname"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className={inputClass}
                    placeholder={t('auth.ownerNamePlaceholder')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="reg-country" className="block text-sm font-medium text-dark-700 mb-1.5">
                      {t('vehicles.country', 'Shteti')}
                    </label>
                    <select
                      id="reg-country"
                      name="country"
                      autoComplete="country"
                      value={selectedCountryId}
                      onChange={(e) => setSelectedCountryId(e.target.value)}
                      className={inputClass}
                      required={activeTab === 'company'}
                    >
                      <option value="">{t('auth.selectCountry')}</option>
                      {countries.map((country) => (
                        <option key={country.id} value={country.id}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="reg-city" className="block text-sm font-medium text-dark-700 mb-1.5">
                      {t('vehicles.city', 'Qyteti')}
                    </label>
                    <select
                      id="reg-city"
                      name="city"
                      autoComplete="address-level2"
                      value={selectedCityId}
                      onChange={(e) => setSelectedCityId(e.target.value)}
                      className={inputClass}
                      required={activeTab === 'company'}
                      disabled={!selectedCountryId || filteredCities.length === 0}
                    >
                      <option value="">{t('auth.selectCity')}</option>
                      {filteredCities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {activeTab === 'company' && (
                  <>
                    <div>
                      <label htmlFor="reg-company-name" className="block text-sm font-medium text-dark-700 mb-1.5">
                        {t('auth.companyName')}
                      </label>
                      <input
                        id="reg-company-name"
                        name="companyName"
                        type="text"
                        autoComplete="organization"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                        className={inputClass}
                        placeholder={t('auth.companyNamePlaceholder')}
                      />
                    </div>
                    <div>
                      <label htmlFor="reg-phone" className="block text-sm font-medium text-dark-700 mb-1.5">
                        {t('auth.phone')}
                      </label>
                      <input
                        id="reg-phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className={inputClass}
                        placeholder={t('auth.phonePlaceholder')}
                      />
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="reg-email" className="block text-sm font-medium text-dark-700 mb-1.5">{t('auth.email')}</label>
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={inputClass}
                    placeholder={t('auth.emailPlaceholder')}
                  />
                </div>

                <div>
                  <label htmlFor="reg-password" className="block text-sm font-medium text-dark-700 mb-1.5">
                    {t('auth.password')}
                  </label>
                  <div className="relative">
                    <input
                      id="reg-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className={`${inputClass} pr-11`}
                      placeholder={t('auth.passwordMinPlaceholder')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? t('auth.hidePassword', 'Fshih fjalekalimin') : t('auth.showPassword', 'Shfaq fjalekalimin')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-[18px] h-[18px]" />
                      ) : (
                        <Eye className="w-[18px] h-[18px]" />
                      )}
                    </button>
                  </div>
                </div>

                <TurnstileWidget
                  onVerify={setCaptchaToken}
                  onExpire={() => setCaptchaToken('')}
                  onError={() => setCaptchaToken('')}
                  action="register"
                />

                <button
                  type="submit"
                  disabled={loading || !captchaToken}
                  className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm shadow-primary-600/20 active:scale-[0.98]"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading
                    ? t('auth.registering')
                    : activeTab === 'company'
                      ? t('auth.registerCompanyButton')
                      : t('auth.registerButton')}
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-dark-400 leading-relaxed">
                {t('auth.termsPrefix')}{' '}
                <Link
                  to="/kushtet-perdorimit"
                  className="text-primary-600 hover:underline"
                >
                  {t('auth.termsTerms')}
                </Link>
                {' '}{t('auth.termsAnd')}{' '}
                <Link
                  to="/politika-privatesise"
                  className="text-primary-600 hover:underline"
                >
                  {t('auth.termsPrivacy')}
                </Link>
                .
              </p>
              <p className="mt-6 text-center text-sm text-dark-500">
                {t('auth.haveAccount')}{' '}
                <Link
                  to="/login"
                  className="text-primary-600 font-semibold hover:text-primary-700 transition-colors"
                >
                  {t('auth.loginLink')}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
