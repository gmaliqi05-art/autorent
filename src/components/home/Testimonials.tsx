import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Arta Morina',
    city: 'Prishtine',
    role: 'Udhetare e shpeshte',
    rating: 5,
    text: 'Sherbim te jashtezakonshem! Automjeti ishte i ri, i paster dhe procesi i rezervimit ishte shume i lehte. E rekomandoj per te gjithe.',
    avatar: 'A',
    color: 'bg-primary-100 text-primary-700',
  },
  {
    name: 'Besnik Krasniqi',
    city: 'Tirane',
    role: 'Biznesmen',
    rating: 5,
    text: 'Cmimet me te mira qe kam gjetur ne rajon. Kompania ishte profesionale dhe automjeti ishte ekzaktesisht si ne foto. Do ta perdor perseri.',
    avatar: 'B',
    color: 'bg-accent-100 text-accent-700',
  },
  {
    name: 'Drita Hoxha',
    city: 'Shkup',
    role: 'Turiste',
    rating: 5,
    text: 'Rezervova online nga shtepija dhe mora automjetin per vetem 10 minuta. Eksperience shkelqyese nga fillimi deri ne fund.',
    avatar: 'D',
    color: 'bg-green-100 text-green-700',
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 bg-gray-50/50 relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary-50/40 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <p className="text-primary-600 font-semibold text-sm tracking-wide uppercase mb-2">Deshmi</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-dark-950 leading-tight mb-4">
            Cfare thone klientet tane
          </h2>
          <p className="text-dark-500 leading-relaxed">
            Mijera kliente na besojne cdo dite per udhetimet e tyre.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-7 border border-gray-100 hover:shadow-lg hover:shadow-dark-950/5 transition-all duration-300 relative"
            >
              <div className="absolute top-6 right-6">
                <Quote className="w-8 h-8 text-primary-100" />
              </div>

              <div className="flex items-center gap-1 mb-5">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-accent-500 fill-accent-500" />
                ))}
              </div>

              <p className="text-dark-700 text-[15px] leading-relaxed mb-7">{t.text}</p>

              <div className="flex items-center gap-3 pt-5 border-t border-gray-50">
                <div className={'w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm ' + t.color}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark-900">{t.name}</p>
                  <p className="text-xs text-dark-400">{t.role} -- {t.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
