'use client';

import { useState } from 'react';

interface Props {
  title: string;
  text: string;
  url: string;
}

export function ShareButton({ title, text, url }: Props) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
      } catch (err) {
        // user cancelled or failed, fallback to copy
        fallbackCopy();
      }
    } else {
      fallbackCopy();
    }
  };

  const fallbackCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`${title} - ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`block w-full text-center font-semibold py-2.5 rounded-md text-sm transition-colors ${
        copied 
          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
      }`}
    >
      {copied ? '✅ Link Copied!' : '↗ Share Listing'}
    </button>
  );
}
