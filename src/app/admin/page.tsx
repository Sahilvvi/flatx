'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { formatINR } from '@/lib/format';

interface AdminListing {
  id: string;
  title: string;
  rent: number;
  area_name: string | null;
  bhk_type: string;
  contact_whatsapp: string | null;
  created_at: string;
}

interface DuplicatePair {
  primary_id: string;
  duplicate_id: string;
  score: number;
}

export default function AdminPage() {
  const { user, session, loading } = useAuth();
  const token = session?.access_token;

  const [listings, setListings] = useState<AdminListing[] | null>(null);
  const [dupes, setDupes] = useState<DuplicatePair[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setErr(null);
    // Reset so a previous 403 doesn't stick across account switches.
    setAccessDenied(false);
    try {
      const [lRes, dRes] = await Promise.all([
        fetch('/api/admin/listings', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/duplicates', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (lRes.status === 403) {
        setAccessDenied(true);
        return;
      }
      if (!lRes.ok) throw new Error(`listings: ${lRes.status}`);
      const lJson = await lRes.json();
      setListings(lJson.listings ?? []);

      if (dRes.ok) {
        const dJson = await dRes.json();
        setDupes(dJson.pairs ?? []);
      } else {
        setDupes([]);
      }
    } catch (e) {
      setErr((e as Error).message);
    }
  }, [token]);

  useEffect(() => {
    if (!loading && token) void load();
  }, [loading, token, load]);

  async function onDelete(id: string) {
    if (!token) return;
    if (!confirm('Permanently delete this listing?')) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/listings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`delete failed (${res.status})`);
      setListings((rows) => (rows ?? []).filter((l) => l.id !== id));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 py-16 text-slate-500">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Admin</h1>
        <p className="text-slate-600 mt-2">Sign in to access the moderation panel.</p>
        <Link
          href="/auth/login?next=/admin"
          className="inline-block mt-4 bg-slate-900 text-white px-4 py-2 rounded-md font-semibold"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Access denied</h1>
        <p className="text-slate-600 mt-2 text-sm">
          <span className="font-mono">{user.email}</span> is not in the <code>ADMIN_EMAILS</code> allow-list.
        </p>
        <Link href="/" className="inline-block mt-4 text-sm text-slate-600 hover:underline">
          ← Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Moderation</h1>
        <p className="text-sm text-slate-500 mt-1">
          Signed in as <span className="font-mono">{user.email}</span>
        </p>
      </header>

      {err && (
        <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3 rounded-md">
          {err}
        </div>
      )}

      <section className="mb-10">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Likely duplicates {dupes && <span className="text-slate-500">({dupes.length})</span>}
          </h2>
          <button
            type="button"
            onClick={() => void load()}
            className="text-xs text-slate-600 hover:text-slate-900 underline"
          >
            Refresh
          </button>
        </div>
        {dupes === null ? (
          <div className="text-sm text-slate-500">Loading…</div>
        ) : dupes.length === 0 ? (
          <div className="text-sm text-slate-500 bg-slate-50 border border-dashed border-slate-300 rounded-md p-4">
            No duplicate pairs found. (Requires migration 0004_search_and_dedup.sql.)
          </div>
        ) : (
          <ul className="space-y-2">
            {dupes.slice(0, 30).map((p, i) => (
              <li
                key={`${p.primary_id}-${p.duplicate_id}-${i}`}
                className="flex flex-wrap gap-3 items-center bg-white border border-slate-200 rounded-md p-3 text-sm"
              >
                <Link href={`/listings/${p.primary_id}`} className="font-mono text-xs text-slate-700 hover:underline">
                  {p.primary_id.slice(0, 8)}
                </Link>
                <span className="text-slate-400">↔</span>
                <Link href={`/listings/${p.duplicate_id}`} className="font-mono text-xs text-slate-700 hover:underline">
                  {p.duplicate_id.slice(0, 8)}
                </Link>
                <span className="ml-auto text-xs text-slate-500">similarity {(p.score * 100).toFixed(0)}%</span>
                <button
                  type="button"
                  onClick={() => void onDelete(p.duplicate_id)}
                  disabled={busy === p.duplicate_id}
                  className="text-xs bg-rose-50 text-rose-700 border border-rose-200 px-2 py-1 rounded hover:bg-rose-100 disabled:opacity-50"
                >
                  Delete dup
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">
          All listings {listings && <span className="text-slate-500">({listings.length})</span>}
        </h2>
        {listings === null ? (
          <div className="text-sm text-slate-500">Loading…</div>
        ) : listings.length === 0 ? (
          <div className="text-sm text-slate-500">No listings yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-slate-200 rounded-md overflow-hidden">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
                <tr>
                  <th className="text-left px-3 py-2">Title</th>
                  <th className="text-left px-3 py-2">Area</th>
                  <th className="text-left px-3 py-2">BHK</th>
                  <th className="text-right px-3 py-2">Rent</th>
                  <th className="text-left px-3 py-2">WA</th>
                  <th className="text-right px-3 py-2">Created</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {listings.map((l) => (
                  <tr key={l.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <Link href={`/listings/${l.id}`} className="text-slate-800 hover:underline">
                        {l.title}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-slate-600">{l.area_name ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-600">{l.bhk_type}</td>
                    <td className="px-3 py-2 text-right text-slate-800 font-medium">{formatINR(l.rent)}</td>
                    <td className="px-3 py-2 text-slate-600 text-xs">{l.contact_whatsapp ?? '—'}</td>
                    <td className="px-3 py-2 text-right text-slate-500 text-xs">
                      {new Date(l.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => void onDelete(l.id)}
                        disabled={busy === l.id}
                        className="text-xs bg-rose-50 text-rose-700 border border-rose-200 px-2 py-1 rounded hover:bg-rose-100 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
