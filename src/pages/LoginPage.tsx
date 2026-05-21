import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Eye, EyeOff, Loader2, Shield, Building2, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import TurnstileWidget from '../components/auth/TurnstileWidget';

export default function LoginPage() {
  const { signIn, user, profile } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');

  useEffect(() => {
    if (user && profile) {
      const path = profile.role === 'super_admin' ? '/admin' : profile.role === 'company_admin' ? '/kompania' : '/dashboard';
      navigate(path, { replace: true });
    }
  }, [user, profile, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!captchaToken) {
      setError(t('auth.captchaRequired') || 'Plotesoni verifikimin CAPTCHA');
      return;
    }
    setError('');
    setLoading(true);
    const result = await signIn(email, password, captchaToken);
    if (result.error) {
      setError(t('auth.loginError'));
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src="https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop"
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
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">{t('auth.welcomeBack')}<br />{t('auth.welcomeAgain')}</h2>
            <p className="text-white/60 text-lg leading-relaxed max-w-md">
              {t('auth.welcomeDesc')}
            </p>
          </div>
          <p className="text-white/30 text-sm">&copy; {new Date().getFullYear()} RentaKar</p>
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

          <h1 className="text-2xl font-bold text-dark-950 mb-1.5">{t('auth.loginPageTitle')}</h1>
          <p className="text-dark-500 mb-8 text-[15px]">{t('auth.loginPageSubtitle')}</p>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">{t('auth.email')}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-dark-900 placeholder:text-dark-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                placeholder={t('auth.emailPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">{t('auth.password')}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-dark-900 placeholder:text-dark-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all pr-11"
                  placeholder={t('auth.passwordPlaceholder')}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-primary-600 font-medium hover:text-primary-700 transition-colors">
                {t('auth.forgotPassword')}
              </Link>
            </div>

            <TurnstileWidget
              onVerify={setCaptchaToken}
              onExpire={() => setCaptchaToken('')}
              onError={() => setCaptchaToken('')}
              action="login"
            />

            <button
              type="submit"
              disabled={loading || !captchaToken}
              className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm shadow-primary-600/20 active:scale-[0.98]"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? t('auth.loggingIn') : t('auth.loginButton')}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-dark-500">
            {t('auth.noAccount')}{' '}
            <Link to="/regjistrohu" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">{t('auth.registerButton')}</Link>
          </p>

          {/*
            🔒 DEMO ACCOUNTS — fshihen automatikisht ne production build.
            Per t'i shfaqur edhe ne production, vendos VITE_SHOW_DEMO_ACCOUNTS=true ne .env.
            Para lansimit publik, fshini krejt kete bllok ose mbani te fshehur me default.
          */}
          {(import.meta.env.DEV || import.meta.env.VITE_SHOW_DEMO_ACCOUNTS === 'true') && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-1 text-center">{t('auth.demoAccounts')}</p>
              <p className="text-[10px] text-center text-dark-300 mb-3">(vetëm dev mode — fshihet automatikisht në production)</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: t('auth.admin'), email: 'admin@rentacar.com', password: 'Admin123!', icon: Shield, color: 'text-red-600', bg: 'bg-red-50 hover:bg-red-100 border-red-100' },
                  { label: t('auth.company'), email: 'company@rentacar.com', password: 'Company123!', icon: Building2, color: 'text-amber-600', bg: 'bg-amber-50 hover:bg-amber-100 border-amber-100' },
                  { label: t('auth.client'), email: 'client@rentacar.com', password: 'Client123!', icon: User, color: 'text-primary-600', bg: 'bg-primary-50 hover:bg-primary-100 border-primary-100' },
                ].map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => { setEmail(acc.email); setPassword(acc.password); }}
                    className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border transition-all cursor-pointer ${acc.bg}`}
                  >
                    <acc.icon className={`w-5 h-5 ${acc.color}`} />
                    <span className={`text-xs font-semibold ${acc.color}`}>{acc.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
