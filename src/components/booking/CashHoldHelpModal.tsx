/**
 * 🔒 PROTECTED COMPONENT — DO NOT DELETE OR REVERT
 *
 * Modal informacionai per kompanite qe shpjegon si funksionon
 * sistemi i Cash Hold (Stripe Authorization).
 */
import { X, Shield, Unlock, AlertTriangle, Clock, CheckCircle2, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CashHoldHelpModal({ open, onClose }: Props) {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5 text-primary-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-dark-950">{t('cashHoldModal.title')}</h2>
              <p className="text-sm text-dark-500 mt-0.5">{t('cashHoldModal.subtitle')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg shrink-0">
            <X className="w-5 h-5 text-dark-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">

          {/* Çfarë është */}
          <section>
            <h3 className="font-semibold text-dark-900 mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary-600" />
              {t('cashHoldModal.whatIs')}
            </h3>
            <p className="text-sm text-dark-600 leading-relaxed">{t('cashHoldModal.whatIsDesc')}</p>
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-xs text-blue-800">💡 {t('cashHoldModal.hotelAnalogy')}</p>
            </div>
          </section>

          {/* Flow */}
          <section>
            <h3 className="font-semibold text-dark-900 mb-3">{t('cashHoldModal.stepsTitle')}</h3>
            <ol className="space-y-3">
              <li className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
                <div>
                  <p className="text-sm font-semibold text-dark-900">{t('cashHoldModal.step1Title')}</p>
                  <p className="text-xs text-dark-500 mt-0.5">{t('cashHoldModal.step1Desc')}</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
                <div>
                  <p className="text-sm font-semibold text-dark-900">{t('cashHoldModal.step2Title')}</p>
                  <p className="text-xs text-dark-500 mt-0.5">{t('cashHoldModal.step2Desc')}</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
                <div>
                  <p className="text-sm font-semibold text-dark-900">{t('cashHoldModal.step3Title')}</p>
                  <p className="text-xs text-dark-500 mt-0.5">{t('cashHoldModal.step3Desc')}</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center shrink-0">4a</span>
                <div>
                  <p className="text-sm font-semibold text-dark-900 flex items-center gap-1.5">
                    <Unlock className="w-3.5 h-3.5 text-green-600" />
                    {t('cashHoldModal.step4aTitle')}
                  </p>
                  <p className="text-xs text-dark-500 mt-0.5">{t('cashHoldModal.step4aDesc')}</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center shrink-0">4b</span>
                <div>
                  <p className="text-sm font-semibold text-dark-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    {t('cashHoldModal.step4bTitle')}
                  </p>
                  <p className="text-xs text-dark-500 mt-0.5">{t('cashHoldModal.step4bDesc')}</p>
                </div>
              </li>
            </ol>
          </section>

          {/* Kur duhet të bëj çfarë */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="font-semibold text-green-900 text-sm flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="w-4 h-4" />
                {t('cashHoldModal.releaseWhen')}
              </p>
              <ul className="text-xs text-green-800 space-y-1.5 ml-2">
                <li>✓ {t('cashHoldModal.releaseWhen1')}</li>
                <li>✓ {t('cashHoldModal.releaseWhen2')}</li>
                <li>✓ {t('cashHoldModal.releaseWhen3')}</li>
              </ul>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="font-semibold text-red-900 text-sm flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-4 h-4" />
                {t('cashHoldModal.captureWhen')}
              </p>
              <ul className="text-xs text-red-800 space-y-1.5 ml-2">
                <li>✗ {t('cashHoldModal.captureWhen1')}</li>
                <li>✗ {t('cashHoldModal.captureWhen2')}</li>
                <li>✗ {t('cashHoldModal.captureWhen3')}</li>
                <li>✗ {t('cashHoldModal.captureWhen4')}</li>
              </ul>
            </div>
          </section>

          {/* Limite + skadenca */}
          <section className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="font-semibold text-amber-900 text-sm flex items-center gap-1.5 mb-2">
              <Clock className="w-4 h-4" />
              {t('cashHoldModal.timingTitle')}
            </p>
            <ul className="text-xs text-amber-800 space-y-1.5 ml-2">
              <li>• {t('cashHoldModal.timing1')}</li>
              <li>• {t('cashHoldModal.timing2')}</li>
              <li>• {t('cashHoldModal.timing3')}</li>
              <li>• {t('cashHoldModal.timing4')}</li>
            </ul>
          </section>

          {/* FAQ shkurt */}
          <section>
            <h3 className="font-semibold text-dark-900 mb-3">{t('cashHoldModal.faqTitle')}</h3>
            <div className="space-y-3">
              <details className="bg-gray-50 rounded-xl">
                <summary className="cursor-pointer p-3 text-sm font-medium text-dark-900">{t('cashHoldModal.faq1Q')}</summary>
                <p className="px-3 pb-3 text-xs text-dark-600">{t('cashHoldModal.faq1A')}</p>
              </details>
              <details className="bg-gray-50 rounded-xl">
                <summary className="cursor-pointer p-3 text-sm font-medium text-dark-900">{t('cashHoldModal.faq2Q')}</summary>
                <p className="px-3 pb-3 text-xs text-dark-600">{t('cashHoldModal.faq2A')}</p>
              </details>
              <details className="bg-gray-50 rounded-xl">
                <summary className="cursor-pointer p-3 text-sm font-medium text-dark-900">{t('cashHoldModal.faq3Q')}</summary>
                <p className="px-3 pb-3 text-xs text-dark-600">{t('cashHoldModal.faq3A')}</p>
              </details>
              <details className="bg-gray-50 rounded-xl">
                <summary className="cursor-pointer p-3 text-sm font-medium text-dark-900">{t('cashHoldModal.faq4Q')}</summary>
                <p className="px-3 pb-3 text-xs text-dark-600">{t('cashHoldModal.faq4A')}</p>
              </details>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700">
            {t('common.understood')}
          </button>
        </div>
      </div>
    </div>
  );
}
