import { Link } from 'react-router-dom';
import { Car } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 mb-8">
          <Car className="w-8 h-8 text-primary-600" />
        </div>

        <h1 className="text-8xl font-extrabold text-dark-950 tracking-tight">404</h1>

        <h2 className="mt-4 text-2xl font-bold text-dark-950">Faqja nuk u gjet</h2>

        <p className="mt-3 text-dark-500 text-[15px] leading-relaxed">
          Faqja qe po kerkoni nuk ekziston ose eshte zhvendosur.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 active:scale-[0.98] transition-all shadow-sm shadow-primary-600/20 text-sm"
          >
            Kthehu ne Ballina
          </Link>
          <Link
            to="/automjetet"
            className="w-full sm:w-auto px-6 py-3 bg-white border border-gray-200 text-dark-700 font-semibold rounded-xl hover:bg-gray-100 active:scale-[0.98] transition-all text-sm"
          >
            Shfleto automjetet
          </Link>
        </div>
      </div>
    </div>
  );
}
