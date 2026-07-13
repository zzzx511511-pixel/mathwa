"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { Place } from "@/lib/salsabeel/types";
import { getCategoryMeta } from "@/lib/salsabeel/categories";
import { RatingStars } from "./rating-stars";
import { PlaceImage } from "./place-image";

function fmt(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return n.toString();
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  if (status === "CLOSED_PERMANENTLY")
    return (
      <span className="absolute top-2 right-2 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow">
        🔴 مغلق نهائيًا
      </span>
    );
  if (status === "CLOSED_TEMPORARILY")
    return (
      <span className="absolute top-2 right-2 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-extrabold text-white shadow">
        🟠 مغلق مؤقتًا
      </span>
    );
  if (status === "OPERATIONAL")
    return (
      <span className="absolute top-2 right-2 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-extrabold text-white shadow">
        🟢 مفتوح
      </span>
    );
  return null;
}

export function PlaceCard({ place, status }: { place: Place; status?: string }) {
  const cat = getCategoryMeta(place.category);
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [igPhoto, setIgPhoto] = useState<string | null>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const controller = new AbortController();

    const doFetch = () => {
      const nbh = place.neighborhood ?? place.branches[0]?.neighborhood;
      const url =
        `/api/place-photos/${encodeURIComponent(place.id)}` +
        `?name=${encodeURIComponent(place.name)}` +
        (nbh ? `&nbh=${encodeURIComponent(nbh)}` : "") +
        (place.googlePlaceId ? `&gid=${encodeURIComponent(place.googlePlaceId)}` : "");
      fetch(url, { signal: controller.signal })
        .then((r) => r.json())
        .then((data: { photos: string[] }) => {
          if (data.photos?.[0]) setIgPhoto(data.photos[0]);
        })
        .catch(() => {});
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          doFetch();
        }
      },
      { threshold: 0, rootMargin: "150px" }
    );
    observer.observe(el);

    return () => {
      controller.abort();
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place.id]);

  return (
    <Link
      ref={cardRef}
      href={`/places/${place.id}`}
      onClick={() => {
        try {
          sessionStorage.setItem("sal_back_url", window.location.href);
          sessionStorage.setItem("sal_back_scroll", String(Math.round(window.scrollY)));
        } catch { /* ignore private/incognito */ }
      }}
      className="group flex flex-col overflow-hidden rounded-3xl transition hover:-translate-y-1 hover:shadow-xl"
      style={{ border: "1px solid #e0f2fe", background: "#fff" }}
    >
      {/* Hero image */}
      <div className="relative h-36 overflow-hidden">
        {igPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={igPhoto}
            alt={place.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <PlaceImage
            photos={place.photos}
            category={place.category}
            name={place.name}
            className="h-full w-full"
          />
        )}
        <StatusBadge status={status} />
        {cat && (
          <span
            className="absolute bottom-3 left-3 rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow"
            style={{ background: cat.bg, color: cat.color }}
          >
            {cat.icon} {cat.label}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3
          className="font-black text-ink-900 transition-colors group-hover:text-sal-500"
          style={{ fontFamily: "Tajawal, sans-serif" }}
        >
          {place.name}
        </h3>

        <div className="flex items-center justify-between">
          <RatingStars rating={place.rating} />
          <span className="flex items-center gap-1 text-[11px] text-ink-600">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            {fmt(place.visits)}
          </span>
        </div>

        <p className="line-clamp-2 text-xs leading-relaxed text-ink-600">{place.description}</p>

        <div className="mt-auto flex flex-wrap gap-1 pt-1">
          {place.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-lg bg-sal-50 px-2 py-0.5 text-[10px] font-medium text-sal-700">
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-sal-500">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          {place.branches.length} {place.branches.length === 1 ? "فرع" : "فروع"}
        </div>
      </div>
    </Link>
  );
}
