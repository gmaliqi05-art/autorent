import { useState, useEffect } from 'react';
import { Bell, BellOff, Mail, Smartphone, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import {
  isPushAvailable,
  getPushStatus,
  subscribeToPush,
  unsubscribeFromPush,
  type PushStatus,
} from '../../lib/pushService';

interface Prefs {
  email_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  marketing_emails: boolean;
  pickup_reminders: boolean;
  booking_updates: boolean;
  payment_alerts: boolean;
}

const DEFAULT_PREFS: Prefs = {
  email_enabled: true,
  push_enabled: true,
  in_app_enabled: true,
  marketing_emails: false,
  pickup_reminders: true,
  booking_updates: true,
  payment_alerts: true,
};

export default function NotificationPreferencesCard({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushStatus, setPushStatus] = useState<PushStatus>('default');
  const [pushBusy, setPushBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    void load();
    void refreshPushStatus();
  }, [userId]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      setPrefs({
        email_enabled: data.email_enabled,
        push_enabled: data.push_enabled,
        in_app_enabled: data.in_app_enabled,
        marketing_emails: data.marketing_emails,
        pickup_reminders: data.pickup_reminders,
        booking_updates: data.booking_updates,
        payment_alerts: data.payment_alerts,
      });
    }
    setLoading(false);
  }

  async function refreshPushStatus() {
    if (!isPushAvailable()) {
      setPushStatus('unsupported');
      return;
    }
    setPushStatus(await getPushStatus());
  }

  async function savePrefs(next: Prefs) {
    setSaving(true);
    setMessage(null);
    const { error } = await supabase.from('notification_preferences').upsert(
      { user_id: userId, ...next },
      { onConflict: 'user_id' },
    );
    setSaving(false);
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: t('notificationPrefs.saved', 'Preferencat u ruajten') });
      setTimeout(() => setMessage(null), 2500);
    }
  }

  function toggle<K extends keyof Prefs>(key: K) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    void savePrefs(next);
  }

  async function handlePushToggle() {
    setPushBusy(true);
    setMessage(null);

    if (pushStatus === 'subscribed') {
      const res = await unsubscribeFromPush();
      if (res.success) {
        const next = { ...prefs, push_enabled: false };
        setPrefs(next);
        void savePrefs(next);
      } else {
        setMessage({ type: 'error', text: res.error || t('notificationPrefs.pushFailed', 'Deshtoi') });
      }
    } else {
      const res = await subscribeToPush();
      if (res.success) {
        const next = { ...prefs, push_enabled: true };
        setPrefs(next);
        void savePrefs(next);
      } else {
        setMessage({ type: 'error', text: res.error || t('notificationPrefs.pushFailed', 'Deshtoi') });
      }
    }
    await refreshPushStatus();
    setPushBusy(false);
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
      </div>
    );
  }

  const pushSubscribed = pushStatus === 'subscribed';
  const pushDenied = pushStatus === 'denied';
  const pushUnsupported = pushStatus === 'unsupported';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-dark-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary-600" />
            {t('notificationPrefs.title', 'Preferencat e njoftimeve')}
          </h3>
          <p className="text-sm text-dark-500 mt-0.5">
            {t('notificationPrefs.subtitle', 'Zgjidh si do te njoftohesh')}
          </p>
        </div>
        {saving && <Loader2 className="w-4 h-4 animate-spin text-dark-400" />}
      </div>

      {message && (
        <div
          className={`flex items-start gap-2 px-3 py-2 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Kanalet */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-dark-500">
          {t('notificationPrefs.channels', 'Kanalet')}
        </h4>

        <ChannelRow
          icon={<Smartphone className="w-4 h-4" />}
          label={t('notificationPrefs.pushTitle', 'Njoftime push ne shfletues')}
          description={
            pushUnsupported
              ? t('notificationPrefs.pushUnsupported', 'Shfletuesi yt nuk e mbeshtet')
              : pushDenied
                ? t('notificationPrefs.pushDenied', 'Te kerkohet leja nga shfletuesi (block)')
                : pushSubscribed
                  ? t('notificationPrefs.pushOn', 'Aktiv ne kete pajisje')
                  : t('notificationPrefs.pushOff', 'I cakuar')
          }
          checked={pushSubscribed && prefs.push_enabled}
          disabled={pushUnsupported || pushDenied || pushBusy}
          busy={pushBusy}
          onChange={handlePushToggle}
        />

        <ChannelRow
          icon={<Mail className="w-4 h-4" />}
          label={t('notificationPrefs.emailTitle', 'Njoftime me email')}
          description={t('notificationPrefs.emailDesc', 'Konfirmime rezervimi, fatura, kujtues')}
          checked={prefs.email_enabled}
          onChange={() => toggle('email_enabled')}
        />

        <ChannelRow
          icon={<Bell className="w-4 h-4" />}
          label={t('notificationPrefs.inAppTitle', 'Njoftime ne app')}
          description={t('notificationPrefs.inAppDesc', 'Zilja lart djathtas + dashboard')}
          checked={prefs.in_app_enabled}
          onChange={() => toggle('in_app_enabled')}
        />
      </div>

      {/* Llojet */}
      <div className="space-y-3 pt-2 border-t border-gray-100">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-dark-500">
          {t('notificationPrefs.types', 'Llojet')}
        </h4>

        <ChannelRow
          label={t('notificationPrefs.bookingUpdates', 'Perditesime rezervimi')}
          description={t('notificationPrefs.bookingUpdatesDesc', 'Aprovim, refuzim, ndryshim statusi')}
          checked={prefs.booking_updates}
          onChange={() => toggle('booking_updates')}
        />

        <ChannelRow
          label={t('notificationPrefs.pickupReminders', 'Kujtues per marrjen')}
          description={t('notificationPrefs.pickupRemindersDesc', '24 ore para datës se marrjes')}
          checked={prefs.pickup_reminders}
          onChange={() => toggle('pickup_reminders')}
        />

        <ChannelRow
          label={t('notificationPrefs.paymentAlerts', 'Alerte pagese')}
          description={t('notificationPrefs.paymentAlertsDesc', 'Pagesa te suksesshme, te deshtuara')}
          checked={prefs.payment_alerts}
          onChange={() => toggle('payment_alerts')}
        />

        <ChannelRow
          label={t('notificationPrefs.marketingEmails', 'Email-e marketingu')}
          description={t('notificationPrefs.marketingDesc', 'Oferta dhe lajme te platformes')}
          checked={prefs.marketing_emails}
          onChange={() => toggle('marketing_emails')}
        />
      </div>

      {pushDenied && (
        <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          <BellOff className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            {t(
              'notificationPrefs.pushDeniedHelp',
              'Per te aktivizuar push, fillimisht leje shfletuesin nga ikona afer shiritit te adreses.',
            )}
          </span>
        </div>
      )}
    </div>
  );
}

interface ChannelRowProps {
  icon?: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  busy?: boolean;
  onChange: () => void;
}

function ChannelRow({ icon, label, description, checked, disabled, busy, onChange }: ChannelRowProps) {
  return (
    <label className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
      disabled
        ? 'border-gray-100 bg-gray-50/50 cursor-not-allowed opacity-60'
        : 'border-gray-200 hover:bg-gray-50 cursor-pointer'
    }`}>
      {icon && <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">{icon}</div>}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-dark-900">{label}</p>
        <p className="text-xs text-dark-500 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed ${
          checked ? 'bg-primary-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        >
          {busy && (
            <span className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-3 h-3 animate-spin text-primary-600" />
            </span>
          )}
        </span>
      </button>
    </label>
  );
}
