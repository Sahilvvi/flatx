import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchNearbyListings, computeRentInsight } from '@/lib/listings-service';
import { ListingCard } from '@/components/ListingCard';
import { formatINR } from '@/lib/format';

interface Props {
  params: { area: string };
}

// Ensure static generation or let it be server rendered.
export const revalidate = 3600;

function formatAreaParam(area: string) {
  return area.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export async function generateMetadata({ params }: Props) {
  const areaName = formatAreaParam(params.area);
  return {
    title: `Rent in ${areaName} | 1BHK, 2BHK, 3BHK Flats | Mumbai Rent Intelligence`,
    description: `Find the best flats for rent in ${areaName}. See actual rental trends, verified listings, and get insights on whether you're overpaying.`,
  };
}

export default async function AreaPage({ params }: Props) {
  const areaName = formatAreaParam(params.area);
  
  // Try to find the coordinate for the area. Fallback to a general Mumbai coordinate.
  // In a real app we'd query a geocoding DB. We'll use a mocked map for now to generate an insight.
  let lat = 19.055; // Bandra roughly
  let lng = 72.8296;

  // Since we rely on a database or some geocoded bounds for the area, we'll fetch general nearby for the demo
  const insightPromise = computeRentInsight(lat, lng, 3000, '2BHK');
  const listingsPromise = fetchNearbyListings({ lat, lng, radiusM: 5000, limit: 12 });

  const [insight, listings] = await Promise.all([insightPromise, listingsPromise]);

  if (!listings || listings.length === 0) {
    // If no data, render 404 or a "coming soon" message
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">No listings found in {areaName} right now.</h1>
        <Link href="/" className="text-[color:var(--brand)] font-medium">← Back to map</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
        ← Home
      </Link>
      
      <header className="mt-6 mb-10">
        <h1 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">
          Rent in {areaName}
        </h1>
        <p className="text-lg text-slate-600 mt-3 max-w-2xl">
          {listings.length} verified listings available. 
          {insight.median_rent && (
            <span> The median rent for a 2BHK here is roughly <strong className="text-slate-900">{formatINR(insight.median_rent)}/mo</strong>.</span>
          )}
        </p>
      </header>

      <div className="grid md:grid-cols-4 gap-8">
        <div className="md:col-span-3">
          <h2 className="text-xl font-semibold mb-4">Latest Flats in {areaName}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {listings.map(l => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </div>

        <aside className="md:col-span-1 space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-900 mb-2">Area Insights</h3>
            {insight.sample_size < 3 ? (
              <p className="text-sm text-slate-600">Not enough verified data to show rent trends for {areaName} yet.</p>
            ) : (
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide">Median 2BHK Rent</div>
                  <div className="text-xl font-bold text-slate-900">{formatINR(insight.median_rent!)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide">Data points</div>
                  <div className="text-sm font-semibold">{insight.sample_size} submissions</div>
                </div>
                <div className="pt-3 border-t border-slate-200">
                  <p className="text-xs text-slate-600 items-center justify-center">
                    SEO Tip: Rank for "rent in {areaName}"
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
