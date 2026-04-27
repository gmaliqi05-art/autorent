import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
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
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  profileLoading: boolean;
  signUp: (email: string, password: string, fullName: string, countryId?: string, cityId?: string) => Promise<{ error: string | null }>;
  signUpCompany: (data: CompanySignUpData) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
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

  async function fetchProfile(userId: string) {
    setProfileLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setProfile(data);
    if (data && (data as { preferred_language?: string }).preferred_language) {
      const lang = (data as { preferred_language: string }).preferred_language;
      if ((SUPPORTED_LANGUAGES as readonly string[]).includes(lang)) {
        changeLanguage(lang as SupportedLanguage);
      }
    }
    setProfileLoading(false);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        await fetchProfile(s.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        (async () => {
          await fetchProfile(s.user.id);
        })();
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signUp(email: string, password: string, fullName: string, countryId?: string, cityId?: string) {
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return { error: error.message };

    if (authData.user && (countryId || cityId)) {
      const updates: Record<string, unknown> = {};
      if (countryId) updates.country_id = countryId;
      if (cityId) updates.city_id = cityId;
      await supabase.from('profiles').update(updates).eq('id', authData.user.id);
    }

    if (authData.user) {
      await sendWelcomeClientEmail(
        email,
        fullName,
        authData.user.id
      );
    }

    return { error: null };
  }

  async function signUpCompany(data: CompanySignUpData) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { full_name: data.fullName } },
    });
    if (authError) return { error: authError.message };
    if (!authData.user) return { error: 'Regjistrimi deshtoi.' };

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'company_admin', phone: data.phone })
      .eq('id', authData.user.id);
    if (profileError) return { error: profileError.message };

    const slug = data.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const companyInsert: Record<string, unknown> = {
      owner_id: authData.user.id,
      name: data.companyName,
      slug: `${slug}-${Date.now()}`,
      phone: data.phone,
      email: data.email,
      city: data.city,
      country: data.country,
    };
    if (data.countryId) {
      companyInsert.country_id = data.countryId;
    }
    if (data.cityId) {
      companyInsert.city_id = data.cityId;
    }
    if (data.subscriptionPlanId) {
      const cycle = data.billingCycle || 'monthly';
      const now = new Date();
      const expiresAt = new Date(now);
      if (cycle === 'yearly') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }
      companyInsert.subscription_plan_id = data.subscriptionPlanId;
      companyInsert.subscription_status = 'active';
      companyInsert.subscription_billing_cycle = cycle;
      companyInsert.subscription_expires_at = expiresAt.toISOString();
      companyInsert.subscription_renewed_at = now.toISOString();
      companyInsert.subscription_auto_renew = true;
    }

    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .insert(companyInsert)
      .select()
      .single();
    if (companyError) return { error: companyError.message };

    if (companyData) {
      await sendWelcomeCompanyEmail(
        data.email,
        data.companyName,
        companyData.id
      );
    }

    await fetchProfile(authData.user.id);
    return { error: null };
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }

  async function signOut() {
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
