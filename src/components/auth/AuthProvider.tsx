'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { hasSupabase } from '@/lib/env';

interface Profile {
  id: string;
  phone: string | null;
  is_verified: boolean;
  name: string | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(u: User | null) {
    const supabase = getSupabaseBrowser();
    if (!supabase || !u) {
      setProfile(null);
      return;
    }
    const { data } = await supabase
      .from('users')
      .select('id, phone, is_verified, name')
      .eq('id', u.id)
      .maybeSingle();
    if (data) {
      setProfile(data as Profile);
    } else {
      // Auto-create profile row on first sign-in. When a phone OTP succeeds,
      // the session contains a phone claim we can mirror into public.users.
      const phone = (u.phone as string | undefined) ?? null;
      const { data: inserted } = await supabase
        .from('users')
        .insert({ id: u.id, phone, is_verified: !!phone })
        .select('id, phone, is_verified, name')
        .maybeSingle();
      setProfile((inserted as Profile) ?? null);
    }
  }

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      loadProfile(data.session?.user ?? null).finally(() => {
        if (!cancelled) setLoading(false);
      });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      void loadProfile(newSession?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  }

  async function refreshProfile() {
    await loadProfile(user);
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export { hasSupabase };
