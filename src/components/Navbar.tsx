import Link from 'next/link';

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 h-14">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <span
            aria-hidden
            className="inline-block w-7 h-7 rounded-lg bg-[color:var(--brand)] text-white flex items-center justify-center text-xs font-bold"
          >
            MR
          </span>
          <span className="hidden sm:inline">Mumbai Rent Intelligence</span>
          <span className="sm:hidden">MRI</span>
        </Link>
        <nav className="flex items-center gap-1 md:gap-3 text-sm">
          <Link href="/" className="px-3 py-1.5 rounded-md text-slate-700 hover:bg-slate-100">
            Map
          </Link>
          <Link href="/insights" className="px-3 py-1.5 rounded-md text-slate-700 hover:bg-slate-100">
            Rent check
          </Link>
          <Link href="/match" className="px-3 py-1.5 rounded-md text-slate-700 hover:bg-slate-100">
            Match
          </Link>
          <Link
            href="/listings/new"
            className="ml-1 md:ml-2 px-3 py-1.5 rounded-md bg-[color:var(--brand)] text-white hover:bg-[color:var(--brand-dark)]"
          >
            + List
          </Link>
        </nav>
      </div>
    </header>
  );
}
