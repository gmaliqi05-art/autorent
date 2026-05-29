import { Link } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCw, Car, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ErrorPageProps {
  /** Statusi HTTP per shfaqje (default: 500) */
  statusCode?: number;
  /** Mesazh shtese opsional per debug */
  message?: string;
}

export default function ErrorPage({ statusCode = 500, message }: ErrorPageProps) {
  const { t } = useTranslation();

  // 503 = service unavailable -> ngjyre amber; 500 dhe te tjera -> red
  const isMaintenance = statusCode === 503;
  const accentBg = isMaintenance ? 'from-amber-500 to-orange-600' : 'from-red-500 to-rose-600';
  const accentGlow = isMaintenance ? 'bg-amber-200/50' : 'bg-red-200/50';
  const titleKey = isMaintenance ? 'errorPage.maintenanceTitle' : 'errorPage.title';
  const descKey = isMaintenance ? 'errorPage.maintenanceDesc' : 'errorPage.desc';

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-gray-50 via-white to-red-50/30 flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Glow orbs dekorative */}
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className={`absolute top-1/4 -left-32 w-80 h-80 rounded-full blur-[140px] ${isMaintenance ? 'bg-amber-200' : 'bg-red-200'}`} />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-orange-200 rounded-full blur-[160px]" />
      </div>

      <div className="relative text-center max-w-lg">
        {/* Ikon e madhe me halo */}
        <div className="relative inline-flex items-center justify-center mb-8">
          <div className={`absolute inset-0 rounded-3xl blur-2xl animate-pulse ${accentGlow}`} />
          <div className={`relative w-20 h-20 rounded-3xl bg-gradient-to-br ${accentBg} shadow-xl flex items-center justify-center`}>
            <AlertTriangle className="w-10 h-10 text-white" />
          </div>
        </div>

        <h1 className="text-7xl sm:text-9xl font-extrabold tracking-tight leading-none bg-gradient-to-br from-dark-950 via-dark-800 to-red-700 bg-clip-text text-transparent">
          {statusCode}
        </h1>

        <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-dark-950">
          {t(titleKey, isMaintenance ? 'Po bejme mirembajtje' : 'Dicka shkoi keq')}
        </h2>

        <p className="mt-3 text-dark-500 text-base leading-relaxed max-w-md mx-auto">
          {t(descKey, isMaintenance
            ? 'Po permiresojme platformen. Kthehu pas pak — kjo s\'duhet te zgjase me shume se disa minuta.'
            : 'Ndodhi nje gabim i papritur ne server. Ekipi yne u njoftua automatikisht — provo perseri pas pak.')}
        </p>

        {message && (
          <p className="mt-4 text-xs text-dark-400 font-mono bg-gray-100 border border-gray-200 px-3 py-2 rounded-lg break-words max-w-md mx-auto">
            {message}
          </p>
        )}

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 active:scale-[0.98] transition-all shadow-sm shadow-primary-600/20 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            {t('errorPage.retry', 'Rifresko faqen')}
          </button>
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-dark-700 font-semibold rounded-xl hover:bg-gray-100 hover:border-gray-300 active:scale-[0.98] transition-all text-sm"
          >
            <Home className="w-4 h-4" />
            {t('errorPage.backHome', 'Kthehu ne ballina')}
          </Link>
        </div>

        {/* Support contact si link i fundit */}
        <div className="mt-12 pt-8 border-t border-gray-200/60">
          <p className="text-xs text-dark-500">
            {t('errorPage.persistText', 'Vazhdon problemi?')}{' '}
            <a
              href="mailto:info@rentakar.com"
              className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-semibold transition-colors"
            >
              <Mail className="w-3 h-3" />
              info@rentakar.com
            </a>
          </p>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 text-dark-400 text-xs">
        <Car className="w-3.5 h-3.5" />
        <span>RentaKar</span>
      </div>
    </div>
  );
}
