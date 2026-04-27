import { Shield, Award, TrendingUp, Users } from 'lucide-react';

const stats = [
  { icon: TrendingUp, value: '500+', label: 'Automjete ne platforme' },
  { icon: Users, value: '10,000+', label: 'Kliente te kenaqur' },
  { icon: Shield, value: '50+', label: 'Kompani te verifikuara' },
  { icon: Award, value: '4.8/5', label: 'Vleresimi mesatar' },
];

export default function TrustBanner() {
  return (
    <section className="relative py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl shadow-dark-950/5 border border-gray-100/80 px-8 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {stats.map((stat, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                  <stat.icon className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-dark-950 tracking-tight">{stat.value}</p>
                  <p className="text-xs text-dark-500 font-medium">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
