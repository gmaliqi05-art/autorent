import { useState } from 'react';
import { Bell, Send, CheckCircle, Loader2, AlertTriangle, Info, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNavItems, adminNavGroups } from '../../lib/adminNav';

const testNotifications = [
  { type: 'info', title: 'Test Info Njoftimi', message: 'Ky eshte nje njoftim informativ i testuar nga sistemi.', icon: Info, color: 'blue' },
  { type: 'success', title: 'Test Sukses Njoftimi', message: 'Operacioni u krye me sukses! Ky eshte nje njoftim sukses.', icon: CheckCircle, color: 'green' },
  { type: 'warning', title: 'Test Paralajmerimi', message: 'Kini kujdes! Ky eshte nje njoftim paralajmerues test.', icon: AlertTriangle, color: 'orange' },
  { type: 'booking', title: 'Rezervim i ri test', message: 'Keni nje rezervim te ri nga Ana Koci per makinan BMW X5.', icon: Zap, color: 'teal' },
  { type: 'payment', title: 'Pagese e pranuar test', message: 'Pagesa prej €150 u pranua me sukses per rezervimin #12345.', icon: CheckCircle, color: 'green' },
];

export default function AdminTestNotification() {
  const { profile } = useAuth();
  const [sending, setSending] = useState<string | null>(null);
  const [results, setResults] = useState<{ type: string; success: boolean; time: string }[]>([]);
  const [customTitle, setCustomTitle] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [sendingCustom, setSendingCustom] = useState(false);

  async function sendTest(type: string, title: string, message: string) {
    if (!profile?.id) return;
    setSending(type);
    const { error } = await supabase.from('notifications').insert({
      user_id: profile.id, title, message, type,
    });
    setSending(null);
    setResults(r => [{ type, success: !error, time: new Date().toLocaleTimeString() }, ...r.slice(0, 9)]);
  }

  async function sendCustom() {
    if (!customTitle || !customMessage || !profile?.id) return;
    setSendingCustom(true);
    const { error } = await supabase.from('notifications').insert({
      user_id: profile.id, title: customTitle, message: customMessage, type: 'info',
    });
    setSendingCustom(false);
    setResults(r => [{ type: 'custom', success: !error, time: new Date().toLocaleTimeString() }, ...r.slice(0, 9)]);
    setCustomTitle('');
    setCustomMessage('');
  }

  return (
    <DashboardLayout navItems={adminNavItems} navGroups={adminNavGroups} title="Test Njoftimet">
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Test Njoftimet</h1>
          <p className="text-gray-500 text-sm mt-1">Testoni sistemin e njoftimeve duke derguar njoftime tek llogaria juaj</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">Njoftime te testimit</p>
            <p className="text-xs text-blue-600 mt-0.5">Te gjitha njoftime do dergohen tek llogaria juaj: <strong>{profile?.email}</strong></p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {testNotifications.map(n => {
            const Icon = n.icon;
            const isSending = sending === n.type;
            return (
              <div key={n.type} className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-${n.color}-50 flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 text-${n.color}-600`} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{n.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</div>
                  </div>
                </div>
                <button onClick={() => sendTest(n.type, n.title, n.message)} disabled={isSending}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors
                    bg-${n.color}-600 hover:bg-${n.color}-700 text-white disabled:opacity-50`}
                  style={{ backgroundColor: isSending ? undefined : undefined }}>
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isSending ? 'Duke derguar...' : 'Dergo test'}
                </button>
              </div>
            );
          })}

          <div className="bg-white rounded-xl border border-gray-100 p-5 col-span-2">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-primary-600" />Njoftim Custom</h3>
            <div className="space-y-3">
              <input value={customTitle} onChange={e => setCustomTitle(e.target.value)}
                placeholder="Titulli i njoftimit custom..." className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <textarea value={customMessage} onChange={e => setCustomMessage(e.target.value)}
                rows={2} placeholder="Mesazhi custom..." className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <button onClick={sendCustom} disabled={sendingCustom || !customTitle || !customMessage}
                className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
                {sendingCustom ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sendingCustom ? 'Duke derguar...' : 'Dergo Custom'}
              </button>
            </div>
          </div>
        </div>

        {results.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Rezultatet e testimit</h3>
            <div className="space-y-2">
              {results.map((r, i) => (
                <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg ${r.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  {r.success ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  <span className="text-sm font-medium capitalize">{r.type}</span>
                  <span className="text-sm">{r.success ? '— U dergua me sukses' : '— Deshtoi'}</span>
                  <span className="ml-auto text-xs opacity-70">{r.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
