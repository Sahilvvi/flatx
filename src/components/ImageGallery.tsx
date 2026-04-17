'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Props {
  images: string[];
}

export function ImageGallery({ images }: Props) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  const handleOpen = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <>
      <div className="grid grid-cols-4 grid-rows-2 gap-2 mb-6 h-64 md:h-96 rounded-xl overflow-hidden cursor-pointer" onClick={() => handleOpen(0)}>
        <div className={`relative ${images.length > 1 ? 'col-span-2 row-span-2' : 'col-span-4 row-span-2'}`}>
          <Image
            src={images[0]}
            alt="Listing photo 1"
            fill
            className="object-cover hover:opacity-90 transition"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
        {images.slice(1, 5).map((img, idx) => (
          <div key={idx} className="relative col-span-1 row-span-1 hidden md:block">
            <Image
              src={img}
              alt={`Listing photo ${idx + 2}`}
              fill
              className="object-cover hover:opacity-90 transition"
              sizes="25vw"
            />
            {idx === 3 && images.length > 5 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold flex-col">
                <span className="text-xl">+{images.length - 5}</span>
                <span className="text-xs">More photos</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button 
            className="absolute top-4 right-4 text-white hover:text-slate-300 p-2 text-3xl font-light"
            onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
          >
            &times;
          </button>

          {images.length > 1 && (
            <button 
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-slate-300 p-4 text-3xl hidden md:block"
              onClick={prevImage}
            >
              &#10094;
            </button>
          )}

          <div className="relative w-full h-[80vh] max-w-5xl px-4 md:px-16" onClick={(e) => e.stopPropagation()}>
            <Image
              src={images[currentIndex]}
              alt={`Listing photo ${currentIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>

          {images.length > 1 && (
            <button 
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-slate-300 p-4 text-3xl hidden md:block"
              onClick={nextImage}
            >
              &#10095;
            </button>
          )}

          <div className="absolute bottom-4 left-0 right-0 text-center text-slate-300 text-sm font-medium">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
