'use client';

import Link from 'next/link';
import type { Listing } from '@/lib/types';
import { formatDistance, formatINR, whatsappHref } from '@/lib/format';
import { VerifiedBadge } from '@/components/VerifiedBadge';

interface Props {
  listing: Listing;
  active?: boolean;
  onHover?: (id: string | null) => void;
  onClick?: (listing: Listing) => void;
}

export function ListingCard({ listing, active, onHover, onClick }: Props) {
  const wa = whatsappHref(
    listing.contact_whatsapp,
    `Hi! I saw your "${listing.title}" listing on Mumbai Rent Intelligence. Is it still available?`,
  );
  return (
    <article
      onMouseEnter={() => onHover?.(listing.id)}
      onMouseLeave={() => onHover?.(null)}
      onClick={() => onClick?.(listing)}
      className={[
        'rounded-xl border bg-white p-4 transition shadow-sm cursor-pointer',
        active ? 'border-[color:var(--brand)] ring-2 ring-[color:var(--brand)]/30' : 'border-slate-200 hover:border-slate-300',
      ].join(' ')}
    >
      <div className="-mx-4 -mt-4 mb-3 aspect-[16/9] bg-slate-100 overflow-hidden rounded-t-xl">
        {listing.images?.length > 0 ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[color:var(--brand)]/10 via-slate-100 to-slate-200 text-slate-400">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 10.5 12 3l9 7.5" />
              <path d="M5 9v12h14V9" />
              <path d="M10 21v-6h4v6" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900 truncate flex items-center gap-1">
            <span className="truncate">{listing.title}</span>
            {listing.is_owner_verified && <VerifiedBadge size="sm" />}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {listing.area_name ?? 'Mumbai'} · {listing.bhk_type} · {labelFurnishing(listing.furnishing)}
            {listing.distance_m !== undefined && (
              <span className="ml-1 text-slate-400">· {formatDistance(listing.distance_m)} away</span>
            )}
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="font-bold text-slate-900">{formatINR(listing.rent)}</div>
          <div className="text-[10px] uppercase tracking-wide text-slate-400">/ month</div>
        </div>
      </div>

      {listing.description && (
        <p className="text-sm text-slate-600 mt-2 line-clamp-2">{listing.description}</p>
      )}

      {listing.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {listing.tags.slice(0, 4).map((t) => (
            <span
              key={t}
              className="text-[10px] uppercase tracking-wide bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
            >
              {t.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-3">
        <Link
          href={`/listings/${listing.id}`}
          className="text-xs font-medium text-[color:var(--brand)] hover:underline"
        >
          View details →
        </Link>
        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs font-semibold bg-emerald-500 text-white px-3 py-1.5 rounded-md hover:bg-emerald-600"
          >
            WhatsApp
          </a>
        ) : (
          <span className="text-xs text-slate-400">No contact</span>
        )}
      </div>
    </article>
  );
}

function labelFurnishing(f: Listing['furnishing']): string {
  return f === 'semi' ? 'Semi-furn' : f === 'furnished' ? 'Furnished' : 'Unfurnished';
}
