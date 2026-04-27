import { Star, Quote } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Testimonials() {
  const { t } = useTranslation();

  const testimonials = [
    {
      name: t('home.tName1'),
      city: t('home.tCity1'),
      role: t('home.tRole1'),
      rating: 5,
      text: t('home.tText1'),
      avatar: 'A',
      color: 'bg-primary-100 text-primary-700',
    },
    {
      name: t('home.tName2'),
      city: t('home.tCity2'),
      role: t('home.tRole2'),
      rating: 5,
      text: t('home.tText2'),
      avatar: 'B',
      color: 'bg-accent-100 text-accent-700',
    },
    {
      name: t('home.tName3'),
      city: t('home.tCity3'),
      role: t('home.tRole3'),
      rating: 5,
      text: t('home.tText3'),
      avatar: 'D',
      color: 'bg-green-100 text-green-700',
    },
  ];

  return (
    <section className="py-24 bg-gray-50/50 relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary-50/40 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <p className="text-primary-600 font-semibold text-sm tracking-wide uppercase mb-2">{t('home.tBadge')}</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-dark-950 leading-tight mb-4">
            {t('home.tHeading')}
          </h2>
          <p className="text-dark-500 leading-relaxed">
            {t('home.tDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-7 border border-gray-100 hover:shadow-lg hover:shadow-dark-950/5 transition-all duration-300 relative"
            >
              <div className="absolute top-6 right-6">
                <Quote className="w-8 h-8 text-primary-100" />
              </div>

              <div className="flex items-center gap-1 mb-5">
                {Array.from({ length: item.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-accent-500 fill-accent-500" />
                ))}
              </div>

              <p className="text-dark-700 text-[15px] leading-relaxed mb-7">{item.text}</p>

              <div className="flex items-center gap-3 pt-5 border-t border-gray-50">
                <div className={'w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm ' + item.color}>
                  {item.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark-900">{item.name}</p>
                  <p className="text-xs text-dark-400">{item.role} -- {item.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
