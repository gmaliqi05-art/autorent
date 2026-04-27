import { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { changeLanguage, SUPPORTED_LANGUAGES, LANGUAGE_LABELS, type SupportedLanguage } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Props {
  variant?: 'navbar' | 'navbar-dark' | 'compact';
}

export default function LanguageSwitcher({ variant = 'navbar' }: Props) {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = (i18n.resolvedLanguage || i18n.language || 'sq') as SupportedLanguage;
  const safeCurrent: SupportedLanguage = (SUPPORTED_LANGUAGES as readonly string[]).includes(current) ? current : 'sq';

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function select(lang: SupportedLanguage) {
    changeLanguage(lang);
    setOpen(false);
    if (user) {
      await supabase.from('profiles').update({ preferred_language: lang }).eq('id', user.id);
    }
  }

  const triggerClass =
    variant === 'navbar-dark'
      ? 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white/90 hover:bg-white/10 hover:text-white transition-colors text-sm font-medium'
      : variant === 'compact'
      ? 'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm font-medium'
      : 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm font-medium';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={triggerClass}
        aria-label="Change language"
        aria-expanded={open}
      >
        <Globe className="w-4 h-4" />
        <span className="uppercase">{safeCurrent}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl ring-1 ring-gray-200 py-1.5 z-50">
          {SUPPORTED_LANGUAGES.map(lang => {
            const meta = LANGUAGE_LABELS[lang];
            const isActive = lang === safeCurrent;
            return (
              <button
                key={lang}
                type="button"
                onClick={() => select(lang)}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2 text-sm transition-colors ${
                  isActive ? 'text-primary-700 bg-primary-50' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-xs font-bold w-7 text-center bg-gray-100 rounded px-1 py-0.5 text-gray-600">
                    {meta.flag}
                  </span>
                  <span className="font-medium">{meta.native}</span>
                </span>
                {isActive && <Check className="w-4 h-4 text-primary-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
