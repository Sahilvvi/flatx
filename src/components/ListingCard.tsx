'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Listing } from '@/lib/types';
import { formatDistance, formatINR, whatsappHref } from '@/lib/format';

import { useState } from 'react';

interface Props {
  listing: Listing;
  active?: boolean;
  onHover?: (id: string | null) => void;
  onClick?: (listing: Listing) => void;
}

export function ListingCard({ listing, active, onHover, onClick }: Props) {
  const [isFavorite, setIsFavorite] = useState(false);
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
        'group rounded-xl border p-4 transition shadow-sm cursor-pointer block relative',
        listing.featured ? 'bg-amber-50/30' : 'bg-white',
        active ? 'border-[color:var(--brand)] ring-2 ring-[color:var(--brand)]/30' : 
        (listing.featured ? 'border-amber-400 ring-1 ring-amber-300 shadow-amber-100 hover:border-amber-500' : 'border-slate-200 hover:border-slate-300'),
      ].join(' ')}
    >
      {listing.featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 bg-gradient-to-r from-amber-400 to-yellow-500 text-white font-bold tracking-widest uppercase text-[9px] px-3 py-1 rounded-full shadow-md flex items-center gap-1">
          <span>✨</span> Featured
        </div>
      )}
      {listing.images && listing.images.length > 0 && (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg mb-3 bg-slate-100">
          <Image
            src={listing.images[0]}
            alt={listing.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFavorite(!isFavorite);
            }}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/70 hover:bg-white backdrop-blur-sm transition-colors text-lg"
          >
            {isFavorite ? '❤️' : '🤍'}
          </button>
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">{listing.title}</h3>
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
