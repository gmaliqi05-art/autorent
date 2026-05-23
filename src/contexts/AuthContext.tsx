import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/types';
import type { User, Session } from '@supabase/supabase-js';
import { sendWelcomeClientEmail, sendWelcomeCompanyEmail } from '../lib/emailService';
import { changeLanguage, SUPPORTED_LANGUAGES, type SupportedLanguage } from '../i18n';

interface CompanySignUpData {
  email: string;
  password: string;
  fullName: string;
  companyName: string;
  phone: string;
  city: string;
  country: string;
  cityId?: string;
  countryId?: string;
  subscriptionPlanId?: string;
  billingCycle?: 'monthly' | 'yearly';
  captchaToken?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  profileLoading: boolean;
  signUp: (email: string, password: string, fullName: string, countryId?: string, cityId?: string, captchaToken?: string) => Promise<{ error: string | null }>;
  signUpCompany: (data: CompanySignUpData) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string, captchaToken?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // Ndjek user-in aktual te tilte sa lloji i fetchProfile nuk shkruan
  // mbi state nese eshte vjeter (race-condition mbrojtje gjate sign-out/sign-in te shpejtë).
  const activeUserIdRef = useRef<string | null>(null);

  async function fetchProfile(userId: string) {
    activeUserIdRef.current = userId;
    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // Nese ne kohen e fetch-it user-i ka ndryshuar, hidh poshte
      if (activeUserIdRef.current !== userId) return;

      if (error) {
        console.warn('[auth] fetchProfile error:', error.message);
        setProfile(null);
        return;
      }

      setProfile(data ?? null);
      const preferred = (data as { preferred_language?: string } | null)?.preferred_language;
      if (preferred && (SUPPORTED_LANGUAGES as readonly string[]).includes(preferred)) {
        changeLanguage(preferred as SupportedLanguage);
      }
    } finally {
      if (activeUserIdRef.current === userId) {
        setProfileLoading(false);
      }
    }
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        await fetchProfile(s.user.id);
      } else {
        activeUserIdRef.current = null;
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        void fetchProfile(s.user.id);
      } else {
        activeUserIdRef.current = null;
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signUp(
    email: string,
    password: string,
    fullName: string,
    countryId?: string,
    cityId?: string,
    captchaToken?: string,
  ) {
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        ...(captchaToken && captchaToken !== 'dev-mode' ? { captchaToken } : {}),
      },
    });
    if (error) return { error: error.message };

    if (authData.user && (countryId || cityId)) {
      // Perdor RPC-n e sigurte ne vend te update direkt te profiles
      try {
        await supabase.rpc('update_own_profile', {
          p_country_id: countryId ?? null,
          p_city_id: cityId ?? null,
        });
      } catch (rpcErr) {
        console.warn('[auth] update_own_profile failed (handle_new_user trigger may not have run yet):', rpcErr);
      }
    }

    if (authData.user) {
      try {
        await sendWelcomeClientEmail(email, fullName, authData.user.id);
      } catch (emailErr) {
        console.warn('[auth] welcome email failed:', emailErr);
      }
    }

    return { error: null };
  }

  async function signUpCompany(data: CompanySignUpData) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.fullName },
        ...(data.captchaToken && data.captchaToken !== 'dev-mode' ? { captchaToken: data.captchaToken } : {}),
      },
    });
    if (authError) return { error: authError.message };
    if (!authData.user) return { error: 'Regjistrimi deshtoi.' };

    const { data: companyData, error: rpcError } = await supabase.rpc('create_company_for_current_user', {
      p_name: data.companyName,
      p_phone: data.phone,
      p_email: data.email,
      p_city: data.city,
      p_country: data.country,
      p_city_id: data.cityId ?? null,
      p_country_id: data.countryId ?? null,
      p_subscription_plan_id: data.subscriptionPlanId ?? null,
      p_billing_cycle: data.billingCycle || 'monthly',
    });

    if (rpcError) return { error: rpcError.message };

    if (companyData) {
      try {
        await sendWelcomeCompanyEmail(
          data.email,
          data.companyName,
          (companyData as { id: string }).id,
        );
      } catch (emailErr) {
        console.warn('[auth] welcome company email failed:', emailErr);
      }
    }

    await fetchProfile(authData.user.id);
    return { error: null };
  }

  async function signIn(email: string, password: string, captchaToken?: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      ...(captchaToken && captchaToken !== 'dev-mode' ? { options: { captchaToken } } : {}),
    });
    if (error) return { error: error.message };
    return { error: null };
  }

  async function signOut() {
    activeUserIdRef.current = null;
    await supabase.auth.signOut();
    setProfile(null);
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.id);
  }

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, profileLoading, signUp, signUpCompany, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth duhet te perdoret brenda AuthProvider');
  return context;
}
