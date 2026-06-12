"use client";

import Link from "next/link";
import { useState } from "react";
import type { Branch } from "@/lib/salsabeel/types";

export function BranchPanel({
  branches,
  placeId,
  placeName,
}: {
  branches: Branch[];
  placeId: string;
  placeName: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const active = branches.find((b) => b.id === selected);

  function mapsHref(branch: Branch) {
    if (branch.mapsUrl) return branch.mapsUrl;
    return `https://maps.google.com/?q=${encodeURIComponent(
      placeName + " " + branch.name + " " + branch.address + "، الرياض"
    )}`;
  }

  return (
    <div className="space-y-4">
      {/* Branch buttons */}
      <div className="flex flex-wrap gap-2">
        {branches.map((branch) => (
          <button
            key={branch.id}
            onClick={() => setSelected(selected === branch.id ? null : branch.id)}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition
              ${
                selected === branch.id
                  ? "border-sal-600 bg-sal-600 text-white shadow"
                  : "border-sal-200 bg-white text-sal-700 hover:border-sal-400 hover:bg-sal-50"
              }`}
          >
            📍 {branch.name}
          </button>
        ))}
      </div>

      {/* Branch details */}
      {active && (
        <div className="rounded-2xl border border-sal-100 bg-sal-50 p-5 space-y-3 animate-in fade-in duration-200">
          <h4 className="font-bold text-sal-900 text-base">{active.name}</h4>

          <div className="space-y-2 text-sm text-ink-700">
            <div className="flex items-start gap-2">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-sal-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              <span>{active.address}، {active.city}</span>
            </div>

            {active.phone && (
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0 text-sal-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.338c0 9.175 7.337 16.512 16.512 16.512.55 0 1.096-.027 1.638-.079a1.5 1.5 0 0 0 1.35-1.494v-2.764a1.5 1.5 0 0 0-1.126-1.45l-3.129-.782a1.5 1.5 0 0 0-1.636.706l-.656 1.09a1.125 1.125 0 0 1-1.304.436c-1.64-.581-4.264-2.625-5.81-5.81a1.125 1.125 0 0 1 .436-1.304l1.09-.656a1.5 1.5 0 0 0 .706-1.636l-.782-3.129A1.5 1.5 0 0 0 8.36 2.25H5.596a1.5 1.5 0 0 0-1.494 1.338 16.53 16.53 0 0 0-.852 4.75Z" />
                </svg>
                <a href={`tel:${active.phone}`} className="font-medium text-sal-700 hover:underline">
                  {active.phone}
                </a>
              </div>
            )}

            {active.openingHours && (
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0 text-sal-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span>{active.openingHours}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <a
              href={mapsHref(active)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-sal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sal-700 transition"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
              </svg>
              افتح الخريطة
            </a>
            <Link
              href={`/places/${placeId}/branches/${active.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-sal-200 bg-white px-4 py-2 text-sm font-semibold text-sal-700 hover:bg-sal-50 transition"
            >
              صفحة الفرع ←
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
