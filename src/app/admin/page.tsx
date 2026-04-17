import { redirect } from 'next/navigation';
import { fetchAllListings } from '@/lib/listings-service';
import { formatINR } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  // In a real app, verify admin role via Supabase Auth server-side helper:
  // const supabase = createServerClient(...)
  // const { data: { user } } = await supabase.auth.getUser();
  // if (user?.email !== 'admin@flatx.in') redirect('/');

  const listings = await fetchAllListings();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Admin Panel</h1>
      
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="font-semibold text-slate-700">All Listings ({listings.length})</h2>
          <button className="text-sm bg-slate-900 text-white px-3 py-1.5 rounded font-medium hover:bg-slate-800 transition">
            Export CSV
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Area</th>
                <th className="px-4 py-3 font-medium">Rent</th>
                <th className="px-4 py-3 font-medium">WhatsApp</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listings.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{l.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900 max-w-xs truncate">{l.title}</td>
                  <td className="px-4 py-3">{l.area_name ?? '—'}</td>
                  <td className="px-4 py-3 font-semibold">{formatINR(l.rent)}</td>
                  <td className="px-4 py-3">{l.contact_whatsapp ?? '—'}</td>
                  <td className="px-4 py-3 space-x-2">
                    <button className="text-rose-600 hover:text-rose-800 font-medium hover:underline">Ban</button>
                    <button className="text-[color:var(--brand)] hover:text-sky-800 font-medium hover:underline">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
