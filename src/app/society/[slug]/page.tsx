import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchAllListings } from '@/lib/listings-service';
import { ListingCard } from '@/components/ListingCard';
import { formatINR } from '@/lib/format';
import { SITE_URL } from '@/lib/env';
import type { BhkType } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

interface Props {
  params: { slug: string };
}

function slugToName(slug: string) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function matchesSociety(listing: { title: string; description: string | null; tags: string[] }, slug: string, name: string) {
  const needle = name.toLowerCase();
  const hay = `${listing.title} ${listing.description ?? ''} ${listing.tags.join(' ')}`.toLowerCase();
  return hay.includes(needle) || hay.includes(slug.toLowerCase().replace(/-/g, ' '));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const name = slugToName(params.slug);
  const title = `${name} — flats for rent & society profile | FlatX`;
  const description = `Listings, amenities and rent trends at ${name}, Mumbai. No broker spam.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/society/${params.slug}` },
    openGraph: { title, description, url: `${SITE_URL}/society/${params.slug}`, type: 'website' },
  };
}

export default async function SocietyPage({ params }: Props) {
  const name = slugToName(params.slug);

  const all = await fetchAllListings();
  const matches = all.filter((l) => matchesSociety(l, params.slug, name));

  if (matches.length === 0) notFound();

  const totalRent = matches.reduce((s, l) => s + l.rent, 0);
  const avgRent = Math.round(totalRent / matches.length);
  const verifiedCount = matches.filter((l) => l.is_owner_verified).length;

  const bhkDist: Partial<Record<BhkType, number>> = {};
  for (const l of matches) {
    bhkDist[l.bhk_type] = (bhkDist[l.bhk_type] ?? 0) + 1;
  }

  const tagCount: Record<string, number> = {};
  for (const l of matches) for (const t of l.tags) tagCount[t] = (tagCount[t] ?? 0) + 1;
  const topTags = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const areaName = matches[0]?.area_name ?? 'Mumbai';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ApartmentComplex',
    name,
    address: {
      '@type': 'PostalAddress',
      addressLocality: areaName,
      addressRegion: 'Maharashtra',
      addressCountry: 'IN',
    },
    numberOfAccommodationUnits: matches.length,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
        ← Back to map
      </Link>

      <header className="mt-4 mb-8 grid md:grid-cols-2 gap-6 items-end border-b border-slate-200 pb-6">
        <div>
          <div className="inline-block px-2 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded mb-3">
            SOCIETY PROFILE
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">{name}</h1>
          <p className="text-slate-600 mt-1 text-sm">{areaName}, Mumbai</p>
        </div>

        <div className="flex gap-3 md:justify-end">
          <Stat label="Active flats" value={String(matches.length)} />
          <Stat label="Avg rent" value={formatINR(avgRent)} />
          <Stat label="Verified" value={`${verifiedCount}/${matches.length}`} />
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        <aside className="md:col-span-1 space-y-4">
          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Flat mix</h3>
            <ul className="space-y-2 text-sm">
              {Object.entries(bhkDist).map(([bhk, count]) => (
                <li key={bhk} className="flex justify-between">
                  <span className="text-slate-600">{bhk}</span>
                  <span className="font-medium bg-slate-100 px-2 py-0.5 rounded">{count}</span>
                </li>
              ))}
            </ul>
          </section>

          {topTags.length > 0 && (
            <section className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900 mb-3">Common features</h3>
              <div className="flex flex-wrap gap-2">
                {topTags.map(([t, c]) => (
                  <span key={t} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                    {t.replace(/_/g, ' ')} · {c}
                  </span>
                ))}
              </div>
            </section>
          )}
        </aside>

        <main className="md:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            {matches.length} listing{matches.length === 1 ? '' : 's'} at {name}
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {matches.slice(0, 24).map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 text-center min-w-[90px]">
      <div className="text-base md:text-lg font-bold text-slate-900">{value}</div>
      <div className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</div>
    </div>
  );
}
