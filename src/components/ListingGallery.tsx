'use client';

import { useState } from 'react';

interface Props {
  images: string[];
  alt: string;
}

export function ListingGallery({ images, alt }: Props) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (!images || images.length === 0) return null;

  const main = images[Math.min(active, images.length - 1)];

  return (
    <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setLightbox(true)}
        className="block w-full aspect-[16/9] bg-slate-100"
        aria-label="Open photo"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={main} alt={alt} className="w-full h-full object-cover" />
      </button>
      {images.length > 1 && (
        <div className="flex gap-2 p-2 overflow-x-auto">
          {images.map((url, i) => (
            <button
              type="button"
              key={url + i}
              onClick={() => setActive(i)}
              className={[
                'shrink-0 w-16 h-16 rounded-md overflow-hidden border-2',
                i === active ? 'border-[color:var(--brand)]' : 'border-transparent',
              ].join(' ')}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox(false)}
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6"
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 text-white text-2xl"
            aria-label="Close"
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={main}
            alt={alt}
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
}
