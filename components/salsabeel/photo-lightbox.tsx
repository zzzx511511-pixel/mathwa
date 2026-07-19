"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Props {
  photos: string[];
  altPrefix: string;
}

export function PhotoLightbox({ photos, altPrefix }: Props) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  // Touch-swipe state
  const touchStartX = useRef<number | null>(null);

  const prev = useCallback(() => setIndex((i) => (i - 1 + photos.length) % photos.length), [photos.length]);
  const next = useCallback(() => setIndex((i) => (i + 1) % photos.length), [photos.length]);
  const close = useCallback(() => setOpen(false), []);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, prev, next, close]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const openAt = (i: number) => {
    setIndex(i);
    setOpen(true);
  };

  if (!photos.length) return null;

  return (
    <>
      {/* Thumbnail grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((photo, i) => (
          <button
            key={i}
            type="button"
            onClick={() => openAt(i)}
            className="group relative aspect-square w-full overflow-hidden rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-sal-400"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt={`${altPrefix} - صورة ${i + 1}`}
              className="h-full w-full object-cover transition group-hover:opacity-90 group-hover:scale-105 duration-200"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/20">
              <svg className="h-8 w-8 text-white drop-shadow" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={close}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={close}
            aria-label="إغلاق"
            className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur hover:bg-white/30 transition"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Counter */}
          {photos.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-1 text-sm font-bold text-white backdrop-blur">
              {index + 1} / {photos.length}
            </div>
          )}

          {/* Image container — stop propagation so clicks on image don't close */}
          <div
            className="relative flex max-h-[90dvh] max-w-[92vw] items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              if (touchStartX.current === null) return;
              const dx = e.changedTouches[0].clientX - touchStartX.current;
              touchStartX.current = null;
              if (Math.abs(dx) < 40) return;
              dx < 0 ? next() : prev();
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[index]}
              alt={`${altPrefix} - صورة ${index + 1}`}
              className="max-h-[90dvh] max-w-[92vw] rounded-2xl object-contain shadow-2xl"
              draggable={false}
            />
          </div>

          {/* Prev / Next arrows */}
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                aria-label="السابق"
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur hover:bg-white/35 transition"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next(); }}
                aria-label="التالي"
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur hover:bg-white/35 transition"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15 19-7-7 7-7" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
