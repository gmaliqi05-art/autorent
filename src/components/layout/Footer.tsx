import { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, MapPin, Phone, Mail, Eye, EyeOff, Loader2, X, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useHomepageSettings } from '../../lib/useHomepageSettings';

export default function Footer() {
  const { logo } = useHomepageSettings();
  const clickTimestamps = useRef<number[]>([]);
  const [showAdminModal, setShowAdminModal] = useState(false);

  const handleSecretClick = useCallback(() => {
    const now = Date.now();
    clickTimestamps.current = clickTimestamps.current.filter((t) => now - t < 2000);
    clickTimestamps.current.push(now);
    if (clickTimestamps.current.length >= 3) {
      clickTimestamps.current = [];
      setShowAdminModal(true);
    }
  }, []);

  return (
    <>
      <footer className="bg-dark-950 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            <div>
              <Link to="/" className="flex items-center gap-2.5 mb-4">
                {logo.logo_url ? (
                  <img src={logo.logo_url} alt={logo.site_name} className="h-8 w-auto object-contain" />
                ) : logo.show_icon !== false && (
                  <div className="p-2 rounded-lg bg-primary-600">
                    <Car className="w-5 h-5 text-white" />
                  </div>
                )}
                {logo.show_text !== false && (
                  <span className="text-xl font-bold text-white">{logo.site_name || 'RentaKar'}</span>
                )}
              </Link>
              <p className="text-sm leading-relaxed mb-2">
                <span className="text-white font-medium">RentaKar SH.P.K.</span>
              </p>
              <p className="text-sm leading-relaxed mb-1">NUI: 812373174</p>
              <p className="text-sm leading-relaxed">
                Platforma me e madhe per qirane te automjeteve ne Kosove, Shqiperi dhe Maqedoni te
                Veriut.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Lidhjet</h4>
              <ul className="space-y-2.5">
                <li>
                  <Link to="/automjetet" className="text-sm hover:text-white transition-colors">
                    Automjetet
                  </Link>
                </li>
                <li>
                  <Link to="/automjetet" className="text-sm hover:text-white transition-colors">
                    Kerko automjet
                  </Link>
                </li>
                <li>
                  <Link
                    to="/regjistrohu?role=company"
                    className="text-sm hover:text-white transition-colors"
                  >
                    Regjistro kompanine
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Dokumentet Ligjore</h4>
              <ul className="space-y-2.5">
                <li>
                  <Link to="/kushtet-perdorimit" className="text-sm hover:text-white transition-colors">
                    Kushtet e Perdorimit
                  </Link>
                </li>
                <li>
                  <Link to="/politika-privatesise" className="text-sm hover:text-white transition-colors">
                    Politika e Privatesise
                  </Link>
                </li>
                <li>
                  <Link to="/politika-cookie" className="text-sm hover:text-white transition-colors">
                    Politika e Cookie-ve
                  </Link>
                </li>
                <li>
                  <Link to="/te-drejtat-gdpr" className="text-sm hover:text-white transition-colors">
                    Te Drejtat GDPR
                  </Link>
                </li>
                <li>
                  <Link to="/njoftim-ligjor" className="text-sm hover:text-white transition-colors">
                    Njoftim Ligjor (Imprint)
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Kontakti</h4>
              <ul className="space-y-2.5">
                <li className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
                  Rr. Epopeja e Jezercit Nr. 402, Ferizaj 70000, Kosove
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-primary-400 shrink-0" />
                  +383 49 400 006
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-primary-400 shrink-0" />
                  info@rentakar.com
                </li>
              </ul>
            </div>
          </div>

          <hr className="border-gray-800 mt-12 mb-6" />

          <div className="text-center space-y-3">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              <Link to="/kushtet-perdorimit" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Kushtet e Perdorimit</Link>
              <span className="text-gray-700 text-xs">·</span>
              <Link to="/politika-privatesise" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Politika e Privatesise</Link>
              <span className="text-gray-700 text-xs">·</span>
              <Link to="/politika-cookie" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Cookie</Link>
              <span className="text-gray-700 text-xs">·</span>
              <Link to="/te-drejtat-gdpr" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Te Drejtat GDPR</Link>
              <span className="text-gray-700 text-xs">·</span>
              <Link to="/njoftim-ligjor" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Njoftim Ligjor</Link>
            </div>
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} RentaKar SH.P.K. &middot; NUI: 812373174 &middot; Te gjitha te drejtat e rezervuara.
            </p>
            <p className="text-xs text-gray-600">
              Mundesuar nga{' '}
              <span
                onClick={handleSecretClick}
                className="text-gray-400 font-medium cursor-default select-none"
              >
                MarGroup Germany
              </span>{' '}
              🇩🇪
            </p>
          </div>
        </div>
      </footer>

      {showAdminModal && <AdminLoginModal onClose={() => setShowAdminModal(false)} />}
    </>
  );
}

function AdminLoginModal({ onClose }: { onClose: () => void }) {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await signIn(email, password);
    if (result.error) {
      setError('Kredencialet nuk jane te sakta.');
      setLoading(false);
      return;
    }
    onClose();
    navigate('/admin', { replace: true });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[380px] overflow-hidden animate-scale-in">
        <div className="bg-dark-950 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/10">
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Hyrje Administrative</h3>
              <p className="text-gray-400 text-xs">Vetem per perdorim te brendshem</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-dark-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark-900 placeholder:text-dark-300 focus:ring-2 focus:ring-dark-500/20 focus:border-dark-500 transition-all"
                placeholder="admin@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-700 mb-1.5">Fjalekalimi</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark-900 placeholder:text-dark-300 focus:ring-2 focus:ring-dark-500/20 focus:border-dark-500 transition-all pr-10"
                  placeholder="Fjalekalimi"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-dark-950 text-white font-semibold rounded-lg text-sm hover:bg-dark-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {loading ? 'Duke u kyqur...' : 'Hyr'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
