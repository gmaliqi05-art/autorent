import { Search, Calendar, Shield, Car, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function HowItWorks() {
  const { t } = useTranslation();

  const steps = [
    {
      icon: Search,
      title: t('home.hiwStep1Title'),
      desc: t('home.hiwStep1Desc'),
      color: 'bg-primary-50 text-primary-600',
      accent: 'from-primary-600/5 to-transparent',
    },
    {
      icon: Calendar,
      title: t('home.hiwStep2Title'),
      desc: t('home.hiwStep2Desc'),
      color: 'bg-accent-50 text-accent-600',
      accent: 'from-accent-500/5 to-transparent',
    },
    {
      icon: Shield,
      title: t('home.hiwStep3Title'),
      desc: t('home.hiwStep3Desc'),
      color: 'bg-green-50 text-green-600',
      accent: 'from-green-500/5 to-transparent',
    },
    {
      icon: Car,
      title: t('home.hiwStep4Title'),
      desc: t('home.hiwStep4Desc'),
      color: 'bg-dark-50 text-dark-700',
      accent: 'from-dark-500/5 to-transparent',
    },
  ];

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-50/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <p className="text-primary-600 font-semibold text-sm tracking-wide uppercase mb-2">{t('home.hiwBadge')}</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-dark-950 leading-tight mb-4">
            {t('home.hiwTitle')}
          </h2>
          <p className="text-dark-500 leading-relaxed">
            {t('home.hiwDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative group">
              <div className={'rounded-2xl p-7 border border-gray-100 hover:border-gray-200 transition-all hover:shadow-lg hover:shadow-dark-950/5 bg-gradient-to-b ' + step.accent + ' to-white'}>
                <div className="flex items-center justify-between mb-6">
                  <div className={'w-12 h-12 rounded-xl flex items-center justify-center ' + step.color}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <span className="text-4xl font-black text-dark-100 group-hover:text-dark-200 transition-colors">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-dark-900 mb-2">{step.title}</h3>
                <p className="text-sm text-dark-500 leading-relaxed">{step.desc}</p>
              </div>

              {i < steps.length - 1 && (
                <div className="hidden lg:flex absolute top-1/2 -right-4 z-10 -translate-y-1/2">
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                    <ArrowRight className="w-3.5 h-3.5 text-dark-400" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-14">
          <Link
            to="/automjetet"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-dark-950 text-white font-semibold rounded-xl hover:bg-dark-900 active:scale-[0.98] transition-all"
          >
            {t('home.hiwStartNow')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
