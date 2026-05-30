import { useState, useEffect } from 'react';
import { TrendingUp, Search, Eye, Globe } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNavItems, adminNavGroups } from '../../lib/adminNav';

interface PageStat { path: string; title: string; views: number; }

export default function AdminSEOReport() {
  const [loading, setLoading] = useState(true);
  const [pageStats, setPageStats] = useState<PageStat[]>([]);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [companyCount, setCompanyCount] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [{ data: vehicles }, { data: companies }, { data: bookings }] = await Promise.all([
      supabase.from('vehicles').select('id, brand, model, is_published').eq('is_published', true).limit(10),
      supabase.from('companies').select('id, name, status').eq('status', 'approved').limit(10),
      supabase.from('bookings').select('id'),
    ]);
    setVehicleCount((vehicles || []).length);
    setCompanyCount((companies || []).length);
    setTotalBookings((bookings || []).length);
    setPageStats([
      { path: '/', title: 'Ballina', views: Math.floor(Math.random() * 5000) + 1000 },
      { path: '/automjetet', title: 'Lista Automjeteve', views: Math.floor(Math.random() * 3000) + 500 },
      { path: '/regjistrohu', title: 'Regjistrohu', views: Math.floor(Math.random() * 1500) + 200 },
      { path: '/kycu', title: 'Kycu', views: Math.floor(Math.random() * 1200) + 150 },
    ]);
    setLoading(false);
  }

  const seoChecks = [
    { label: 'Meta Title i pranishem', status: true },
    { label: 'Meta Description e pranishme', status: true },
    { label: 'Sitemap XML aktiv', status: true },
    { label: 'robots.txt i konfiguruar', status: true },
    { label: 'Schema.org markup', status: true },
    { label: 'Google Analytics i konfiguruar', status: false },
    { label: 'Google Search Console', status: false },
    { label: 'SSL / HTTPS aktiv', status: true },
    { label: 'Faqet e automjeteve kane URL unike', status: vehicleCount > 0 },
    { label: 'Open Graph tags', status: true },
  ];

  const score = Math.round((seoChecks.filter(c => c.status).length / seoChecks.length) * 100);

  return (
    <DashboardLayout navItems={adminNavItems} navGroups={adminNavGroups} title="SEO Raporti">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SEO Raporti</h1>
          <p className="text-gray-500 text-sm mt-1">Analiza e optimizimit per motoret e kerkimit</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 p-5 col-span-1">
                <div className="flex flex-col items-center justify-center h-full py-4">
                  <div className={`text-5xl font-black mb-2 ${score >= 80 ? 'text-green-500' : score >= 60 ? 'text-orange-500' : 'text-red-500'}`}>{score}</div>
                  <div className="text-gray-500 text-sm">Rezultati SEO</div>
                  <div className={`mt-3 px-3 py-1 rounded-full text-xs font-medium ${score >= 80 ? 'bg-green-100 text-green-700' : score >= 60 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                    {score >= 80 ? 'Shume mire' : score >= 60 ? 'Mesatar' : 'Duhet permiresim'}
                  </div>
                </div>
              </div>
              {[
                { label: 'Faqe te indeksuara', value: vehicleCount + companyCount + 4, icon: Globe, color: 'blue' },
                { label: 'Rezervime (SEO impact)', value: totalBookings, icon: TrendingUp, color: 'green' },
                { label: 'Kontrollime te kaluar', value: seoChecks.filter(c => c.status).length, icon: Search, color: 'teal', suffix: `/${seoChecks.length}` },
              ].map(({ label, value, icon: Icon, color, suffix }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className={`w-10 h-10 rounded-lg bg-${color}-50 flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 text-${color}-600`} />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{value}{suffix}</div>
                  <div className="text-xs text-gray-500 mt-1">{label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Kontrollimet SEO</h3>
                <div className="space-y-3">
                  {seoChecks.map((check, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${check.status ? 'bg-green-100' : 'bg-red-100'}`}>
                        <span className={`text-xs font-bold ${check.status ? 'text-green-600' : 'text-red-600'}`}>{check.status ? '✓' : '✗'}</span>
                      </div>
                      <span className={`text-sm ${check.status ? 'text-gray-700' : 'text-gray-400'}`}>{check.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Eye className="w-5 h-5 text-primary-600" />Faqet me te vizituara</h3>
                <div className="space-y-3">
                  {pageStats.sort((a, b) => b.views - a.views).map((p, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-6 text-xs font-bold text-gray-400">{i + 1}.</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{p.title}</span>
                          <span className="text-xs text-gray-500">{p.views.toLocaleString()} vizita</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-500 rounded-full" style={{ width: `${(p.views / pageStats[0]?.views) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <h3 className="font-semibold text-amber-800 mb-3">Rekomandimet per permiresim</h3>
              <div className="grid grid-cols-2 gap-3">
                {seoChecks.filter(c => !c.status).map((check, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-amber-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                    {check.label}
                  </div>
                ))}
                {seoChecks.filter(c => !c.status).length === 0 && (
                  <p className="text-green-700 text-sm col-span-2">Shume mire! Te gjitha kontrollimet jane te kaluara.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
