'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { hasSupabase } from '@/lib/env';

/**
 * Phone-OTP login flow. Two steps:
 *   1. User enters phone → we call supabase.auth.signInWithOtp({ phone })
 *   2. User enters the 6-digit code → supabase.auth.verifyOtp()
 *
 * A successful verification establishes a session AND implicitly proves the
 * user owns that phone number, so we mark them `is_verified = true`.
 */
export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get('next') ?? '/';

  const [phase, setPhase] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError('Auth not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
      return;
    }
    const cleaned = normalisePhone(phone);
    if (!cleaned) {
      setError('Enter a valid phone number (e.g. 9876543210 or +919876543210).');
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOtp({ phone: cleaned });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setPhone(cleaned);
    setPhase('otp');
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    if (otp.trim().length < 4) {
      setError('Enter the 6-digit code we sent you.');
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.verifyOtp({
      phone,
      token: otp.trim(),
      type: 'sms',
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
        ← Back
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">Sign in</h1>
      <p className="text-slate-600 text-sm mt-1">
        We&rsquo;ll send a one-time code to your phone. Verified users get a badge on their listings.
      </p>

      {!hasSupabase && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 text-amber-800 text-xs px-3 py-2">
          Auth is in demo mode. Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and
          <code> NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, then enable the Phone provider in
          Supabase → Auth → Providers.
        </div>
      )}

      {phase === 'phone' && (
        <form onSubmit={sendOtp} className="mt-6 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">Phone number</span>
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              required
            />
            <span className="block mt-1 text-[11px] text-slate-500">
              Include the country code. India numbers are assumed +91 by default.
            </span>
          </label>
          <button
            type="submit"
            disabled={loading || !hasSupabase}
            className="w-full bg-[color:var(--brand)] text-white font-semibold py-2 rounded-md disabled:opacity-60"
          >
            {loading ? 'Sending code…' : 'Send verification code'}
          </button>
        </form>
      )}

      {phase === 'otp' && (
        <form onSubmit={verify} className="mt-6 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <p className="text-xs text-slate-600">
            We sent a code to <span className="font-semibold">{phone}</span>.{' '}
            <button
              type="button"
              onClick={() => {
                setPhase('phone');
                setOtp('');
              }}
              className="text-[color:var(--brand)] underline"
            >
              Change
            </button>
          </p>
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">Verification code</span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={8}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-center text-lg tracking-[0.3em] font-semibold"
              required
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[color:var(--brand)] text-white font-semibold py-2 rounded-md disabled:opacity-60"
          >
            {loading ? 'Verifying…' : 'Verify & sign in'}
          </button>
        </form>
      )}

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 text-red-800 text-sm px-3 py-2">
          {error}
        </div>
      )}
    </div>
  );
}

function normalisePhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, '');
  if (!digits) return null;
  if (digits.startsWith('+')) return digits.length >= 8 ? digits : null;
  // Default to India +91 if a bare 10-digit number was entered.
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;
  return null;
}
