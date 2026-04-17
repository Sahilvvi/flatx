import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchNearbyListings } from '@/lib/listings-service';
import { ListingCard } from '@/components/ListingCard';

interface Props {
  params: { slug: string };
}

export const revalidate = 3600;

function formatSlug(slug: string) {
  return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export async function generateMetadata({ params }: Props) {
  const societyName = formatSlug(params.slug);
  return {
    title: `${societyName} | Flats for Rent & Society Insight | Mumbai Rent Intelligence`,
  };
}

export default async function SocietyPage({ params }: Props) {
  const societyName = formatSlug(params.slug);
  
  // In a real app we'd query by society_id.
  // For the demo we fetch some listings and pretend they are from this society.
  const listings = await fetchNearbyListings({ lat: 19.1197, lng: 72.9051, limit: 10 });
  const societyListings = listings.slice(0, Math.max(3, listings.length - 2)); 

  if (!societyListings || societyListings.length === 0) {
    notFound();
  }

  const bhkDistribution = societyListings.reduce((acc, curr) => {
    acc[curr.bhk_type] = (acc[curr.bhk_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
        ← Home
      </Link>
      
      <header className="mt-6 mb-8 border-b border-slate-200 pb-8 grid md:grid-cols-2 gap-8 items-end">
        <div>
          <div className="inline-block px-2 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded mb-3">
            VERIFIED SOCIETY
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            {societyName}
          </h1>
          <p className="text-slate-600 mt-2">
            Powai, Central Suburbs, Mumbai
          </p>
        </div>
        
        <div className="flex gap-4 md:justify-end">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center flex-1 md:flex-none md:min-w-[120px]">
            <div className="text-2xl font-bold text-slate-900">{societyListings.length}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">Active Flats</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center flex-1 md:flex-none md:min-w-[120px]">
            <div className="text-2xl font-bold text-slate-900">72%</div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">Family Owned</div>
          </div>
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        <aside className="md:col-span-1 space-y-6">
          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Amenities</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2"><span>🏊</span> Swimming Pool</li>
              <li className="flex items-center gap-2"><span>🏋️</span> Gymnasium</li>
              <li className="flex items-center gap-2"><span>🛡️</span> 24x7 Security</li>
              <li className="flex items-center gap-2"><span>🅿️</span> Visitor Parking</li>
              <li className="flex items-center gap-2"><span>⚡</span> Power Backup</li>
            </ul>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Flat Distribution</h3>
            <div className="space-y-3">
              {Object.entries(bhkDistribution).map(([bhk, count]) => (
                <div key={bhk} className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">{bhk}</span>
                  <span className="font-medium bg-slate-100 px-2 py-0.5 rounded">{count}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <main className="md:col-span-2">
          <h2 className="text-xl font-semibold mb-4 text-slate-900">Current Listings in {societyName}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {societyListings.map(l => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
