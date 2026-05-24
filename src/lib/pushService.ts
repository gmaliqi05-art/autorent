/**
 * pushService — menaxhon Web Push subscriptions ne browser.
 *
 * Flow:
 *  1. subscribeToPush(): kerkon leje, abonon ne PushManager, ruan ne DB.
 *  2. unsubscribeFromPush(): heq subscription-in lokal + nga DB.
 *  3. getPushStatus(): kthen gjendjen aktuale.
 *
 * VAPID public key shfaqet ne client-side qe nga build env (VITE_VAPID_PUBLIC_KEY).
 */
import { supabase } from './supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export type PushStatus =
  | 'unsupported'
  | 'denied'
  | 'default'
  | 'granted-no-subscription'
  | 'subscribed';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function isPushAvailable(): boolean {
  return isPushSupported() && !!VAPID_PUBLIC_KEY;
}

export async function getPushStatus(): Promise<PushStatus> {
  if (!isPushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  if (Notification.permission === 'default') return 'default';

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  return sub ? 'subscribed' : 'granted-no-subscription';
}

export async function subscribeToPush(): Promise<{ success: boolean; error?: string }> {
  if (!isPushSupported()) {
    return { success: false, error: 'Browser nuk mbeshtet Push API' };
  }
  if (!VAPID_PUBLIC_KEY) {
    return { success: false, error: 'VAPID public key nuk eshte konfiguruar' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: permission === 'denied' ? 'Leja u refuzua' : 'Leja u anulua' };
    }

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();

    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const subJson = sub.toJSON();
    if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
      return { success: false, error: 'Subscription i pavlefshem' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Nuk jeni i loguar' };

    // upsert sipas endpoint (UNIQUE), nese ka konflikt rifresko keys
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: user.id,
        endpoint: subJson.endpoint,
        p256dh_key: subJson.keys.p256dh,
        auth_key: subJson.keys.auth,
        user_agent: navigator.userAgent,
        last_used_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' },
    );

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Gabim i panjohur',
    };
  }
}

export async function unsubscribeFromPush(): Promise<{ success: boolean; error?: string }> {
  if (!isPushSupported()) return { success: true };

  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return { success: true };

    const endpoint = sub.endpoint;
    await sub.unsubscribe();

    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Gabim i panjohur',
    };
  }
}
