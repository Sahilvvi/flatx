'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { Listing } from '@/lib/types';
import { formatINR, whatsappHref } from '@/lib/format';
import { VerifiedBadge } from '@/components/VerifiedBadge';

interface Props {
  listings: Listing[];
  /** Called when the user swipes right / taps Save on a card. */
  onLike?: (listing: Listing) => void;
  /** Called when the user swipes left / taps Skip on a card. */
  onSkip?: (listing: Listing) => void;
  /** Called when the user reaches the end of the deck. */
  onEmpty?: () => void;
}

type DragState = {
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  active: boolean;
};

const INITIAL: DragState = { startX: 0, startY: 0, dx: 0, dy: 0, active: false };
const THRESHOLD = 80; // pixels before a swipe is committed

/**
 * Tinder-style swipeable deck of listing cards.
 * - Swipe right (or tap ♥) to Save.
 * - Swipe left (or tap ✕) to Skip.
 * - Touch + mouse both supported via pointer events.
 */
export function SwipeableDeck({ listings, onLike, onSkip, onEmpty }: Props) {
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState<DragState>(INITIAL);
  const [animateOut, setAnimateOut] = useState<'left' | 'right' | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const current = listings[index];
  const next = listings[index + 1];
  const after = listings[index + 2];

  const transform = useMemo(() => {
    if (animateOut === 'left') return 'translateX(-140%) rotate(-20deg)';
    if (animateOut === 'right') return 'translateX(140%) rotate(20deg)';
    if (!drag.active) return 'translate(0,0) rotate(0deg)';
    const rot = Math.max(-20, Math.min(20, drag.dx / 10));
    return `translate(${drag.dx}px, ${drag.dy}px) rotate(${rot}deg)`;
  }, [drag, animateOut]);

  useEffect(() => {
    if (!current && listings.length > 0) onEmpty?.();
  }, [current, listings.length, onEmpty]);

  function commit(direction: 'left' | 'right') {
    if (!current || animateOut) return;
    setAnimateOut(direction);
    if (direction === 'right') onLike?.(current);
    else onSkip?.(current);
    // After the CSS transition, advance.
    window.setTimeout(() => {
      setAnimateOut(null);
      setDrag(INITIAL);
      setIndex((i) => i + 1);
    }, 220);
  }

  function onPointerDown(e: React.PointerEvent) {
    if (animateOut) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDrag({ startX: e.clientX, startY: e.clientY, dx: 0, dy: 0, active: true });
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag.active) return;
    setDrag((d) => ({ ...d, dx: e.clientX - d.startX, dy: e.clientY - d.startY }));
  }

  function onPointerUp() {
    if (!drag.active) return;
    if (drag.dx > THRESHOLD) {
      commit('right');
    } else if (drag.dx < -THRESHOLD) {
      commit('left');
    } else {
      setDrag(INITIAL);
    }
  }

  if (!current) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-semibold text-slate-900">You&apos;re all caught up</h2>
        <p className="text-slate-500 text-sm mt-2">No more listings in this deck. Try widening your filters.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="relative h-[500px] select-none">
        {after && <DeckCard listing={after} depth={2} />}
        {next && <DeckCard listing={next} depth={1} />}
        <div
          ref={cardRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="absolute inset-0 touch-none"
          style={{
            transform,
            transition: drag.active ? 'none' : 'transform 220ms ease-out',
          }}
        >
          <DeckCard listing={current} depth={0} swipeDx={drag.dx} />
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 mt-6">
        <button
          type="button"
          onClick={() => commit('left')}
          aria-label="Skip"
          className="w-14 h-14 rounded-full bg-white border border-slate-200 text-rose-500 text-xl shadow-sm hover:bg-rose-50"
        >
          ✕
        </button>
        <Link
          href={`/listings/${current.id}`}
          aria-label="View details"
          className="w-11 h-11 rounded-full bg-white border border-slate-200 text-slate-500 text-sm shadow-sm hover:bg-slate-50 flex items-center justify-center"
        >
          i
        </Link>
        <button
          type="button"
          onClick={() => commit('right')}
          aria-label="Save"
          className="w-14 h-14 rounded-full bg-white border border-slate-200 text-emerald-500 text-xl shadow-sm hover:bg-emerald-50"
        >
          ♥
        </button>
      </div>

      <p className="text-center text-xs text-slate-400 mt-3">
        {index + 1} / {listings.length}
      </p>
    </div>
  );
}

function DeckCard({
  listing,
  depth,
  swipeDx,
}: {
  listing: Listing;
  /** 0 = top card, 1 = second, 2 = third. */
  depth: 0 | 1 | 2;
  swipeDx?: number;
}) {
  const scale = 1 - depth * 0.04;
  const translateY = depth * 8;
  const opacity = 1 - depth * 0.15;
  const likeOpacity = swipeDx && swipeDx > 0 ? Math.min(1, swipeDx / 120) : 0;
  const skipOpacity = swipeDx && swipeDx < 0 ? Math.min(1, -swipeDx / 120) : 0;

  const wa = whatsappHref(
    listing.contact_whatsapp,
    `Hi! I saw your "${listing.title}" listing. Is it still available?`,
  );

  return (
    <div
      aria-hidden={depth > 0}
      className={[
        'absolute inset-0 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-lg',
        depth === 0 ? 'cursor-grab active:cursor-grabbing' : '',
      ].join(' ')}
      style={{
        transform: `translateY(${translateY}px) scale(${scale})`,
        opacity,
        zIndex: 10 - depth,
      }}
    >
      {listing.images?.[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={listing.images[0]} alt="" className="w-full h-64 object-cover bg-slate-100" />
      ) : (
        <div className="w-full h-64 bg-gradient-to-br from-slate-200 to-slate-300" />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 truncate flex items-center gap-1">
              <span className="truncate">{listing.title}</span>
              {listing.is_owner_verified && <VerifiedBadge size="sm" />}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {listing.area_name ?? 'Mumbai'} · {listing.bhk_type}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="font-bold text-slate-900">{formatINR(listing.rent)}</div>
            <div className="text-[10px] uppercase tracking-wide text-slate-400">/ month</div>
          </div>
        </div>
        {listing.description && (
          <p className="text-sm text-slate-600 mt-2 line-clamp-3">{listing.description}</p>
        )}
        {listing.tags && listing.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
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
        {depth === 0 && wa && (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="inline-block mt-3 text-xs font-semibold bg-emerald-500 text-white px-3 py-1.5 rounded-md hover:bg-emerald-600"
          >
            WhatsApp
          </a>
        )}
      </div>

      {depth === 0 && (
        <>
          <div
            className="absolute top-6 left-6 border-4 border-emerald-500 text-emerald-500 font-bold text-2xl uppercase px-3 py-1 rounded-md rotate-[-20deg]"
            style={{ opacity: likeOpacity }}
          >
            Save
          </div>
          <div
            className="absolute top-6 right-6 border-4 border-rose-500 text-rose-500 font-bold text-2xl uppercase px-3 py-1 rounded-md rotate-[20deg]"
            style={{ opacity: skipOpacity }}
          >
            Skip
          </div>
        </>
      )}
    </div>
  );
}
