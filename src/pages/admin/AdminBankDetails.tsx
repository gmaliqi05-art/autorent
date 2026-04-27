import { useState, useEffect } from 'react';
import { CreditCard, Save, Loader2, CheckCircle, Plus, Trash2, Building2, Eye, EyeOff, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNavItems, adminNavGroups } from '../../lib/adminNav';

interface BankAccount {
  id: string;
  bank_name: string;
  account_holder: string;
  iban: string;
  swift: string;
  currency: string;
  is_primary: boolean;
  is_active: boolean;
}

interface PaymentConfig {
  stripe_enabled: boolean;
  stripe_public_key: string;
  stripe_secret_key: string;
  paypal_enabled: boolean;
  paypal_client_id: string;
  paypal_secret: string;
  cash_enabled: boolean;
  bank_transfer_enabled: boolean;
  minimum_payment_amount: number;
  commission_rate: number;
}

const defaultConfig: PaymentConfig = {
  stripe_enabled: false, stripe_public_key: '', stripe_secret_key: '',
  paypal_enabled: false, paypal_client_id: '', paypal_secret: '',
  cash_enabled: true, bank_transfer_enabled: true,
  minimum_payment_amount: 10, commission_rate: 5,
};

export default function AdminBankDetails() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [config, setConfig] = useState<PaymentConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [newAccount, setNewAccount] = useState<Partial<BankAccount>>({});
  const [addingNew, setAddingNew] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: cfg } = await supabase.from('platform_settings').select('*').eq('key', 'payment_config').maybeSingle();
    if (cfg?.value) setConfig({ ...defaultConfig, ...(cfg.value as Partial<PaymentConfig>) });
    const { data: accs } = await supabase.from('bank_accounts').select('*').order('is_primary', { ascending: false });
    setAccounts(accs || []);
    setLoading(false);
  }

  async function saveConfig() {
    setSaving(true);
    const { data: ex } = await supabase.from('platform_settings').select('id').eq('key', 'payment_config').maybeSingle();
    if (ex) await supabase.from('platform_settings').update({ value: config as any }).eq('key', 'payment_config');
    else await supabase.from('platform_settings').insert({ key: 'payment_config', value: config as any });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000);
  }

  async function addAccount() {
    if (!newAccount.bank_name || !newAccount.iban) return;
    const { data } = await supabase.from('bank_accounts').insert({
      ...newAccount,
      is_primary: accounts.length === 0,
      is_active: true,
    }).select().single();
    if (data) setAccounts(a => [...a, data]);
    setNewAccount({});
    setAddingNew(false);
  }

  async function togglePrimary(id: string) {
    await supabase.from('bank_accounts').update({ is_primary: false }).neq('id', id);
    await supabase.from('bank_accounts').update({ is_primary: true }).eq('id', id);
    setAccounts(a => a.map(acc => ({ ...acc, is_primary: acc.id === id })));
  }

  async function deleteAccount(id: string) {
    await supabase.from('bank_accounts').delete().eq('id', id);
    setAccounts(a => a.filter(acc => acc.id !== id));
  }

  const f = (key: keyof PaymentConfig, val: any) => setConfig(s => ({ ...s, [key]: val }));

  return (
    <DashboardLayout navItems={adminNavItems} navGroups={adminNavGroups} title="Te Dhenat Bankare">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Te Dhenat Bankare</h1>
            <p className="text-gray-500 text-sm mt-1">Konfiguroni llogarite bankare dhe metodat e pagesave</p>
          </div>
          <button onClick={saveConfig} disabled={saving}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? 'Duke ruajtur...' : saved ? 'U ruajt!' : 'Ruaj'}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Building2 className="w-5 h-5 text-primary-600" />Llogarite Bankare</h3>
                <button onClick={() => setAddingNew(true)} className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium">
                  <Plus className="w-4 h-4" />Shto llogari
                </button>
              </div>
              <div className="space-y-3">
                {accounts.map(acc => (
                  <div key={acc.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 ${acc.is_primary ? 'border-primary-200 bg-primary-50' : 'border-gray-100 bg-gray-50'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${acc.is_primary ? 'bg-primary-100' : 'bg-gray-200'}`}>
                      <CreditCard className={`w-5 h-5 ${acc.is_primary ? 'text-primary-600' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">{acc.bank_name}</span>
                        {acc.is_primary && <span className="px-2 py-0.5 rounded-full text-xs bg-primary-600 text-white font-medium">Kryesore</span>}
                      </div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">{acc.iban}</div>
                      <div className="text-xs text-gray-400">{acc.account_holder} · {acc.currency}</div>
                    </div>
                    <div className="flex gap-2">
                      {!acc.is_primary && (
                        <button onClick={() => togglePrimary(acc.id)} className="text-xs text-primary-600 hover:text-primary-700 font-medium px-3 py-1.5 rounded-lg hover:bg-primary-50">
                          Beje kryesore
                        </button>
                      )}
                      <button onClick={() => deleteAccount(acc.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {accounts.length === 0 && !addingNew && (
                  <div className="text-center py-8 text-gray-400">
                    <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>Nuk ka llogari bankare te shtuara</p>
                  </div>
                )}
                {addingNew && (
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-3">
                    <h4 className="font-medium text-blue-900">Shto llogari te re</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: 'bank_name', label: 'Emri bankes', placeholder: 'Banka Credins' },
                        { key: 'account_holder', label: 'Titullari', placeholder: 'Emri i plote' },
                        { key: 'iban', label: 'IBAN', placeholder: 'AL47...' },
                        { key: 'swift', label: 'SWIFT/BIC', placeholder: 'CDISALTRXXX' },
                      ].map(({ key, label, placeholder }) => (
                        <div key={key}>
                          <label className="block text-xs font-medium text-blue-800 mb-1">{label}</label>
                          <input value={(newAccount as any)[key] || ''} onChange={e => setNewAccount(a => ({ ...a, [key]: e.target.value }))}
                            placeholder={placeholder} className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-blue-800 mb-1">Valuta</label>
                      <select value={newAccount.currency || 'EUR'} onChange={e => setNewAccount(a => ({ ...a, currency: e.target.value }))}
                        className="border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                        <option value="EUR">EUR</option><option value="ALL">ALL</option><option value="USD">USD</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={addAccount} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Shto</button>
                      <button onClick={() => setAddingNew(false)} className="px-4 py-2 border border-blue-200 text-blue-700 rounded-lg text-sm hover:bg-blue-100">Anulo</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Shield className="w-5 h-5 text-primary-600" />Metodat e Pagesave</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">Kesh</div>
                    <div className="text-xs text-gray-500">Pagese me para ne dore</div>
                  </div>
                  <button onClick={() => f('cash_enabled', !config.cash_enabled)}
                    className={`w-12 h-6 rounded-full transition-colors ${config.cash_enabled ? 'bg-primary-600' : 'bg-gray-300'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${config.cash_enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">Transfer Bankar</div>
                    <div className="text-xs text-gray-500">Transferim bankar direkt</div>
                  </div>
                  <button onClick={() => f('bank_transfer_enabled', !config.bank_transfer_enabled)}
                    className={`w-12 h-6 rounded-full transition-colors ${config.bank_transfer_enabled ? 'bg-primary-600' : 'bg-gray-300'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${config.bank_transfer_enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
              <div className="p-4 border border-gray-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 text-sm flex items-center gap-2">Stripe <span className="text-xs text-gray-400 font-normal">(Karte krediti)</span></div>
                  </div>
                  <button onClick={() => f('stripe_enabled', !config.stripe_enabled)}
                    className={`w-12 h-6 rounded-full transition-colors ${config.stripe_enabled ? 'bg-primary-600' : 'bg-gray-300'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${config.stripe_enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
                {config.stripe_enabled && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Public Key</label>
                      <input value={config.stripe_public_key} onChange={e => f('stripe_public_key', e.target.value)}
                        placeholder="pk_..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Secret Key</label>
                      <div className="relative">
                        <input type={showSecrets.stripe_secret ? 'text' : 'password'} value={config.stripe_secret_key} onChange={e => f('stripe_secret_key', e.target.value)}
                          placeholder="sk_..." className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        <button onClick={() => setShowSecrets(s => ({ ...s, stripe_secret: !s.stripe_secret }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                          {showSecrets.stripe_secret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Komisionet & Limitet</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Komisioni i platformes (%)</label>
                  <input type="number" value={config.commission_rate} onChange={e => f('commission_rate', parseFloat(e.target.value))} min={0} max={50} step={0.5}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pagesa minimale (€)</label>
                  <input type="number" value={config.minimum_payment_amount} onChange={e => f('minimum_payment_amount', parseFloat(e.target.value))} min={1}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
