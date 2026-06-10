import Link from "next/link";
import type { Place } from "@/lib/salsabeel/types";
import { getCategoryMeta } from "@/lib/salsabeel/categories";
import { RatingStars } from "./rating-stars";

function formatVisits(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return n.toString();
}

export function PlaceCard({ place }: { place: Place }) {
  const cat = getCategoryMeta(place.category);
  return (
    <Link
      href={`/places/${place.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-sal-100 bg-white shadow-sm transition hover:shadow-md hover:-translate-y-0.5"
    >
      {/* Gradient image placeholder */}
      <div
        className={`relative h-36 bg-gradient-to-br ${place.gradient} flex items-end p-3`}
      >
        {place.isWomenOnly && (
          <span className="absolute right-2 top-2 rounded-full bg-pink-600 px-2 py-0.5 text-[10px] font-bold text-white">
            نسائية فقط
          </span>
        )}
        <div className="flex items-center gap-1.5">
          {cat && (
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ background: cat.bg, color: cat.color }}
            >
              {cat.label}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-bold text-ink-900 group-hover:text-sal-700 transition-colors">
          {place.name}
        </h3>

        <div className="flex items-center justify-between">
          <RatingStars rating={place.rating} />
          <span className="flex items-center gap-1 text-[11px] text-ink-600">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z" />
            </svg>
            {formatVisits(place.visits)} زيارة
          </span>
        </div>

        <p className="line-clamp-2 text-xs text-ink-600 leading-relaxed">{place.description}</p>

        <div className="mt-auto flex flex-wrap gap-1 pt-1">
          {place.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-md bg-sal-50 px-2 py-0.5 text-[10px] font-medium text-sal-700">
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-sal-600 font-medium">
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
