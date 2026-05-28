import { useState, useEffect } from 'react';
import { FileText, Save, Loader2, CheckCircle, Building2, Hash, Calendar, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNavItems, adminNavGroups } from '../../lib/adminNav';

interface InvoiceSettings {
  company_name: string;
  company_address: string;
  company_nui: string;
  company_vat: string;
  company_email: string;
  company_phone: string;
  company_website: string;
  invoice_prefix: string;
  invoice_start_number: number;
  payment_terms_days: number;
  currency: string;
  footer_text: string;
  show_vat: boolean;
  vat_rate: number;
  auto_issue: boolean;
  logo_url: string;
  bank_name: string;
  bank_iban: string;
  bank_swift: string;
}

const defaults: InvoiceSettings = {
  company_name: '', company_address: '', company_nui: '', company_vat: '',
  company_email: '', company_phone: '', company_website: '',
  invoice_prefix: 'INV', invoice_start_number: 1000, payment_terms_days: 30,
  currency: 'EUR', footer_text: 'Faleminderit per besimin tuaj!',
  show_vat: false, vat_rate: 20, auto_issue: false, logo_url: '',
  bank_name: '', bank_iban: '', bank_swift: '',
};

export default function AdminInvoiceSettings() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<InvoiceSettings>(defaults);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'company' | 'numbering' | 'payment' | 'appearance'>('company');

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    const { data } = await supabase.from('platform_settings').select('*').eq('key', 'invoice_settings').maybeSingle();
    if (data?.value) setSettings({ ...defaults, ...(data.value as Partial<InvoiceSettings>) });
    setLoading(false);
  }

  async function save() {
    setSaving(true);
    const { data: ex } = await supabase.from('platform_settings').select('id').eq('key', 'invoice_settings').maybeSingle();
    if (ex) await supabase.from('platform_settings').update({ value: settings as any }).eq('key', 'invoice_settings');
    else await supabase.from('platform_settings').insert({ key: 'invoice_settings', value: settings as any });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000);
  }

  const f = (key: keyof InvoiceSettings, val: any) => setSettings(s => ({ ...s, [key]: val }));

  const tabs = [
    { id: 'company', label: t('adminDash.invoiceSettings.tabCompany'), icon: Building2 },
    { id: 'numbering', label: t('adminDash.invoiceSettings.tabNumbering'), icon: Hash },
    { id: 'payment', label: t('adminDash.invoiceSettings.tabPayment'), icon: Settings },
    { id: 'appearance', label: t('adminDash.invoiceSettings.tabAppearance'), icon: FileText },
  ] as const;

  return (
    <DashboardLayout navItems={adminNavItems} navGroups={adminNavGroups} title={t('adminDash.invoiceSettings.title')}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('adminDash.invoiceSettings.title')}</h1>
            <p className="text-gray-500 text-sm mt-1">{t('adminDash.invoiceSettings.subtitle')}</p>
          </div>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? t('adminDash.invoiceSettings.saving') : saved ? t('adminDash.invoiceSettings.saved') : t('adminDash.invoiceSettings.save')}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-4 gap-6">
            <div className="col-span-1 bg-white rounded-xl border border-gray-100 p-4 h-fit">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setTab(id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors mb-1 text-left ${tab === id ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <Icon className="w-4 h-4" />{label}
                </button>
              ))}
            </div>

            <div className="col-span-3 bg-white rounded-xl border border-gray-100 p-6">
              {tab === 'company' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Building2 className="w-5 h-5 text-primary-600" />{t('adminDash.invoiceSettings.companyTitle')}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'company_name', label: t('adminDash.invoiceSettings.companyName'), placeholder: 'RentCar Albania' },
                      { key: 'company_nui', label: t('adminDash.invoiceSettings.companyNui'), placeholder: 'K12345678A' },
                      { key: 'company_vat', label: t('adminDash.invoiceSettings.companyVat'), placeholder: 'AL12345678' },
                      { key: 'company_email', label: t('adminDash.invoiceSettings.companyEmail'), placeholder: 'info@example.com' },
                      { key: 'company_phone', label: t('adminDash.invoiceSettings.companyPhone'), placeholder: '+355 69 000 0000' },
                      { key: 'company_website', label: t('adminDash.invoiceSettings.companyWebsite'), placeholder: 'https://example.com' },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label htmlFor={`inv-${key}`} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                        <input id={`inv-${key}`} value={(settings as any)[key]} onChange={e => f(key as any, e.target.value)} placeholder={placeholder}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label htmlFor="inv-company_address" className="block text-sm font-medium text-gray-700 mb-1">{t('adminDash.invoiceSettings.companyAddress')}</label>
                    <textarea id="inv-company_address" value={settings.company_address} onChange={e => f('company_address', e.target.value)} rows={2}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>
              )}

              {tab === 'numbering' && (
                <div className="space-y-5">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Hash className="w-5 h-5 text-primary-600" />{t('adminDash.invoiceSettings.numberingTitle')}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="inv-prefix" className="block text-sm font-medium text-gray-700 mb-1">{t('adminDash.invoiceSettings.prefix')}</label>
                      <input id="inv-prefix" value={settings.invoice_prefix} onChange={e => f('invoice_prefix', e.target.value)} placeholder="INV"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div>
                      <label htmlFor="inv-start-number" className="block text-sm font-medium text-gray-700 mb-1">{t('adminDash.invoiceSettings.startNumber')}</label>
                      <input id="inv-start-number" type="number" value={settings.invoice_start_number} onChange={e => f('invoice_start_number', parseInt(e.target.value))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-700">{t('adminDash.invoiceSettings.exampleInvoice')} <strong className="font-mono text-primary-700">{settings.invoice_prefix}-{settings.invoice_start_number}</strong></p>
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-gray-100">
                    <div>
                      <div className="text-sm font-medium text-gray-700">{t('adminDash.invoiceSettings.autoIssue')}</div>
                      <div className="text-xs text-gray-500">{t('adminDash.invoiceSettings.autoIssueDesc')}</div>
                    </div>
                    <button onClick={() => f('auto_issue', !settings.auto_issue)}
                      className={`w-12 h-6 rounded-full transition-colors ${settings.auto_issue ? 'bg-primary-600' : 'bg-gray-300'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${settings.auto_issue ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              )}

              {tab === 'payment' && (
                <div className="space-y-5">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Settings className="w-5 h-5 text-primary-600" />{t('adminDash.invoiceSettings.paymentTitle')}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="inv-currency" className="block text-sm font-medium text-gray-700 mb-1">{t('adminDash.invoiceSettings.currency')}</label>
                      <select id="inv-currency" value={settings.currency} onChange={e => f('currency', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option value="EUR">EUR (€)</option>
                        <option value="ALL">ALL (Lek)</option>
                        <option value="USD">USD ($)</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="inv-payment-terms" className="block text-sm font-medium text-gray-700 mb-1">{t('adminDash.invoiceSettings.paymentTermsDays')}</label>
                      <input id="inv-payment-terms" type="number" value={settings.payment_terms_days} onChange={e => f('payment_terms_days', parseInt(e.target.value))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-gray-100">
                    <div>
                      <div className="text-sm font-medium text-gray-700">{t('adminDash.invoiceSettings.vatActive')}</div>
                      <div className="text-xs text-gray-500">{t('adminDash.invoiceSettings.vatActiveDesc')}</div>
                    </div>
                    <button onClick={() => f('show_vat', !settings.show_vat)}
                      className={`w-12 h-6 rounded-full transition-colors ${settings.show_vat ? 'bg-primary-600' : 'bg-gray-300'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${settings.show_vat ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  {settings.show_vat && (
                    <div>
                      <label htmlFor="inv-vat-rate" className="block text-sm font-medium text-gray-700 mb-1">{t('adminDash.invoiceSettings.vatRate')}</label>
                      <input id="inv-vat-rate" type="number" value={settings.vat_rate} onChange={e => f('vat_rate', parseInt(e.target.value))} min={0} max={50}
                        className="w-32 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                  )}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-700">{t('adminDash.invoiceSettings.bankDetailsTitle')}</h4>
                    {[
                      { key: 'bank_name', label: t('adminDash.invoiceSettings.bankName'), placeholder: 'Banka Credins' },
                      { key: 'bank_iban', label: t('adminDash.invoiceSettings.iban'), placeholder: 'AL47 0121 1009 0000 0002 3569 874' },
                      { key: 'bank_swift', label: t('adminDash.invoiceSettings.swift'), placeholder: 'CDISALTRXXX' },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label htmlFor={`inv-${key}`} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                        <input id={`inv-${key}`} value={(settings as any)[key]} onChange={e => f(key as any, e.target.value)} placeholder={placeholder}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === 'appearance' && (
                <div className="space-y-5">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2"><FileText className="w-5 h-5 text-primary-600" />{t('adminDash.invoiceSettings.appearanceTitle')}</h3>
                  <div>
                    <label htmlFor="inv-logo-url" className="block text-sm font-medium text-gray-700 mb-1">{t('adminDash.invoiceSettings.logoUrl')}</label>
                    <input id="inv-logo-url" value={settings.logo_url} onChange={e => f('logo_url', e.target.value)} placeholder="https://..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    {settings.logo_url && <img src={settings.logo_url} alt="Logo" className="mt-2 h-12 object-contain border border-gray-200 rounded-lg p-1" />}
                  </div>
                  <div>
                    <label htmlFor="inv-footer-text" className="block text-sm font-medium text-gray-700 mb-1">{t('adminDash.invoiceSettings.footerText')}</label>
                    <textarea id="inv-footer-text" value={settings.footer_text} onChange={e => f('footer_text', e.target.value)} rows={3}
                      placeholder={t('adminDash.invoiceSettings.footerPlaceholder')} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
