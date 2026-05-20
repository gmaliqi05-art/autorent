import { useState, useEffect } from 'react';
import { Check, Crown, Zap, Star, Gem, AlertCircle, CheckCircle2, RefreshCw, Calendar, ArrowUpRight, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Company, SubscriptionPlan } from '../../lib/types';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { companyNavItems } from '../../lib/companyNav';
import { formatDateLong } from '../../lib/companyDashHelpers';

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free: <Star className="w-5 h-5" />,
  standard: <Zap className="w-5 h-5" />,
  premium: <Crown className="w-5 h-5" />,
  'super premium': <Gem className="w-5 h-5" />,
};

function getPlanIcon(name: string) {
  const key = name.toLowerCase();
  return PLAN_ICONS[key] || <Star className="w-5 h-5" />;
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function CompanySubscription() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [company, setCompany] = useState<Company | null>(null);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [allPlans, setAllPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [changingTo, setChangingTo] = useState<string | null>(null);
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [confirmPlan, setConfirmPlan] = useState<SubscriptionPlan | null>(null);
  const [vehicleCount, setVehicleCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('companies').select('*').eq('owner_id', user.id).maybeSingle(),
      supabase.from('subscription_plans').select('*').eq('is_active', true).order('sort_order'),
    ]).then(async ([{ data: companyData }, { data: plansData }]) => {
      if (companyData) {
        const { count } = await supabase
          .from('vehicles')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', (companyData as Company).id)
          .is('deleted_at', null);
        setVehicleCount(count || 0);
      }
      const c = companyData as Company | null;
      const plans = (plansData || []) as SubscriptionPlan[];
      setCompany(c);
      setAllPlans(plans);
      if (c?.subscription_plan_id) {
        const plan = plans.find(p => p.id === c.subscription_plan_id);
        setCurrentPlan(plan || null);
      }
      const cycle = (c as Company & { subscription_billing_cycle?: string })?.subscription_billing_cycle;
      if (cycle === 'yearly') setBilling('yearly');
      setLoading(false);
    });
  }, [user]);

  function formatDate(iso: string | null) {
    if (!iso) return '—';
    return formatDateLong(iso, i18n.language);
  }

  async function handleToggleAutoRenew() {
    if (!company) return;
    const currentValue = (company as Company & { subscription_auto_renew?: boolean }).subscription_auto_renew;
    const newValue = !currentValue;
    setSaving(true);
    const { error } = await supabase
      .from('companies')
      .update({ subscription_auto_renew: newValue, updated_at: new Date().toISOString() })
      .eq('id', company.id);
    setSaving(false);
    if (!error) {
      setCompany(prev => prev ? { ...prev, subscription_auto_renew: newValue } as Company & { subscription_auto_renew: boolean } : prev);
      setFeedback({ type: 'success', message: newValue ? t('companyDash.subscription.autoRenewEnabled') : t('companyDash.subscription.autoRenewDisabled') });
      setTimeout(() => setFeedback(null), 3000);
    }
  }

  async function performPlanChange(planId: string) {
    if (!company) return;
    setChangingTo(planId);
    const now = new Date();
    const expiresAt = new Date(now);
    if (billing === 'yearly') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }
    const { error } = await supabase
      .from('companies')
      .update({
        subscription_plan_id: planId,
        subscription_status: 'active',
        subscription_billing_cycle: billing,
        subscription_expires_at: expiresAt.toISOString(),
        subscription_renewed_at: now.toISOString(),
        subscription_auto_renew: true,
        updated_at: now.toISOString(),
      })
      .eq('id', company.id);
    setChangingTo(null);
    if (!error) {
      const plan = allPlans.find(p => p.id === planId);
      setCurrentPlan(plan || null);
      setCompany(prev => prev ? {
        ...prev,
        subscription_plan_id: planId,
        subscription_status: 'active',
        subscription_expires_at: expiresAt.toISOString(),
      } : prev);
      setShowChangePlan(false);
      setConfirmPlan(null);
      setFeedback({ type: 'success', message: t('companyDash.subscription.planChanged', { name: plan?.name }) });
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setFeedback({ type: 'error', message: t('companyDash.subscription.changeError') });
    }
  }

  function canDowngradeTo(plan: SubscriptionPlan): { ok: boolean; reason?: string } {
    if (plan.max_vehicles === -1) return { ok: true };
    if (vehicleCount > plan.max_vehicles) {
      return {
        ok: false,
        reason: t('companyDash.subscription.downgradeBlocked', { count: vehicleCount, limit: plan.max_vehicles }),
      };
    }
    return { ok: true };
  }

  function requestPlanChange(plan: SubscriptionPlan) {
    const check = canDowngradeTo(plan);
    if (!check.ok) {
      setFeedback({ type: 'error', message: check.reason || '' });
      setTimeout(() => setFeedback(null), 5000);
      return;
    }
    setConfirmPlan(plan);
  }

  const companyWithExtras = company as (Company & { subscription_auto_renew?: boolean; subscription_billing_cycle?: string }) | null;
  const autoRenew = companyWithExtras?.subscription_auto_renew ?? true;
  const billingCycle = companyWithExtras?.subscription_billing_cycle || 'monthly';
  const daysLeft = daysUntil(company?.subscription_expires_at || null);
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0;
  const isExpired = daysLeft !== null && daysLeft < 0;

  function statusLabel(): string {
    if (company?.subscription_status === 'active') return t('companyDash.subscription.statusActive');
    if (company?.subscription_status === 'trial') return t('companyDash.subscription.statusTrial');
    if (company?.subscription_status === 'expired') return t('companyDash.subscription.statusExpired');
    if (company?.subscription_status === 'cancelled') return t('companyDash.subscription.statusCancelled');
    return t('companyDash.subscription.statusNone');
  }

  function autoRenewPrice(): string {
    if (!currentPlan) return '';
    return billingCycle === 'yearly'
      ? t('companyDash.subscription.perYearShort', { amount: currentPlan.price_yearly })
      : `${currentPlan.price_monthly} ${t('companyDash.subscription.perMonthShort')}`;
  }

  if (loading) {
    return (
      <DashboardLayout title={t('companyDash.subscription.title')} navItems={companyNavItems}>
        <div className="flex items-center justify-center h-64">
          <div className="w-7 h-7 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={t('companyDash.subscription.title')} navItems={companyNavItems}>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-dark-950 mb-1">{t('companyDash.subscription.heading')}</h1>
        <p className="text-dark-500 mb-8 text-[15px]">{t('companyDash.subscription.subtitle')}</p>

        {feedback && (
          <div className={`mb-6 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium ${
            feedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
          }`}>
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {feedback.message}
          </div>
        )}

        {(isExpired || isExpiringSoon) && (
          <div className={`mb-6 flex items-start gap-3 p-4 rounded-xl border ${
            isExpired ? 'bg-red-50 border-red-100 text-red-700' : 'bg-amber-50 border-amber-100 text-amber-700'
          }`}>
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">
                {isExpired ? t('companyDash.subscription.expiredTitle') : t('companyDash.subscription.expiringTitle', { days: daysLeft })}
              </p>
              <p className="text-sm mt-0.5 opacity-80">
                {isExpired ? t('companyDash.subscription.expiredBody') : t('companyDash.subscription.expiringBody')}
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-xs font-semibold text-dark-400 uppercase tracking-wide mb-2">{t('companyDash.subscription.currentPlan')}</p>
              {currentPlan ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center">
                    {getPlanIcon(currentPlan.name)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-dark-950">{currentPlan.name}</h2>
                    <p className="text-dark-400 text-sm">{currentPlan.description}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 text-gray-400 rounded-xl flex items-center justify-center">
                    <Star className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-dark-950">{t('companyDash.subscription.noPlan')}</h2>
                    <p className="text-dark-400 text-sm">{t('companyDash.subscription.noPlanDesc')}</p>
                  </div>
                </div>
              )}
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              company?.subscription_status === 'active'
                ? 'bg-green-100 text-green-700'
                : company?.subscription_status === 'trial'
                  ? 'bg-blue-100 text-blue-700'
                  : isExpired
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-500'
            }`}>
              {statusLabel()}
            </span>
          </div>

          {currentPlan && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-dark-950">
                  {currentPlan.max_vehicles === -1 ? '∞' : currentPlan.max_vehicles}
                </p>
                <p className="text-xs text-dark-400 mt-0.5">{t('companyDash.subscription.vehicles')}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-dark-950">
                  {currentPlan.max_bookings_monthly === -1 ? '∞' : currentPlan.max_bookings_monthly}
                </p>
                <p className="text-xs text-dark-400 mt-0.5">{t('companyDash.subscription.bookingsMonthly')}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-dark-950">
                  {billingCycle === 'yearly' && currentPlan.price_yearly > 0
                    ? `${Math.round(currentPlan.price_yearly / 12)}`
                    : currentPlan.price_monthly === 0 ? '0' : `${currentPlan.price_monthly}`
                  }
                </p>
                <p className="text-xs text-dark-400 mt-0.5">{t('companyDash.subscription.perMonth')}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className={`text-lg font-bold ${isExpiringSoon ? 'text-amber-600' : isExpired ? 'text-red-600' : 'text-dark-950'}`}>
                  {daysLeft !== null ? (daysLeft < 0 ? t('companyDash.subscription.expiredShort') : `${daysLeft}d`) : '—'}
                </p>
                <p className="text-xs text-dark-400 mt-0.5">{t('companyDash.subscription.daysLeft')}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-dark-500">
              <Calendar className="w-4 h-4 text-dark-300" />
              <span>{t('companyDash.subscription.expiresOn')}: <span className="font-medium text-dark-700">{formatDate(company?.subscription_expires_at || null)}</span></span>
            </div>
            <div className="flex items-center gap-2 text-sm text-dark-500">
              <RefreshCw className="w-4 h-4 text-dark-300" />
              <span>{t('companyDash.subscription.cycle')}: <span className="font-medium text-dark-700">{billingCycle === 'yearly' ? t('companyDash.subscription.yearly') : t('companyDash.subscription.monthly')}</span></span>
            </div>
          </div>

          {currentPlan && currentPlan.price_monthly > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-dark-700">{t('companyDash.subscription.autoRenew')}</p>
                <p className="text-xs text-dark-400 mt-0.5">
                  {autoRenew
                    ? t('companyDash.subscription.autoRenewOn', { price: autoRenewPrice() })
                    : t('companyDash.subscription.autoRenewOff')}
                </p>
              </div>
              <button
                onClick={handleToggleAutoRenew}
                disabled={saving}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${autoRenew ? 'bg-primary-600' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${autoRenew ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-dark-900">
                {showChangePlan ? t('companyDash.subscription.changeTitle') : t('companyDash.subscription.yourPlan')}
              </h3>
              <p className="text-xs text-dark-400 mt-0.5">
                {showChangePlan ? t('companyDash.subscription.changeDesc') : t('companyDash.subscription.yourPlanDesc')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowChangePlan(!showChangePlan)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
                showChangePlan
                  ? 'bg-gray-100 text-dark-600 hover:bg-gray-200'
                  : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
              }`}
            >
              {showChangePlan ? t('companyDash.common.cancel') : <><ArrowUpRight className="w-3.5 h-3.5" /> {t('companyDash.subscription.changeButton')}</>}
            </button>
          </div>

          {showChangePlan && (
            <>
              <div className="flex items-center justify-end mb-4">
                <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setBilling('monthly')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      billing === 'monthly' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-400 hover:text-dark-600'
                    }`}
                  >
                    {t('companyDash.subscription.monthly')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBilling('yearly')}
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      billing === 'yearly' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-400 hover:text-dark-600'
                    }`}
                  >
                    {t('companyDash.subscription.yearly')}
                    <span className="text-[9px] font-bold px-1 py-0.5 rounded-full bg-green-100 text-green-700">{t('companyDash.subscription.yearlyDiscount')}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {allPlans.map((plan) => {
                  const isCurrentPlan = plan.id === company?.subscription_plan_id;
                  const price = billing === 'yearly' && plan.price_yearly > 0
                    ? Math.round(plan.price_yearly / 12)
                    : plan.price_monthly;
                  const isChanging = changingTo === plan.id;

                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => !isCurrentPlan && requestPlanChange(plan)}
                      disabled={isCurrentPlan || !!changingTo}
                      className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                        isCurrentPlan
                          ? 'border-primary-400 bg-primary-50 cursor-default'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm cursor-pointer'
                      }`}
                    >
                      {plan.is_popular && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                          {t('companyDash.subscription.popular')}
                        </span>
                      )}
                      {isCurrentPlan && (
                        <span className="absolute -top-2.5 right-3 bg-green-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                          {t('companyDash.subscription.current')}
                        </span>
                      )}
                      <div className="flex items-center gap-1.5 mb-2 text-dark-400">
                        {getPlanIcon(plan.name)}
                      </div>
                      <p className="text-xs font-bold text-dark-900 mb-1">{plan.name}</p>
                      <div>
                        {price === 0 ? (
                          <span className="text-sm font-bold text-dark-950">{t('companyDash.subscription.free')}</span>
                        ) : (
                          <>
                            <span className="text-sm font-bold text-dark-950">{price}</span>
                            <span className="text-[10px] text-dark-400"> {t('companyDash.subscription.perMonthShort')}</span>
                          </>
                        )}
                      </div>
                      {billing === 'yearly' && plan.price_yearly > 0 && (
                        <p className="text-[10px] text-green-600 mt-0.5">{t('companyDash.subscription.perYearShort', { amount: plan.price_yearly })}</p>
                      )}
                      <ul className="mt-2 pt-2 border-t border-gray-100 space-y-0.5">
                        {(plan.features || []).slice(0, 2).map((f, i) => (
                          <li key={i} className="flex items-start gap-1 text-[10px] text-dark-500">
                            <Check className="w-2.5 h-2.5 text-green-500 mt-0.5 shrink-0" />
                            <span className="line-clamp-1">{f}</span>
                          </li>
                        ))}
                      </ul>
                      {!isCurrentPlan && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          {isChanging ? (
                            <div className="flex items-center justify-center gap-1.5 py-1 text-xs text-primary-600 font-medium">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              {t('companyDash.subscription.changing')}
                            </div>
                          ) : (
                            <p className="text-[10px] text-primary-600 font-semibold text-center py-0.5">
                              {t('companyDash.subscription.selectPlan')} →
                            </p>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-dark-400 text-center">
                {t('companyDash.subscription.changeNote')}
              </p>
            </>
          )}

          {!showChangePlan && currentPlan && (
            <div className="grid grid-cols-1 gap-2">
              {(currentPlan.features || []).map((feature, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm text-dark-600">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  {feature}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {confirmPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-dark-900 mb-3">{t('companyDash.subscription.confirmTitle')}</h3>
            <p className="text-sm text-dark-600 mb-6">
              {t('companyDash.subscription.confirmBody', {
                from: currentPlan?.name || t('companyDash.subscription.noPlan'),
                to: confirmPlan.name,
                price: billing === 'yearly' && confirmPlan.price_yearly > 0
                  ? t('companyDash.subscription.perYearShort', { amount: confirmPlan.price_yearly })
                  : `${confirmPlan.price_monthly} ${t('companyDash.subscription.perMonthShort')}`,
              })}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmPlan(null)}
                disabled={!!changingTo}
                className="px-4 py-2 text-sm font-medium text-dark-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t('companyDash.common.cancel')}
              </button>
              <button
                onClick={() => performPlanChange(confirmPlan.id)}
                disabled={!!changingTo}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {changingTo && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('companyDash.subscription.confirmContinue')}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
