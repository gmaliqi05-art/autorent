import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import type { SubscriptionPlan } from '../../lib/types';

export default function PricingSection() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => {
        setPlans((data || []) as SubscriptionPlan[]);
        setLoading(false);
      });
  }, []);

  if (loading || plans.length === 0) return null;

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-primary-600 font-semibold text-sm tracking-wide uppercase mb-2">{t('pricing.subtitle')}</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">{t('pricing.title')}</h2>
          <p className="text-gray-500 max-w-lg mx-auto text-sm">
            {t('pricing.desc')}
          </p>

          <div className="flex justify-center mt-6">
            <div className="inline-flex bg-white border border-gray-200 rounded-lg p-1 gap-1">
              <button
                onClick={() => setBilling('monthly')}
                className={`px-5 py-2 text-sm font-medium rounded-md transition-all ${billing === 'monthly' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t('pricing.monthly')}
              </button>
              <button
                onClick={() => setBilling('yearly')}
                className={`flex items-center gap-1.5 px-5 py-2 text-sm font-medium rounded-md transition-all ${billing === 'yearly' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t('pricing.yearly')}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${billing === 'yearly' ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'}`}>{t('pricing.save20')}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const price = billing === 'yearly' && plan.price_yearly > 0
              ? Math.round(plan.price_yearly / 12)
              : plan.price_monthly;
            const totalPrice = billing === 'yearly' ? plan.price_yearly : null;

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-xl border transition-all duration-200 flex flex-col ${
                  plan.is_popular
                    ? 'border-gray-900 shadow-md ring-1 ring-gray-900/5'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                {plan.is_popular && (
                  <div className="absolute -top-px left-1/2 -translate-x-1/2">
                    <span className="inline-block bg-gray-900 text-white text-[10px] font-semibold tracking-wider uppercase px-3 py-1 rounded-b-lg">
                      {t('pricing.popular')}
                    </span>
                  </div>
                )}

                <div className="p-5 pt-7">
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 text-base">{plan.name}</h3>
                    <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{plan.description}</p>
                  </div>

                  <div className="flex items-baseline gap-1 mb-1">
                    {price === 0 ? (
                      <span className="text-2xl font-bold text-gray-900">{t('pricing.free')}</span>
                    ) : (
                      <>
                        <span className="text-2xl font-bold text-gray-900">{price}</span>
                        <span className="text-gray-400 text-xs">{t('pricing.perMonth')}</span>
                      </>
                    )}
                  </div>
                  {totalPrice && totalPrice > 0 && (
                    <p className="text-gray-400 text-xs mb-4">{totalPrice} {t('pricing.perYear')}</p>
                  )}
                  {(!totalPrice || totalPrice === 0) && <div className="mb-4" />}

                  <ul className="space-y-2 mb-5">
                    <li className="flex items-center gap-2 text-xs text-gray-600">
                      <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      {plan.max_vehicles === -1
                        ? t('pricing.vehiclesUnlimited')
                        : t('pricing.vehiclesUpTo', { count: plan.max_vehicles })}
                    </li>
                    <li className="flex items-center gap-2 text-xs text-gray-600">
                      <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      {plan.max_bookings_monthly === -1
                        ? t('pricing.bookingsUnlimited')
                        : t('pricing.bookingsPerMonth', { count: plan.max_bookings_monthly })}
                    </li>
                    {(plan.features || []).slice(0, 4).map((ft, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                        <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{ft}</span>
                      </li>
                    ))}
                    {(plan.features || []).length > 4 && (
                      <li className="text-xs text-gray-400 pl-5">{t('pricing.moreFeatures', { count: plan.features.length - 4 })}</li>
                    )}
                  </ul>
                </div>

                <div className="px-5 pb-5 mt-auto">
                  <Link
                    to={`/regjistrohu?role=company&plan=${plan.id}&billing=${billing}`}
                    className={`flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg text-sm font-medium transition-all ${
                      plan.is_popular
                        ? 'bg-gray-900 text-white hover:bg-gray-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {price === 0 ? t('pricing.startFree') : t('pricing.choosePlan')}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          {t('pricing.haveQuestions')}{' '}
          <Link to="/automjetet" className="text-gray-600 font-medium hover:text-gray-900 underline underline-offset-2">
            {t('pricing.contactTeam')}
          </Link>
        </p>
      </div>
    </section>
  );
}
