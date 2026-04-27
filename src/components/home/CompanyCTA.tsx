import { Link } from 'react-router-dom';
import { ArrowRight, Building2, BarChart3, Globe, Headphones } from 'lucide-react';

const benefits = [
  { icon: Globe, text: 'Arrini mijera kliente te rinj' },
  { icon: BarChart3, text: 'Menaxhoni floten dixhitalisht' },
  { icon: Headphones, text: 'Mbeshtetje teknike 24/7' },
];

export default function CompanyCTA() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://images.pexels.com/photos/3184306/pexels-photo-3184306.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&fit=crop"
              alt="Business meeting"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-dark-950/85" />
          </div>

          <div className="absolute top-0 left-0 w-96 h-96 bg-primary-600/15 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-accent-500/10 rounded-full blur-[80px]" />

          <div className="relative px-8 py-16 sm:px-12 sm:py-20 lg:px-20 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-white/80 text-xs font-medium tracking-wide uppercase mb-8">
                  <Building2 className="w-3.5 h-3.5" />
                  Per kompanite e qirase
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                  Rritni biznesin tuaj
                  <br />
                  <span className="text-primary-400">me RentaKar</span>
                </h2>

                <p className="text-gray-300 leading-relaxed mb-10 max-w-lg text-lg">
                  Bashkohuni me platformen lider ne rajon dhe menaxhoni te gjithe operacionin tuaj te qirase nga nje vend i vetem.
                </p>

                <div className="space-y-4 mb-10">
                  {benefits.map((b, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-600/20 flex items-center justify-center">
                        <b.icon className="w-4 h-4 text-primary-400" />
                      </div>
                      <span className="text-white/90 font-medium">{b.text}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-4">
                  <Link
                    to="/regjistrohu?role=company"
                    className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-white text-dark-900 font-semibold rounded-xl hover:bg-gray-100 active:scale-[0.98] transition-all shadow-lg"
                  >
                    Regjistro kompanine
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/regjistrohu?role=company"
                    className="inline-flex items-center gap-2 px-7 py-3.5 glass text-white font-medium rounded-xl hover:bg-white/15 transition-colors"
                  >
                    Shiko planet
                  </Link>
                </div>
              </div>

              <div className="hidden lg:block">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="glass-dark rounded-2xl p-6">
                      <p className="text-4xl font-bold text-white mb-1">98%</p>
                      <p className="text-sm text-gray-400">Kenaqesi e klienteve</p>
                    </div>
                    <div className="glass-dark rounded-2xl p-6">
                      <p className="text-4xl font-bold text-white mb-1">3x</p>
                      <p className="text-sm text-gray-400">Rritje e rezervimeve</p>
                    </div>
                  </div>
                  <div className="space-y-4 mt-8">
                    <div className="glass-dark rounded-2xl p-6">
                      <p className="text-4xl font-bold text-white mb-1">24h</p>
                      <p className="text-sm text-gray-400">Konfirmim i shpejte</p>
                    </div>
                    <div className="glass-dark rounded-2xl p-6">
                      <p className="text-4xl font-bold text-white mb-1">0 EUR</p>
                      <p className="text-sm text-gray-400">Komisione fillestare</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
