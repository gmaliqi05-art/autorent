import { Link } from 'react-router-dom';
import { Car, Home, Search, ArrowRight, Compass } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-gray-50 via-white to-primary-50/40 flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Glow orbs dekorative ne sfond */}
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute top-1/4 -left-32 w-80 h-80 bg-primary-200 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-200 rounded-full blur-[160px]" />
      </div>

      <div className="relative text-center max-w-lg">
        {/* Ikon e madhe me ring animation subtle */}
        <div className="relative inline-flex items-center justify-center mb-8">
          <div className="absolute inset-0 rounded-3xl bg-primary-200/50 blur-2xl animate-pulse" />
          <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500 to-purple-600 shadow-xl shadow-primary-600/20 flex items-center justify-center">
            <Compass className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* 404 me gradient text */}
        <h1 className="text-7xl sm:text-9xl font-extrabold tracking-tight leading-none bg-gradient-to-br from-dark-950 via-dark-800 to-primary-700 bg-clip-text text-transparent">
          404
        </h1>

        <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-dark-950">{t('notFound.title')}</h2>

        <p className="mt-3 text-dark-500 text-base leading-relaxed max-w-md mx-auto">
          {t('notFound.desc')}
        </p>

        {/* CTAs primary + secondary */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 active:scale-[0.98] transition-all shadow-sm shadow-primary-600/20 text-sm"
          >
            <Home className="w-4 h-4" />
            {t('notFound.backHome')}
          </Link>
          <Link
            to="/automjetet"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-dark-700 font-semibold rounded-xl hover:bg-gray-100 hover:border-gray-300 active:scale-[0.98] transition-all text-sm"
          >
            <Search className="w-4 h-4" />
            {t('notFound.browseVehicles')}
          </Link>
        </div>

        {/* Quick links — ndihmoji userin te gjeje faqen e duhur */}
        <div className="mt-12 pt-8 border-t border-gray-200/60">
          <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-4">
            {t('notFound.popularLinks', 'Ose vizito')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
            <QuickLink to="/automjetet" label={t('nav.vehicles')} />
            <QuickLink to="/per-platformen" label={t('nav.about')} />
            <QuickLink to="/regjistrohu" label={t('notFound.signUp', 'Regjistrohu')} />
            <QuickLink to="/kycu" label={t('notFound.signIn', 'Kycu')} />
          </div>
        </div>
      </div>

      {/* Logo poshte fundit per branding */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 text-dark-400 text-xs">
        <Car className="w-3.5 h-3.5" />
        <span>RentaKar</span>
      </div>
    </div>
  );
}

function QuickLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium transition-colors group"
    >
      {label}
      <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
    </Link>
  );
}
