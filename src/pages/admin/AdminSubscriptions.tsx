import { useState, useEffect } from 'react';
import {
  Plus, Trash2, Check, X, Loader2, Star, Zap, Crown, Gem,
  Building2, DollarSign, Users, Eye, Download,
  ToggleLeft, ToggleRight, Pencil,
  TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import type { SubscriptionPlan, Company } from '../../lib/types';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNavItems, adminNavGroups } from '../../lib/adminNav';
import { exportToCSV } from '../../lib/csvExport';

const PLAN_META: Record<string, { icon: React.ReactNode; gradient: string; badge: string }> = {
  'Free': {
    icon: <Star className="w-5 h-5" />,
    gradient: 'from-gray-500 to-gray-600',
    badge: 'bg-gray-100 text-gray-700',
  },
  'Standard': {
    icon: <Zap className="w-5 h-5" />,
    gradient: 'from-blue-500 to-blue-600',
    badge: 'bg-blue-100 text-blue-700',
  },
  'Premium': {
    icon: <Crown className="w-5 h-5" />,
    gradient: 'from-amber-500 to-orange-500',
    badge: 'bg-amber-100 text-amber-700',
  },
  'Super Premium': {
    icon: <Gem className="w-5 h-5" />,
    gradient: 'from-emerald-500 to-teal-600',
    badge: 'bg-emerald-100 text-emerald-700',
  },
};

const subStatusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  trial: 'bg-blue-100 text-blue-700',
  expired: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
  pending: 'bg-yellow-100 text-yellow-700',
};

const subStatusKeys: Record<string, string> = {
  active: 'statusActive',
  trial: 'statusTrial',
  expired: 'statusExpired',
  cancelled: 'statusCancelled',
  pending: 'statusPending',
};

const emptyPlan = {
  name: '',
  description: '',
  price_monthly: 0,
  price_yearly: 0,
  max_vehicles: 5,
  max_bookings_monthly: 100,
  features: [] as string[],
  is_active: true,
  sort_order: 0,
  yearly_discount_percent: 20,
  is_popular: false,
};

type TabView = 'plans' | 'subscribers';

export default function AdminSubscriptions() {
  const { t, i18n } = useTranslation();
  const localeForDate = i18n.language === 'en' ? 'en-US' : i18n.language === 'de' ? 'de-DE' : 'sq-AL';
  const subStatusLabel = (s: string) => t(`adminDash.subscriptions.${subStatusKeys[s] || 'statusPending'}`);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyPlan);
  const [featureInput, setFeatureInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [tabView, setTabView] = useState<TabView>('plans');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [assignPlanId, setAssignPlanId] = useState('');
  const [assignBilling, setAssignBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [assignSaving, setAssignSaving] = useState(false);
  const [showAssignFor, setShowAssignFor] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [plansRes, companiesRes] = await Promise.all([
      supabase.from('subscription_plans').select('*').order('sort_order'),
      supabase.from('companies').select('*').order('name'),
    ]);
    setPlans((plansRes.data || []) as SubscriptionPlan[]);
    setCompanies((companiesRes.data || []) as Company[]);
    setLoading(false);
  }

  function startEdit(plan: SubscriptionPlan) {
    setEditing(plan.id);
    setCreating(false);
    setForm({
      name: plan.name,
      description: plan.description,
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      max_vehicles: plan.max_vehicles,
      max_bookings_monthly: plan.max_bookings_monthly,
      features: plan.features || [],
      is_active: plan.is_active,
      sort_order: plan.sort_order,
      yearly_discount_percent: plan.yearly_discount_percent ?? 0,
      is_popular: plan.is_popular ?? false,
    });
  }

  function startCreate() {
    setCreating(true);
    setEditing(null);
    setForm({ ...emptyPlan, sort_order: plans.length + 1 });
  }

  function cancelEdit() {
    setEditing(null);
    setCreating(false);
    setForm(emptyPlan);
    setFeatureInput('');
  }

  function addFeature() {
    if (featureInput.trim()) {
      setForm(f => ({ ...f, features: [...f.features, featureInput.trim()] }));
      setFeatureInput('');
    }
  }

  function removeFeature(idx: number) {
    setForm(f => ({ ...f, features: f.features.filter((_, i) => i !== idx) }));
  }

  async function savePlan() {
    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description,
      price_monthly: Number(form.price_monthly),
      price_yearly: Number(form.price_yearly),
      max_vehicles: Number(form.max_vehicles),
      max_bookings_monthly: Number(form.max_bookings_monthly),
      features: form.features,
      is_active: form.is_active,
      sort_order: Number(form.sort_order),
      yearly_discount_percent: Number(form.yearly_discount_percent),
      is_popular: form.is_popular,
      updated_at: new Date().toISOString(),
    };
    if (editing) {
      await supabase.from('subscription_plans').update(payload).eq('id', editing);
    } else {
      await supabase.from('subscription_plans').insert(payload);
    }
    cancelEdit();
    setSaving(false);
    loadData();
  }

  async function deletePlan(id: string) {
    if (!confirm(t('adminDash.subscriptions.confirmDelete'))) return;
    await supabase.from('subscription_plans').delete().eq('id', id);
    loadData();
  }

  async function togglePlanActive(plan: SubscriptionPlan) {
    await supabase.from('subscription_plans').update({ is_active: !plan.is_active }).eq('id', plan.id);
    loadData();
  }

  async function assignPlanToCompany() {
    if (!showAssignFor || !assignPlanId) return;
    setAssignSaving(true);
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + (assignBilling === 'yearly' ? 12 : 1));
    await supabase.from('companies').update({
      subscription_plan_id: assignPlanId,
      subscription_status: 'active',
      subscription_expires_at: expiresAt.toISOString(),
    }).eq('id', showAssignFor);
    setShowAssignFor(null);
    setAssignPlanId('');
    setAssignSaving(false);
    if (selectedCompany?.id === showAssignFor) setSelectedCompany(null);
    loadData();
  }

  function handleExportSubscribers() {
    const data = companies.filter(c => c.subscription_plan_id).map(c => {
      const plan = plans.find(p => p.id === c.subscription_plan_id);
      return {
        Kompania: c.name,
        Email: c.email,
        Plani: plan?.name || '-',
        Cmimi_Mujor: plan ? `${plan.price_monthly} EUR` : '-',
        Statusi: subStatusLabel(c.subscription_status),
        Skadon: c.subscription_expires_at ? new Date(c.subscription_expires_at).toLocaleDateString(localeForDate) : '-',
        Regjistruar: new Date(c.created_at).toLocaleDateString(localeForDate),
      };
    });
    exportToCSV(data, 'abonimet');
  }

  const activeSubscribers = companies.filter(c => c.subscription_status === 'active');
  const totalMonthlyRevenue = activeSubscribers.reduce((s, c) => {
    const plan = plans.find(p => p.id === c.subscription_plan_id);
    return s + (plan ? Number(plan.price_monthly) : 0);
  }, 0);
  const expiringSoon = companies.filter(c => {
    if (!c.subscription_expires_at || c.subscription_status !== 'active') return false;
    const days = (new Date(c.subscription_expires_at).getTime() - Date.now()) / 86400000;
    return days <= 30 && days > 0;
  });

  const inputClass = 'w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all';

  if (loading) {
    return (
      <DashboardLayout title="Admin" navItems={adminNavItems} navGroups={adminNavGroups}>
        <div className="flex items-center justify-center h-64">
          <div className="w-7 h-7 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Admin" navItems={adminNavItems} navGroups={adminNavGroups}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-950">{t('adminDash.subscriptions.title')}</h1>
          <p className="text-dark-500 mt-1 text-[15px]">{t('adminDash.subscriptions.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          {tabView === 'subscribers' && (
            <button onClick={handleExportSubscribers} className="flex items-center gap-2 px-4 py-2.5 bg-primary-50 text-primary-700 text-sm font-semibold rounded-xl hover:bg-primary-100 transition-colors">
              <Download className="w-4 h-4" />
              {t('adminDash.subscriptions.exportCsv')}
            </button>
          )}
          {tabView === 'plans' && !creating && !editing && (
            <button onClick={startCreate} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-all shadow-sm">
              <Plus className="w-4 h-4" />
              {t('adminDash.subscriptions.newPlan')}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-dark-950">{totalMonthlyRevenue.toFixed(0)} EUR</p>
              <p className="text-xs text-dark-500">{t('adminDash.subscriptions.monthlyRevenue')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-dark-950">{(totalMonthlyRevenue * 12).toFixed(0)} EUR</p>
              <p className="text-xs text-dark-500">{t('adminDash.subscriptions.yearlyProjection')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dark-950">{activeSubscribers.length}</p>
              <p className="text-xs text-dark-500">{t('adminDash.subscriptions.activeSubscribers')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dark-950">{expiringSoon.length}</p>
              <p className="text-xs text-dark-500">{t('adminDash.subscriptions.expiringIn30')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        <button
          onClick={() => setTabView('plans')}
          className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${tabView === 'plans' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-400 hover:text-dark-600'}`}
        >
          {t('adminDash.subscriptions.tabPlans', { count: plans.length })}
        </button>
        <button
          onClick={() => setTabView('subscribers')}
          className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${tabView === 'subscribers' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-400 hover:text-dark-600'}`}
        >
          {t('adminDash.subscriptions.tabSubscribers', { count: activeSubscribers.length })}
        </button>
      </div>

      {tabView === 'plans' && (
        <>
          {(creating || editing) && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
              <h2 className="text-lg font-semibold text-dark-950 mb-5">{creating ? t('adminDash.subscriptions.formTitleNew') : t('adminDash.subscriptions.formTitleEdit')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-dark-600 mb-1.5">{t('adminDash.subscriptions.labelName')}</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} placeholder={t('adminDash.subscriptions.placeholderName')} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dark-600 mb-1.5">{t('adminDash.subscriptions.labelDescription')}</label>
                  <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputClass} placeholder={t('adminDash.subscriptions.placeholderDescription')} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dark-600 mb-1.5">{t('adminDash.subscriptions.labelPriceMonthly')}</label>
                  <input type="number" step="0.01" value={form.price_monthly} onChange={e => setForm(f => ({ ...f, price_monthly: +e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dark-600 mb-1.5">{t('adminDash.subscriptions.labelPriceYearly')}</label>
                  <input type="number" step="0.01" value={form.price_yearly} onChange={e => setForm(f => ({ ...f, price_yearly: +e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dark-600 mb-1.5">{t('adminDash.subscriptions.labelYearlyDiscount')}</label>
                  <input type="number" min={0} max={100} value={form.yearly_discount_percent} onChange={e => setForm(f => ({ ...f, yearly_discount_percent: +e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dark-600 mb-1.5">{t('adminDash.subscriptions.labelMaxVehicles')}</label>
                  <input type="number" value={form.max_vehicles} onChange={e => setForm(f => ({ ...f, max_vehicles: +e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dark-600 mb-1.5">{t('adminDash.subscriptions.labelMaxBookings')}</label>
                  <input type="number" value={form.max_bookings_monthly} onChange={e => setForm(f => ({ ...f, max_bookings_monthly: +e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dark-600 mb-1.5">{t('adminDash.subscriptions.labelSortOrder')}</label>
                  <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: +e.target.value }))} className={inputClass} />
                </div>
                <div className="flex items-center gap-6 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="sr-only peer" />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600 relative" />
                    <span className="text-sm text-dark-700">{t('adminDash.subscriptions.toggleActive')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_popular} onChange={e => setForm(f => ({ ...f, is_popular: e.target.checked }))} className="sr-only peer" />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 relative" />
                    <span className="text-sm text-dark-700">{t('adminDash.subscriptions.togglePopular')}</span>
                  </label>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-medium text-dark-600 mb-1.5">{t('adminDash.subscriptions.labelFeatures')}</label>
                <div className="flex gap-2 mb-2">
                  <input value={featureInput} onChange={e => setFeatureInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())} className={`${inputClass} flex-1`} placeholder={t('adminDash.subscriptions.placeholderAddFeature')} />
                  <button onClick={addFeature} className="px-4 py-2 bg-gray-100 text-dark-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap">{t('adminDash.subscriptions.addFeature')}</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.features.map((ft, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-lg">
                      {ft}
                      <button onClick={() => removeFeature(i)} className="hover:text-red-600"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={savePlan} disabled={saving || !form.name} className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {saving ? t('adminDash.subscriptions.saving') : t('adminDash.subscriptions.save')}
                </button>
                <button onClick={cancelEdit} className="px-5 py-2.5 bg-gray-100 text-dark-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors">{t('adminDash.subscriptions.cancel')}</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {plans.map(plan => {
              const meta = PLAN_META[plan.name] || { icon: <Star className="w-5 h-5" />, gradient: 'from-gray-500 to-gray-600', badge: 'bg-gray-100 text-gray-700' };
              const subscriberCount = companies.filter(c => c.subscription_plan_id === plan.id && c.subscription_status === 'active').length;
              const planRevenue = subscriberCount * plan.price_monthly;

              return (
                <div key={plan.id} className={`bg-white rounded-2xl border-2 overflow-hidden ${plan.is_popular ? 'border-amber-400 shadow-lg shadow-amber-100' : 'border-gray-100'} ${!plan.is_active ? 'opacity-60' : ''} group relative`}>
                  {plan.is_popular && (
                    <div className="bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider text-center py-1.5">
                      {t('adminDash.subscriptions.mostPopular')}
                    </div>
                  )}
                  {!plan.is_active && (
                    <div className="bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider text-center py-1.5">
                      {t('adminDash.subscriptions.inactive')}
                    </div>
                  )}

                  <div className={`bg-gradient-to-br ${meta.gradient} p-5`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                        {meta.icon}
                      </div>
                      <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                        {plan.name}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-white">{plan.price_monthly}</span>
                      <span className="text-white/70 text-sm">{t('adminDash.subscriptions.pricePerMonth')}</span>
                    </div>
                    {plan.price_yearly > 0 && (
                      <p className="text-white/60 text-xs mt-1">
                        {plan.price_yearly} {t('adminDash.subscriptions.pricePerYear')}
                        {plan.yearly_discount_percent > 0 && ` (-${plan.yearly_discount_percent}%)`}
                      </p>
                    )}
                  </div>

                  <div className="p-5">
                    <p className="text-xs text-dark-500 mb-4">{plan.description}</p>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-dark-950">{subscriberCount}</p>
                        <p className="text-[10px] text-dark-400">{t('adminDash.subscriptions.subscribersLabel')}</p>
                      </div>
                      <div className="w-px h-8 bg-gray-200" />
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">{planRevenue} EUR</p>
                        <p className="text-[10px] text-dark-400">{t('adminDash.subscriptions.revenuePerMonthShort')}</p>
                      </div>
                      <div className="w-px h-8 bg-gray-200" />
                      <div className="text-center">
                        <p className="text-sm font-bold text-dark-950">{plan.max_vehicles === -1 ? '∞' : plan.max_vehicles}</p>
                        <p className="text-[10px] text-dark-400">{t('adminDash.subscriptions.vehiclesLabel')}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 mb-5 max-h-40 overflow-y-auto">
                      <div className="flex items-center gap-2 text-xs text-dark-600">
                        <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        {plan.max_vehicles === -1 ? t('adminDash.subscriptions.unlimitedVehicles') : t('adminDash.subscriptions.upToVehicles', { count: plan.max_vehicles })}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-dark-600">
                        <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        {plan.max_bookings_monthly === -1 ? t('adminDash.subscriptions.unlimitedBookings') : t('adminDash.subscriptions.bookingsPerMonth', { count: plan.max_bookings_monthly })}
                      </div>
                      {(plan.features || []).map((ft, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-dark-600">
                          <Check className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                          {ft}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => startEdit(plan)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-50 text-dark-700 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                        {t('adminDash.subscriptions.edit')}
                      </button>
                      <button onClick={() => togglePlanActive(plan)} className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${plan.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                        {plan.is_active ? <ToggleLeft className="w-3.5 h-3.5" /> : <ToggleRight className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => deletePlan(plan.id)} className="flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-10 bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-base font-bold text-dark-950 mb-1">{t('adminDash.subscriptions.previewTitle')}</h3>
            <p className="text-xs text-dark-400 mb-6">{t('adminDash.subscriptions.previewSubtitle')}</p>
            <HomepagePricingPreview plans={plans.filter(p => p.is_active)} />
          </div>
        </>
      )}

      {tabView === 'subscribers' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">{t('adminDash.subscriptions.colCompany')}</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">{t('adminDash.subscriptions.colPlan')}</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">{t('adminDash.subscriptions.colPrice')}</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">{t('adminDash.subscriptions.colStatus')}</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">{t('adminDash.subscriptions.colExpires')}</th>
                  <th className="text-center px-5 py-3.5 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">{t('adminDash.subscriptions.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {companies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-dark-400">{t('adminDash.subscriptions.emptyCompanies')}</p>
                    </td>
                  </tr>
                ) : (
                  companies
                    .sort((a, b) => {
                      if (a.subscription_status === 'active' && b.subscription_status !== 'active') return -1;
                      if (a.subscription_status !== 'active' && b.subscription_status === 'active') return 1;
                      return a.name.localeCompare(b.name);
                    })
                    .map(company => {
                      const plan = plans.find(p => p.id === company.subscription_plan_id);
                      const statusColor = subStatusColors[company.subscription_status] || subStatusColors.pending;
                      const statusLabel = subStatusLabel(company.subscription_status);
                      const isExpiringSoon = company.subscription_expires_at &&
                        company.subscription_status === 'active' &&
                        (new Date(company.subscription_expires_at).getTime() - Date.now()) / 86400000 <= 30;

                      return (
                        <tr key={company.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                                {company.logo_url ? <img src={company.logo_url} alt="" className="w-9 h-9 object-cover" loading="lazy" /> : <Building2 className="w-4 h-4 text-gray-400" />}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-dark-900">{company.name}</p>
                                <p className="text-[11px] text-dark-400">{company.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            {plan ? (
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${PLAN_META[plan.name]?.badge || 'bg-gray-100 text-gray-700'}`}>
                                {plan.name}
                              </span>
                            ) : (
                              <span className="text-xs text-dark-400 italic">{t('adminDash.subscriptions.noPlan')}</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-sm font-bold text-dark-900">{plan ? `${plan.price_monthly} ${t('adminDash.subscriptions.pricePerMonth')}` : '0 EUR'}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusColor}`}>
                              {statusLabel}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div>
                              <p className={`text-sm ${isExpiringSoon ? 'text-red-600 font-semibold' : 'text-dark-500'}`}>
                                {company.subscription_expires_at ? new Date(company.subscription_expires_at).toLocaleDateString(localeForDate) : '-'}
                              </p>
                              {isExpiringSoon && <p className="text-[10px] text-red-500 font-medium">{t('adminDash.subscriptions.expiringSoon')}</p>}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => setSelectedCompany(company)} className="p-1.5 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { setShowAssignFor(company.id); setAssignPlanId(company.subscription_plan_id || ''); }}
                                className="p-1.5 text-dark-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                              >
                                <ArrowUpRight className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedCompany && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                  {selectedCompany.logo_url ? <img src={selectedCompany.logo_url} alt="" className="w-10 h-10 object-cover" loading="lazy" /> : <Building2 className="w-5 h-5 text-gray-400" />}
                </div>
                <div>
                  <h3 className="font-semibold text-dark-950">{selectedCompany.name}</h3>
                  <p className="text-xs text-dark-500">{selectedCompany.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCompany(null)} className="p-2 text-dark-400 hover:text-dark-600 hover:bg-gray-100 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {(() => {
                const plan = plans.find(p => p.id === selectedCompany.subscription_plan_id);
                const statusColor = subStatusColors[selectedCompany.subscription_status] || subStatusColors.pending;
                const statusLabel = subStatusLabel(selectedCompany.subscription_status);
                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-dark-400 mb-1">{t('adminDash.subscriptions.currentPlan')}</p>
                        <p className="text-lg font-bold text-dark-950">{plan?.name || t('adminDash.subscriptions.noPlan')}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-dark-400 mb-1">{t('adminDash.subscriptions.monthlyPriceLabel')}</p>
                        <p className="text-lg font-bold text-green-600">{plan ? `${plan.price_monthly} EUR` : '0 EUR'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-dark-400 mb-1">{t('adminDash.subscriptions.colStatus')}</p>
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor}`}>{statusLabel}</span>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-dark-400 mb-1">{t('adminDash.subscriptions.expiresOn')}</p>
                        <p className="text-sm font-semibold text-dark-900">{selectedCompany.subscription_expires_at ? new Date(selectedCompany.subscription_expires_at).toLocaleDateString(localeForDate) : '-'}</p>
                      </div>
                    </div>
                    <div className="border-t border-gray-100 pt-4">
                      <h4 className="text-sm font-semibold text-dark-950 mb-2">{t('adminDash.subscriptions.contact')}</h4>
                      <div className="space-y-1.5 text-sm text-dark-700">
                        <p>{t('adminDash.subscriptions.contactPhone', { value: selectedCompany.phone || '-' })}</p>
                        <p>{t('adminDash.subscriptions.contactAddress', { value: `${selectedCompany.address || '-'}, ${selectedCompany.city}` })}</p>
                        <p>{t('adminDash.subscriptions.contactLicense', { value: selectedCompany.license_number || '-' })}</p>
                      </div>
                    </div>
                    {plan && (
                      <div className="border-t border-gray-100 pt-4">
                        <h4 className="text-sm font-semibold text-dark-950 mb-2">{t('adminDash.subscriptions.planLimits')}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <p className="text-xl font-bold text-dark-950">{plan.max_vehicles === -1 ? '∞' : plan.max_vehicles}</p>
                            <p className="text-[10px] text-dark-400">{t('adminDash.subscriptions.maxVehiclesShort')}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <p className="text-xl font-bold text-dark-950">{plan.max_bookings_monthly === -1 ? '∞' : plan.max_bookings_monthly}</p>
                            <p className="text-[10px] text-dark-400">{t('adminDash.subscriptions.maxBookingsShort')}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => { setSelectedCompany(null); setShowAssignFor(selectedCompany.id); setAssignPlanId(selectedCompany.subscription_plan_id || ''); }}
                      className="w-full py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors"
                    >
                      {t('adminDash.subscriptions.changePlan')}
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {showAssignFor && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-dark-950">{t('adminDash.subscriptions.assignTitle')}</h3>
              <button onClick={() => setShowAssignFor(null)} className="p-2 text-dark-400 hover:text-dark-600 hover:bg-gray-100 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-dark-600 mb-1.5">{t('adminDash.subscriptions.assignSelectPlan')}</label>
                <select value={assignPlanId} onChange={e => setAssignPlanId(e.target.value)} className={inputClass}>
                  <option value="">{t('adminDash.subscriptions.assignPickPlan')}</option>
                  {plans.filter(p => p.is_active).map(p => (
                    <option key={p.id} value={p.id}>{p.name} – {p.price_monthly} {t('adminDash.subscriptions.pricePerMonth')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-dark-600 mb-1.5">{t('adminDash.subscriptions.assignBilling')}</label>
                <div className="flex gap-3">
                  <button onClick={() => setAssignBilling('monthly')} className={`flex-1 py-2.5 text-sm font-semibold rounded-xl border-2 transition-all ${assignBilling === 'monthly' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 text-dark-500 hover:border-gray-300'}`}>
                    {t('adminDash.subscriptions.billingMonthly')}
                  </button>
                  <button onClick={() => setAssignBilling('yearly')} className={`flex-1 py-2.5 text-sm font-semibold rounded-xl border-2 transition-all ${assignBilling === 'yearly' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 text-dark-500 hover:border-gray-300'}`}>
                    {t('adminDash.subscriptions.billingYearly')}
                    {assignPlanId && plans.find(p => p.id === assignPlanId)?.yearly_discount_percent ? (
                      <span className="ml-1 text-xs text-green-600">(-{plans.find(p => p.id === assignPlanId)?.yearly_discount_percent}%)</span>
                    ) : null}
                  </button>
                </div>
              </div>
              {assignPlanId && (
                <div className="bg-gray-50 rounded-xl p-4">
                  {(() => {
                    const p = plans.find(pl => pl.id === assignPlanId);
                    if (!p) return null;
                    const price = assignBilling === 'yearly' ? p.price_yearly : p.price_monthly;
                    const periodLabel = assignBilling === 'yearly' ? t('adminDash.subscriptions.perYear') : t('adminDash.subscriptions.perMonth');
                    const billingLabel = assignBilling === 'yearly' ? t('adminDash.subscriptions.billingYearlyLabel') : t('adminDash.subscriptions.billingMonthlyLabel');
                    return (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-dark-950">{p.name}</p>
                          <p className="text-xs text-dark-400">{billingLabel}</p>
                        </div>
                        <p className="text-lg font-bold text-green-600">{price} EUR/{periodLabel}</p>
                      </div>
                    );
                  })()}
                </div>
              )}
              <button onClick={assignPlanToCompany} disabled={!assignPlanId || assignSaving} className="w-full py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                {assignSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('adminDash.subscriptions.assignButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function HomepagePricingPreview({ plans }: { plans: SubscriptionPlan[] }) {
  const { t } = useTranslation();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div>
      <div className="flex justify-center mb-8">
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button onClick={() => setBilling('monthly')} className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${billing === 'monthly' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-400 hover:text-dark-700'}`}>
            {t('adminDash.subscriptions.billingMonthly')}
          </button>
          <button onClick={() => setBilling('yearly')} className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${billing === 'yearly' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-400 hover:text-dark-700'}`}>
            {t('adminDash.subscriptions.billingYearly')}
            <span className="ml-1.5 text-[10px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">-20%</span>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {plans.map(plan => {
          const meta = PLAN_META[plan.name] || { icon: <Star className="w-5 h-5" />, gradient: 'from-gray-500 to-gray-600', badge: '' };
          const price = billing === 'yearly' && plan.price_yearly > 0 ? Math.round(plan.price_yearly / 12) : plan.price_monthly;
          const totalPrice = billing === 'yearly' ? plan.price_yearly : plan.price_monthly;

          return (
            <div key={plan.id} className={`rounded-2xl border-2 overflow-hidden ${plan.is_popular ? 'border-amber-400 shadow-xl shadow-amber-100 scale-[1.02]' : 'border-gray-100'}`}>
              {plan.is_popular && (
                <div className="bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider text-center py-1.5">
                  {t('adminDash.subscriptions.mostPopular')}
                </div>
              )}
              <div className={`bg-gradient-to-br ${meta.gradient} p-5 text-white`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">{meta.icon}</div>
                  <div>
                    <h3 className="font-bold text-base">{plan.name}</h3>
                    <p className="text-white/70 text-[11px]">{plan.description}</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold">{price}</span>
                  <span className="text-white/70 text-sm">{t('adminDash.subscriptions.pricePerMonth')}</span>
                </div>
                {billing === 'yearly' && plan.price_yearly > 0 && (
                  <p className="text-white/60 text-xs mt-0.5">{t('adminDash.subscriptions.pricePerYearBilled', { price: totalPrice })}</p>
                )}
                {billing === 'monthly' && plan.price_monthly === 0 && (
                  <p className="text-white/60 text-xs mt-0.5">{t('adminDash.subscriptions.free')}</p>
                )}
              </div>
              <div className="bg-white p-5">
                <ul className="space-y-2 mb-5">
                  <li className="flex items-center gap-2 text-sm text-dark-700 font-medium">
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                    {plan.max_vehicles === -1 ? t('adminDash.subscriptions.unlimitedVehicles') : t('adminDash.subscriptions.vehiclesCount', { count: plan.max_vehicles })}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-dark-700 font-medium">
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                    {plan.max_bookings_monthly === -1 ? t('adminDash.subscriptions.unlimitedBookings') : t('adminDash.subscriptions.bookingsPerMonth', { count: plan.max_bookings_monthly })}
                  </li>
                  {(plan.features || []).slice(0, 4).map((ft, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-dark-600">
                      <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      {ft}
                    </li>
                  ))}
                  {(plan.features || []).length > 4 && (
                    <li className="text-xs text-dark-400 pl-6">{t('adminDash.subscriptions.moreFeatures', { count: plan.features.length - 4 })}</li>
                  )}
                </ul>
                <button className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all bg-gradient-to-r ${meta.gradient} text-white hover:opacity-90`}>
                  {plan.price_monthly === 0 ? t('adminDash.subscriptions.startFree') : t('adminDash.subscriptions.subscribeNow')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
