import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Car, Clock, MapPin, FileText, ArrowRight, DollarSign, TrendingUp, Bell, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Booking, Vehicle, Notification } from '../../lib/types';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { clientNavItems } from '../../lib/clientNav';
import { markNotificationRead, markAllNotificationsRead } from '../../lib/notificationService';

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Ne pritje', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Konfirmuar', color: 'bg-blue-100 text-blue-700' },
  active: { label: 'Aktiv', color: 'bg-green-100 text-green-700' },
  completed: { label: 'Perfunduar', color: 'bg-gray-100 text-gray-600' },
  cancelled: { label: 'Anuluar', color: 'bg-red-100 text-red-700' },
};

const notificationIcons: Record<string, React.ReactNode> = {
  booking_created: <FileText className="w-4 h-4 text-blue-500" />,
  booking_approved: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  booking_rejected: <AlertTriangle className="w-4 h-4 text-red-500" />,
  booking_completed: <CheckCircle2 className="w-4 h-4 text-dark-500" />,
  booking_started: <Car className="w-4 h-4 text-green-500" />,
};

export default function ClientDashboard() {
  const { user, profile } = useAuth();
  const [bookings, setBookings] = useState<(Booking & { vehicle?: Vehicle })[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  async function loadData() {
    const [bookingsRes, notificationsRes] = await Promise.all([
      supabase
        .from('bookings')
        .select('*, vehicle:vehicles(*)')
        .eq('client_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    setBookings((bookingsRes.data || []) as (Booking & { vehicle?: Vehicle })[]);
    setNotifications((notificationsRes.data || []) as Notification[]);
    setLoading(false);
  }

  const active = bookings.filter(b => b.status === 'active' || b.status === 'confirmed').length;
  const completed = bookings.filter(b => b.status === 'completed').length;
  const totalSpent = bookings
    .filter(b => b.payment_status === 'paid' || b.status === 'completed')
    .reduce((sum, b) => sum + b.total_price, 0);
  const pendingPayments = bookings
    .filter(b => b.payment_status === 'pending' && b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.total_price, 0);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  async function handleMarkRead(id: string) {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  }

  async function handleMarkAllRead() {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'tani';
    if (mins < 60) return `${mins} min me pare`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ore me pare`;
    const days = Math.floor(hours / 24);
    return `${days} dite me pare`;
  }

  return (
    <DashboardLayout title="Paneli im" navItems={clientNavItems}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark-950">Pershendetje, {profile?.full_name?.split(' ')[0]}!</h1>
        <p className="text-dark-500 mt-1 text-[15px]">Menaxhoni rezervimet tuaja dhe eksploroni automjete te reja.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<FileText className="w-5 h-5 text-primary-600" />} bg="bg-primary-50" value={bookings.length} label="Totali rezervimeve" />
        <StatCard icon={<Car className="w-5 h-5 text-green-600" />} bg="bg-green-50" value={active} label="Aktive tani" />
        <StatCard icon={<Clock className="w-5 h-5 text-dark-500" />} bg="bg-gray-100" value={completed} label="Te perfunduara" />
        <StatCard icon={<DollarSign className="w-5 h-5 text-blue-600" />} bg="bg-blue-50" value={`${totalSpent.toFixed(0)} EUR`} label="Totali i shpenzuar" isAmount />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <Link to="/dashboard/pagesat" className="inline-flex items-center gap-1 text-xs font-semibold hover:underline">
              Shiko detajet <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <p className="text-3xl font-bold mb-1">{totalSpent.toFixed(2)} EUR</p>
          <p className="text-sm text-white/80">Totali i paguar</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold">Ne pritje</span>
          </div>
          <p className="text-3xl font-bold mb-1">{pendingPayments.toFixed(2)} EUR</p>
          <p className="text-sm text-white/80">Pagesa ne pritje</p>
        </div>
      </div>

      {notifications.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 mb-6">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-dark-500" />
              <h2 className="font-semibold text-dark-950">Njoftimet</h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
              >
                Sheno te gjitha si te lexuara
              </button>
            )}
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {notifications.slice(0, 8).map(n => (
              <div
                key={n.id}
                className={`px-5 py-3.5 flex items-start gap-3 transition-colors ${
                  !n.is_read ? 'bg-blue-50/40' : 'hover:bg-gray-50/50'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                  {notificationIcons[n.type] || <Info className="w-4 h-4 text-dark-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.is_read ? 'font-semibold text-dark-900' : 'font-medium text-dark-700'}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-dark-500 mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-dark-400 mt-1">{timeAgo(n.created_at)}</p>
                </div>
                {!n.is_read && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="p-1 text-dark-400 hover:text-dark-600 transition-colors shrink-0"
                    title="Sheno si te lexuar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-dark-950">Rezervimet e fundit</h2>
          <Link to="/automjetet" className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors">
            Kerko automjete <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <div className="w-7 h-7 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-16 text-center">
            <Car className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-dark-600 font-medium">Nuk keni asnje rezervim</p>
            <p className="text-sm text-dark-400 mt-1 mb-5">Kerkoni automjete per te bere rezervimin e pare.</p>
            <Link to="/automjetet" className="inline-flex px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors">
              Shfleto automjetet
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {bookings.map(b => {
              const s = statusLabels[b.status] || statusLabels.pending;
              return (
                <div key={b.id} className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                        {b.vehicle?.main_image_url ? (
                          <img src={b.vehicle.main_image_url} alt="" className="w-12 h-12 object-cover" />
                        ) : (
                          <Car className="w-5 h-5 text-dark-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-dark-900 text-sm">
                          {b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model}` : 'Automjet'}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1 text-[11px] text-dark-500">
                            <CalendarDays className="w-3 h-3" />
                            {new Date(b.pickup_date).toLocaleDateString('sq-AL')} - {new Date(b.return_date).toLocaleDateString('sq-AL')}
                          </span>
                          {b.pickup_location && (
                            <span className="flex items-center gap-1 text-[11px] text-dark-500">
                              <MapPin className="w-3 h-3" />
                              {b.pickup_location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-dark-900">{b.total_price} EUR</span>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${s.color}`}>{s.label}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, bg, value, label, isAmount }: { icon: React.ReactNode; bg: string; value: number | string; label: string; isAmount?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>{icon}</div>
        <div>
          <p className={`${isAmount ? 'text-xl' : 'text-2xl'} font-bold text-dark-950`}>{value}</p>
          <p className="text-xs text-dark-500">{label}</p>
        </div>
      </div>
    </div>
  );
}
