import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Cookie, X } from 'lucide-react';

const STORAGE_KEY = 'rentakar_cookie_consent';

export default function CookieConsent() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        const timer = setTimeout(() => setVisible(true), 600);
        return () => clearTimeout(timer);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  function persist(value: 'accepted' | 'declined') {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:bottom-6 sm:max-w-md z-[70] animate-slide-up">
      <div className="bg-white border border-gray-200 shadow-2xl rounded-2xl p-5 flex gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
          <Cookie className="w-5 h-5 text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="font-semibold text-dark-950 text-sm">
              {t('cookies.title', 'Perdorim cookies')}
            </h3>
            <button
              onClick={() => persist('declined')}
              className="text-dark-400 hover:text-dark-700 transition-colors shrink-0"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-dark-600 leading-relaxed mb-4">
            {t(
              'cookies.message',
              'Ne perdorim cookies per te permiresuar pervojen tuaj. Duke vazhduar shfletimin pranoni'
            )}{' '}
            <Link to="/politika-cookie" className="text-primary-600 font-medium hover:underline">
              {t('cookies.policyLink', 'Politiken e Cookies')}
            </Link>
            .
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => persist('accepted')}
              className="flex-1 px-4 py-2 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition-colors"
            >
              {t('cookies.accept', 'Pranoj')}
            </button>
            <button
              onClick={() => persist('declined')}
              className="px-4 py-2 bg-gray-100 text-dark-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('cookies.decline', 'Refuzoj')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
