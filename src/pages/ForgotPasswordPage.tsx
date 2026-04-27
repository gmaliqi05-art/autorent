import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Car, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch {
      setError('Dicka shkoi keq. Ju lutem provoni perseri.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src="https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop"
          alt="Luxury car"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-dark-950/90 via-dark-950/70 to-primary-950/60" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">RentaKar</span>
          </Link>
          <div>
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">Keni harruar<br />fjalekalimin?</h2>
            <p className="text-white/60 text-lg leading-relaxed max-w-md">
              Mos u shqetesoni, vendosni email-in tuaj dhe do t'ju dergojme nje link per ta rivendosur.
            </p>
          </div>
          <p className="text-white/30 text-sm">&copy; {new Date().getFullYear()} Booking Shpk</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 sm:px-10 py-12 bg-gray-50">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden mb-10">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary-600">
                <Car className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-dark-950">RentaKar</span>
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-dark-950 mb-1.5">Rivendos fjalekalimin</h1>
          <p className="text-dark-500 mb-8 text-[15px]">Vendosni email-in tuaj per te marre linkun e rivendosjes</p>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">{error}</div>
          )}

          {success && (
            <div className="mb-4 px-4 py-3 bg-green-50 border border-green-100 rounded-xl text-sm text-green-700">
              Nese ky email ekziston, do te merrni nje link per te rivendosur fjalekalimin.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-dark-900 placeholder:text-dark-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                placeholder="email@shembull.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm shadow-primary-600/20 active:scale-[0.98]"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Duke derguar...' : 'Dergo linkun'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-dark-500">
            Kthehu tek{' '}
            <Link to="/kycu" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">Kycu</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
