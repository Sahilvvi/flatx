import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchNearbyListings, computeRentInsight } from '@/lib/listings-service';
import { ListingCard } from '@/components/ListingCard';
import { formatINR } from '@/lib/format';
import { AREAS, findArea, listingMatchesArea } from '@/lib/areas';
import { SITE_URL } from '@/lib/env';
import type { BhkType } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

interface Props {
  params: { area: string };
}

export function generateStaticParams() {
  return AREAS.map((a) => ({ area: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const area = findArea(params.area);
  if (!area) return {};
  const title = `Rent in ${area.name} — 1BHK, 2BHK, 3BHK flats | FlatX`;
  const description =
    area.blurb ??
    `Find flats for rent in ${area.name}, Mumbai. Real rents, verified listings, no broker spam.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/${area.slug}` },
    openGraph: { title, description, url: `${SITE_URL}/${area.slug}`, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

const BHK_OPTIONS: BhkType[] = ['1RK', '1BHK', '2BHK', '3BHK', '4BHK+'];

export default async function AreaPage({ params }: Props) {
  const area = findArea(params.area);
  if (!area) notFound();

  const listings = await fetchNearbyListings({
    lat: area.lat,
    lng: area.lng,
    radiusM: 2500,
    limit: 60,
  });

  const areaListings = listings.filter((l) => listingMatchesArea(l.area_name, area));
  const displayListings = areaListings.length > 0 ? areaListings : listings;

  const bhkBuckets: Partial<Record<BhkType, number[]>> = {};
  for (const l of displayListings) {
    if (!bhkBuckets[l.bhk_type]) bhkBuckets[l.bhk_type] = [];
    bhkBuckets[l.bhk_type]!.push(l.rent);
  }
  const medians: Partial<Record<BhkType, number>> = {};
  for (const bhk of BHK_OPTIONS) {
    const vals = (bhkBuckets[bhk] ?? []).slice().sort((a, b) => a - b);
    if (vals.length >= 1) {
      medians[bhk] = vals[Math.floor(vals.length / 2)];
    }
  }

  const insight2BHK = await computeRentInsight(area.lat, area.lng, 2500, '2BHK');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: area.name,
    address: { '@type': 'PostalAddress', addressLocality: area.name, addressRegion: 'Maharashtra', addressCountry: 'IN' },
    geo: { '@type': 'GeoCoordinates', latitude: area.lat, longitude: area.lng },
    description: area.blurb,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
        ← Back to map
      </Link>

      <header className="mt-4 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
          Rent in {area.name}
        </h1>
        {area.blurb && <p className="text-slate-600 mt-2 max-w-2xl text-sm md:text-base">{area.blurb}</p>}
      </header>

      <div className="grid md:grid-cols-4 gap-8">
        <section className="md:col-span-3">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            {displayListings.length} {displayListings.length === 1 ? 'listing' : 'listings'}
            {areaListings.length === 0 && listings.length > 0 && (
              <span className="ml-2 text-xs font-normal text-slate-500">(nearby — no exact matches yet)</span>
            )}
          </h2>

          {displayListings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
              <p className="text-slate-600">No listings in {area.name} yet.</p>
              <Link
                href={`/listings/new?lat=${area.lat}&lng=${area.lng}`}
                className="inline-block mt-4 bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-md"
              >
                + Be the first to list here
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {displayListings.slice(0, 24).map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          )}
        </section>

        <aside className="md:col-span-1 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Median rent</h3>
            <ul className="space-y-2 text-sm">
              {BHK_OPTIONS.map((bhk) => (
                <li key={bhk} className="flex items-baseline justify-between border-b border-slate-100 pb-1 last:border-b-0">
                  <span className="text-slate-600">{bhk}</span>
                  <span className="font-semibold text-slate-900">
                    {medians[bhk] ? formatINR(medians[bhk] as number) : '—'}
                  </span>
                </li>
              ))}
            </ul>
            {insight2BHK.sample_size >= 3 && (
              <p className="text-xs text-slate-500 mt-3">
                Based on {displayListings.length} listings within 2.5 km of {area.name}.
              </p>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-900 mb-2">Explore other areas</h3>
            <ul className="space-y-1 text-sm">
              {AREAS.filter((a) => a.slug !== area.slug)
                .slice(0, 8)
                .map((a) => (
                  <li key={a.slug}>
                    <Link href={`/${a.slug}`} className="text-slate-700 hover:text-slate-900 hover:underline">
                      {a.name}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>

          <Link
            href={`/?lat=${area.lat}&lng=${area.lng}&zoom=14`}
            className="block text-center bg-slate-900 text-white text-sm font-semibold py-2.5 rounded-md hover:bg-slate-800"
          >
            Open {area.name} on the map
          </Link>
        </aside>
      </div>
    </div>
  );
}
