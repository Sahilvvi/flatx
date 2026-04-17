'use client';

import { useState } from 'react';

interface Props {
  title: string;
  text: string;
  url: string;
  className?: string;
}

/**
 * Share button that uses the Web Share API on mobile and falls back to
 * clipboard copy on desktop.
 */
export function ShareButton({ title, text, url, className }: Props) {
  const [copied, setCopied] = useState(false);

  const fallbackCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(`${title} — ${url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* ignore */
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // user cancelled or the share sheet failed — fall through to copy
      }
    }
    await fallbackCopy();
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="Share this listing"
      className={
        className ??
        `block w-full text-center font-semibold py-2.5 rounded-md text-sm transition-colors border ${
          copied
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
        }`
      }
    >
      {copied ? 'Link copied!' : '↗ Share listing'}
    </button>
  );
}
