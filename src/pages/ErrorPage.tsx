import { Link } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ErrorPageProps {
  /** Statusi HTTP per shfaqje (default: 500) */
  statusCode?: number;
  /** Mesazh shtese opsional per debug */
  message?: string;
}

export default function ErrorPage({ statusCode = 500, message }: ErrorPageProps) {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-100 mb-8">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>

        <h1 className="text-8xl font-extrabold text-dark-950 tracking-tight">{statusCode}</h1>

        <h2 className="mt-4 text-2xl font-bold text-dark-950">
          {t('errorPage.title', 'Dicka shkoi keq')}
        </h2>

        <p className="mt-3 text-dark-500 text-[15px] leading-relaxed">
          {t('errorPage.desc', 'Ndodhi nje gabim i papritur ne server. Ekipi yne u njoftua automatikisht — provo perseri pas pak.')}
        </p>

        {message && (
          <p className="mt-3 text-xs text-dark-400 font-mono bg-gray-100 px-3 py-2 rounded-lg break-words">
            {message}
          </p>
        )}

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 active:scale-[0.98] transition-all shadow-sm shadow-primary-600/20 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            {t('errorPage.retry', 'Rifresko faqen')}
          </button>
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-dark-700 font-semibold rounded-xl hover:bg-gray-100 active:scale-[0.98] transition-all text-sm"
          >
            <Home className="w-4 h-4" />
            {t('errorPage.backHome', 'Kthehu ne ballina')}
          </Link>
        </div>
      </div>
    </div>
  );
}
