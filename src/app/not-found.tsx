import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-emerald-50 via-white to-amber-50">
      <div className="max-w-lg text-center">
        <div className="text-7xl mb-4">🗺️</div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Page not found</h1>
        <p className="mt-3 text-slate-600">
          Looks like this address doesn&rsquo;t exist on our Mumbai map. The listing may have been
          taken down, or you followed a broken link.
        </p>
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          <Link
            href="/"
            className="px-4 py-2 rounded-md bg-[color:var(--brand)] text-white font-semibold hover:bg-[color:var(--brand-dark)]"
          >
            Back to map
          </Link>
          <Link
            href="/listings/new"
            className="px-4 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
          >
            Add a listing
          </Link>
          <Link
            href="/insights"
            className="px-4 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
          >
            Check your rent
          </Link>
        </div>
      </div>
    </div>
  );
}
