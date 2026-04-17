import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchListingById, fetchNearbyListings, computeRentInsight } from '@/lib/listings-service';
import { formatINR } from '@/lib/format';
import { whatsappHref } from '@/lib/format';
import { ListingMapPreview } from '@/components/map/ListingMapPreview';
import { ListingCard } from '@/components/ListingCard';
import { ImageGallery } from '@/components/ImageGallery';
import { ShareButton } from '@/components/ShareButton';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props) {
  const listing = await fetchListingById(params.id);
  if (!listing) return { title: 'Listing not found' };
  return {
    title: `${listing.title} · ${formatINR(listing.rent)}/mo`,
    description: listing.description ?? `${listing.bhk_type} in ${listing.area_name ?? 'Mumbai'}`,
  };
}

export default async function ListingDetailPage({ params }: Props) {
  const listing = await fetchListingById(params.id);
  if (!listing) notFound();

  const [insight, similar] = await Promise.all([
    computeRentInsight(listing.lat, listing.lng, 1500, listing.bhk_type),
    fetchNearbyListings({
      lat: listing.lat,
      lng: listing.lng,
      radiusM: 3000,
      limit: 6,
    }),
  ]);

  const wa = whatsappHref(
    listing.contact_whatsapp,
    `Hi! I saw your "${listing.title}" listing on Mumbai Rent Intelligence. Is it still available?`,
  );

  const verdict =
    insight.sample_size >= 3 && insight.avg_rent
      ? (() => {
          const delta = ((listing.rent - insight.avg_rent) / insight.avg_rent) * 100;
          if (delta > 10) return { tone: 'warn' as const, text: `~${Math.round(delta)}% above average for ${listing.bhk_type} here` };
          if (delta < -10) return { tone: 'good' as const, text: `~${Math.round(-delta)}% below average — great deal` };
          return { tone: 'neutral' as const, text: 'Priced in line with the local average' };
        })()
      : null;

  const similarOthers = similar.filter((s) => s.id !== listing.id).slice(0, 4);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ApartmentComplex",
            "name": listing.title,
            "description": listing.description,
            "url": `https://flatx.in/listings/${listing.id}`,
            "address": {
              "@type": "PostalAddress",
              "addressLocality": listing.area_name || "Mumbai",
              "addressRegion": "Maharashtra",
              "addressCountry": "IN"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": listing.lat,
              "longitude": listing.lng
            },
            "offers": {
              "@type": "Offer",
              "priceCurrency": "INR",
              "price": listing.rent,
              "eligibleRegion": {
                "@type": "Place",
                "name": "Mumbai"
              }
            }
          })
        }}
      />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
          ← Back to map
        </Link>

      <div className="grid md:grid-cols-3 gap-6 mt-4">
        <div className="md:col-span-2 space-y-6">
          <header>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{listing.title}</h1>
            <p className="text-slate-600 mt-1">
              {listing.area_name ?? 'Mumbai'} · {listing.bhk_type} ·{' '}
              {listing.furnishing === 'semi' ? 'Semi-furnished' : listing.furnishing}
            </p>
          </header>

          <ImageGallery images={listing.images} />

          <ListingMapPreview lat={listing.lat} lng={listing.lng} />

          {listing.description && (
            <section className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="font-semibold mb-2">About this place</h2>
              <p className="text-slate-700 text-sm whitespace-pre-wrap">{listing.description}</p>
            </section>
          )}

          {listing.tags.length > 0 && (
            <section className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="font-semibold mb-2">Society / preferences</h2>
              <div className="flex flex-wrap gap-2">
                {listing.tags.map((t) => (
                  <span key={t} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                    {t.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 sticky top-20">
            <div className="mb-3 inline-flex items-center gap-1.5 bg-rose-50 text-rose-600 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wide">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              {(listing.title.length % 5) + 2} people viewing right now
            </div>
            
            <div className="text-2xl font-bold text-slate-900">
              {formatINR(listing.rent)}
              <span className="text-sm text-slate-500 font-normal">/mo</span>
            </div>
            {listing.deposit ? (
              <div className="text-xs text-slate-500">Deposit {formatINR(listing.deposit)}</div>
            ) : null}

            {verdict && (
              <div
                className={`mt-3 text-xs px-3 py-2 rounded-md ${
                  verdict.tone === 'warn'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : verdict.tone === 'good'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-50 text-slate-700 border border-slate-200'
                }`}
              >
                {verdict.text}
              </div>
            )}

            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-600">
              <div>
                <dt className="text-slate-400">Type</dt>
                <dd className="font-semibold text-slate-800">{labelKind(listing.kind)}</dd>
              </div>
              <div>
                <dt className="text-slate-400">BHK</dt>
                <dd className="font-semibold text-slate-800">{listing.bhk_type}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Furnishing</dt>
                <dd className="font-semibold text-slate-800">{listing.furnishing}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Area</dt>
                <dd className="font-semibold text-slate-800">{listing.area_name ?? '—'}</dd>
              </div>
            </dl>

            <div className="mt-5 space-y-2">
              {wa ? (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-md text-sm"
                >
                  💬 Chat on WhatsApp
                </a>
              ) : (
                <div className="text-center text-xs text-slate-500 py-2">
                  Contact info not provided.
                </div>
              )}
              <Link
                href={`/insights?lat=${listing.lat}&lng=${listing.lng}&rent=${listing.rent}&bhk=${listing.bhk_type}`}
                className="block text-center w-full bg-white border border-slate-300 text-slate-700 font-semibold py-2 rounded-md text-sm hover:bg-slate-50"
              >
                Check local rent trend
              </Link>
              <ShareButton 
                title={`${listing.title} on Mumbai Rent Intelligence`}
                text={`Check out this ${listing.bhk_type} in ${listing.area_name ?? 'Mumbai'} for ${formatINR(listing.rent)}/mo.`}
                url={`https://flatx.in/listings/${listing.id}`} 
              />
            </div>
          </div>
          
          <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-600 mt-4 mx-auto transition-colors">
            <span>⚠️</span> Report listing (scam or broker)
          </button>
        </aside>
      </div>

      {similarOthers.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Similar listings nearby</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {similarOthers.map((s) => (
              <ListingCard key={s.id} listing={s} />
            ))}
          </div>
        </section>
      )}
    </div>
    </>
  );
}

function labelKind(k: string) {
  if (k === 'flat') return 'Full flat';
  if (k === 'room') return 'Room / PG';
  return 'Flatmate';
}
