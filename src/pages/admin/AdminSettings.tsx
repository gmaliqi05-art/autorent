import { useState, useEffect } from 'react';
import { Save, Loader2, CreditCard, MessageSquare, Building2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNavItems, adminNavGroups } from '../../lib/adminNav';

interface PaymentSettings {
  stripe_enabled: boolean;
  paypal_enabled: boolean;
  bank_transfer_enabled: boolean;
  stripe_public_key: string;
  paypal_client_id: string;
  bank_details: {
    bank_name: string;
    iban: string;
    swift: string;
    account_holder: string;
  };
}

interface ChatSettings {
  enabled: boolean;
  welcome_message: string;
  offline_message: string;
  auto_response_delay_ms: number;
}

interface PlatformInfo {
  name: string;
  company: string;
  nui: string;
  email: string;
  phone: string;
  address: string;
}

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [payment, setPayment] = useState<PaymentSettings | null>(null);
  const [chat, setChat] = useState<ChatSettings | null>(null);
  const [platform, setPlatform] = useState<PlatformInfo | null>(null);

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    const { data } = await supabase.from('platform_settings').select('*');
    const settings = data || [];
    const paymentRow = settings.find(s => s.key === 'payment_methods');
    const chatRow = settings.find(s => s.key === 'chat_settings');
    const platformRow = settings.find(s => s.key === 'platform_info');
    if (paymentRow) setPayment(paymentRow.value as unknown as PaymentSettings);
    if (chatRow) setChat(chatRow.value as unknown as ChatSettings);
    if (platformRow) setPlatform(platformRow.value as unknown as PlatformInfo);
    setLoading(false);
  }

  async function saveSetting(key: string, value: unknown) {
    setSaving(key);
    await supabase.from('platform_settings').update({ value, updated_at: new Date().toISOString() }).eq('key', key);
    setSaving('');
  }

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark-950">Cilesimet e platformes</h1>
        <p className="text-dark-500 mt-1 text-[15px]">Konfigurimet e pageses, chat-it, dhe informacionet e biznesit</p>
      </div>

      <div className="space-y-6">
        {payment && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-green-600" />
              <h2 className="font-semibold text-dark-950">Metodat e pageses</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-xl border-2 transition-colors ${payment.stripe_enabled ? 'border-green-200 bg-green-50/50' : 'border-gray-100 bg-gray-50/50'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-dark-900">Stripe</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={payment.stripe_enabled} onChange={e => setPayment(p => p ? { ...p, stripe_enabled: e.target.checked } : p)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600" />
                    </label>
                  </div>
                  <p className="text-xs text-dark-400">Pagesa me karte krediti/debiti</p>
                  {payment.stripe_enabled && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                      <div className="flex gap-2 items-start">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-amber-700">Kerkohet konfigurimi i Stripe. Kontaktoni zhvilluesin per integrimin.</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className={`p-4 rounded-xl border-2 transition-colors ${payment.paypal_enabled ? 'border-green-200 bg-green-50/50' : 'border-gray-100 bg-gray-50/50'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-dark-900">PayPal</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={payment.paypal_enabled} onChange={e => setPayment(p => p ? { ...p, paypal_enabled: e.target.checked } : p)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600" />
                    </label>
                  </div>
                  <p className="text-xs text-dark-400">Pagesa permes PayPal</p>
                  {payment.paypal_enabled && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                      <div className="flex gap-2 items-start">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-amber-700">Kerkohet konfigurimi i PayPal. Kontaktoni zhvilluesin per integrimin.</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className={`p-4 rounded-xl border-2 transition-colors ${payment.bank_transfer_enabled ? 'border-green-200 bg-green-50/50' : 'border-gray-100 bg-gray-50/50'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-dark-900">Transferte bankare</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={payment.bank_transfer_enabled} onChange={e => setPayment(p => p ? { ...p, bank_transfer_enabled: e.target.checked } : p)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600" />
                    </label>
                  </div>
                  <p className="text-xs text-dark-400">Pagesa me transferte bankare</p>
                </div>
              </div>

              {payment.bank_transfer_enabled && (
                <div>
                  <h3 className="text-sm font-semibold text-dark-900 mb-3">Te dhenat bankare</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-dark-600 mb-1.5">Emri i bankes</label>
                      <input value={payment.bank_details.bank_name} onChange={e => setPayment(p => p ? { ...p, bank_details: { ...p.bank_details, bank_name: e.target.value } } : p)} className={inputClass} placeholder="p.sh. ProCredit Bank" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-dark-600 mb-1.5">Mbajtesi i llogarise</label>
                      <input value={payment.bank_details.account_holder} onChange={e => setPayment(p => p ? { ...p, bank_details: { ...p.bank_details, account_holder: e.target.value } } : p)} className={inputClass} placeholder="p.sh. Booking Shpk" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-dark-600 mb-1.5">IBAN</label>
                      <input value={payment.bank_details.iban} onChange={e => setPayment(p => p ? { ...p, bank_details: { ...p.bank_details, iban: e.target.value } } : p)} className={inputClass} placeholder="p.sh. XK05 1234 5678 9012 3456" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-dark-600 mb-1.5">SWIFT/BIC</label>
                      <input value={payment.bank_details.swift} onChange={e => setPayment(p => p ? { ...p, bank_details: { ...p.bank_details, swift: e.target.value } } : p)} className={inputClass} placeholder="p.sh. MBKOXKPR" />
                    </div>
                  </div>
                </div>
              )}

              <button onClick={() => saveSetting('payment_methods', payment)} disabled={saving === 'payment_methods'} className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all">
                {saving === 'payment_methods' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Ruaj ndryshimet
              </button>
            </div>
          </div>
        )}

        {chat && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-primary-600" />
              <h2 className="font-semibold text-dark-950">Cilesimet e Chat-it</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={chat.enabled} onChange={e => setChat(c => c ? { ...c, enabled: e.target.checked } : c)} className="sr-only peer" />
                  <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600" />
                </label>
                <span className="text-sm text-dark-700">Chat i aktivizuar</span>
              </div>
              <div>
                <label className="block text-xs font-medium text-dark-600 mb-1.5">Mesazhi i mireseardjes</label>
                <textarea value={chat.welcome_message} onChange={e => setChat(c => c ? { ...c, welcome_message: e.target.value } : c)} rows={2} className={`${inputClass} resize-none`} />
              </div>
              <div>
                <label className="block text-xs font-medium text-dark-600 mb-1.5">Mesazhi offline</label>
                <textarea value={chat.offline_message} onChange={e => setChat(c => c ? { ...c, offline_message: e.target.value } : c)} rows={2} className={`${inputClass} resize-none`} />
              </div>
              <div className="w-48">
                <label className="block text-xs font-medium text-dark-600 mb-1.5">Vonesa e pergjigjes (ms)</label>
                <input type="number" value={chat.auto_response_delay_ms} onChange={e => setChat(c => c ? { ...c, auto_response_delay_ms: +e.target.value } : c)} className={inputClass} />
              </div>
              <button onClick={() => saveSetting('chat_settings', chat)} disabled={saving === 'chat_settings'} className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all">
                {saving === 'chat_settings' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Ruaj ndryshimet
              </button>
            </div>
          </div>
        )}

        {platform && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <Building2 className="w-5 h-5 text-amber-600" />
              <h2 className="font-semibold text-dark-950">Informacionet e platformes</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-xs font-medium text-dark-600 mb-1.5">Emri i platformes</label>
                  <input value={platform.name} onChange={e => setPlatform(p => p ? { ...p, name: e.target.value } : p)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dark-600 mb-1.5">Kompania</label>
                  <input value={platform.company} onChange={e => setPlatform(p => p ? { ...p, company: e.target.value } : p)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dark-600 mb-1.5">NUI</label>
                  <input value={platform.nui} onChange={e => setPlatform(p => p ? { ...p, nui: e.target.value } : p)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dark-600 mb-1.5">Email</label>
                  <input value={platform.email} onChange={e => setPlatform(p => p ? { ...p, email: e.target.value } : p)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dark-600 mb-1.5">Telefoni</label>
                  <input value={platform.phone} onChange={e => setPlatform(p => p ? { ...p, phone: e.target.value } : p)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dark-600 mb-1.5">Adresa</label>
                  <input value={platform.address} onChange={e => setPlatform(p => p ? { ...p, address: e.target.value } : p)} className={inputClass} />
                </div>
              </div>
              <button onClick={() => saveSetting('platform_info', platform)} disabled={saving === 'platform_info'} className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all">
                {saving === 'platform_info' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Ruaj ndryshimet
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
