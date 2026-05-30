/**
 * 🔒 PROTECTED COMPONENT — DO NOT DELETE OR REVERT
 *
 * Real-time notification bell that subscribes to Supabase channels
 * for postgres_changes on the notifications table. Shows unread count
 * + dropdown with recent notifications. Used in Navbar.
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Notification } from '../../lib/types';

interface NotificationBellProps {
  isTransparent?: boolean;
}

const MAX_DISPLAY = 8;

function timeAgo(iso: string, t: (k: string, opts?: Record<string, unknown>) => string, locale: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return t('time.justNow');
  if (diff < 3600) return t('time.minutesAgo', { count: Math.floor(diff / 60) });
  if (diff < 86400) return t('time.hoursAgo', { count: Math.floor(diff / 3600) });
  if (diff < 604800) return t('time.daysAgo', { count: Math.floor(diff / 86400) });
  const localeMap: Record<string, string> = { sq: 'sq-AL', en: 'en-US', de: 'de-DE' };
  return new Date(iso).toLocaleDateString(localeMap[locale] || 'sq-AL');
}

export default function NotificationBell({ isTransparent = false }: NotificationBellProps) {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Initial load + realtime subscription
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(MAX_DISPLAY);
      if (!cancelled) {
        const list = (data || []) as Notification[];
        setNotifications(list);
        setUnreadCount(list.filter(n => !n.is_read).length);
        setLoading(false);
      }
    })();

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotif = payload.new as Notification;
            setNotifications(prev => [newNotif, ...prev].slice(0, MAX_DISPLAY));
            if (!newNotif.is_read) setUnreadCount(c => c + 1);
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Notification;
            setNotifications(prev => prev.map(n => n.id === updated.id ? updated : n));
            // rifresko unread count
            setNotifications(prev => {
              setUnreadCount(prev.filter(n => !n.is_read).length);
              return prev;
            });
          } else if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id: string }).id;
            setNotifications(prev => prev.filter(n => n.id !== oldId));
          }
        },
      )
      .subscribe();
    channelRef.current = channel;

    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user]);

  async function markOneAsRead(id: string) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', user!.id);
  }

  async function markAllAsRead() {
    if (!user || unreadCount === 0) return;
    setMarking(true);
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    setMarking(false);
  }

  if (!user) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`relative p-2 rounded-lg transition-colors ${
          isTransparent ? 'hover:bg-white/10 text-white/90' : 'hover:bg-gray-100 text-dark-700'
        }`}
        aria-label={t('notifications.title')}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl shadow-dark-950/10 border border-gray-100 z-50 overflow-hidden animate-slide-down">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-dark-900 text-sm">{t('notifications.title')}</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={marking}
                  className="text-xs font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50 flex items-center gap-1"
                >
                  {marking && <Loader2 className="w-3 h-3 animate-spin" />}
                  {t('notifications.markAllRead')}
                </button>
              )}
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-dark-500">{t('notifications.empty')}</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors cursor-pointer ${
                      !n.is_read ? 'bg-primary-50/30' : ''
                    }`}
                    onClick={() => {
                      if (!n.is_read) markOneAsRead(n.id);
                      setOpen(false);
                    }}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                        !n.is_read ? 'bg-primary-600' : 'bg-gray-300'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-dark-900 leading-tight">{n.title}</p>
                      <p className="text-xs text-dark-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-dark-400 mt-1">{timeAgo(n.created_at, t, i18n.language)}</p>
                    </div>
                    {!n.is_read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markOneAsRead(n.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:bg-gray-200 p-1 rounded transition-all"
                        title={t('notifications.markRead')}
                      >
                        <Check className="w-3.5 h-3.5 text-dark-500" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-gray-100 px-4 py-2.5">
              <Link
                to="/dashboard"
                onClick={() => setOpen(false)}
                className="block text-xs text-center text-primary-600 hover:text-primary-700 font-medium"
              >
                {t('notifications.goDashboard')}
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
