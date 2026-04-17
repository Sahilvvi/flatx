'use client';

import { useState } from 'react';
import { Listing } from '@/lib/types';
import { ListingCard } from './ListingCard';

interface Props {
  listings: Listing[];
  onFinish?: () => void;
}

export function SwipeableDeck({ listings, onFinish }: Props) {
  const [index, setIndex] = useState(0);

  if (!listings || listings.length === 0) return null;
  
  if (index >= listings.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-slate-200 rounded-xl text-center h-full">
        <div className="text-4xl mb-4">🎉</div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">You've seen them all!</h3>
        <p className="text-slate-500 text-sm mb-4">No more listings matching your exact criteria in this area.</p>
        <button 
          onClick={onFinish}
          className="bg-[color:var(--brand)] text-white px-6 py-2 rounded-lg font-semibold"
        >
          Back to map
        </button>
      </div>
    );
  }

  const currentListing = listings[index];

  const handleSwipe = (direction: 'left' | 'right') => {
    // direction doesn't matter much for our simple state, but left = reject, right = save
    if (direction === 'right') {
      // simulate save
    }
    setIndex(prev => prev + 1);
  };

  return (
    <div className="flex flex-col h-full bg-slate-100/50 p-4 relative">
      <div className="flex justify-between items-center mb-4 text-xs font-semibold text-slate-500 px-2">
        <span>Tinder-mode Active 🔥</span>
        <span>{index + 1} of {listings.length}</span>
      </div>

      <div className="flex-1 relative w-full max-w-sm mx-auto shadow-2xl rounded-2xl bg-white overflow-hidden flex flex-col transform transition-transform">
        <div className="flex-1 overflow-y-auto">
          <ListingCard listing={currentListing} />
        </div>
      </div>

      <div className="flex justify-center gap-6 mt-6 pb-6">
        <button 
          onClick={() => handleSwipe('left')}
          className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-3xl hover:bg-rose-50 text-rose-500 transition-colors border border-rose-100"
        >
          ✕
        </button>
        <button 
          onClick={() => handleSwipe('right')}
          className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-3xl hover:bg-emerald-50 text-emerald-500 transition-colors border border-emerald-100"
        >
          ❤️
        </button>
      </div>
    </div>
  );
}
