"use client";

import { useState, useRef, useEffect } from "react";

type OsmResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

// Trims the verbose Nominatim display_name to the first 2 meaningful parts
function shortName(full: string): string {
  const parts = full.split(", ").slice(0, 3);
  return parts.join("، ");
}

function toMapsUrl(lat: string, lon: string) {
  return `https://www.google.com/maps?q=${lat},${lon}`;
}

export function LocationPicker({
  value,
  onSelect,
  searchHint = "",
}: {
  value?: string;
  onSelect: (mapsUrl: string) => void;
  searchHint?: string;
}) {
  const [query, setQuery]     = useState(searchHint);
  const [results, setResults] = useState<OsmResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function search(q: string) {
    clearTimeout(timer.current);
    if (q.trim().length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        // Nominatim usage policy: 1 req/sec, include app info in header
        const url = new URL("https://nominatim.openstreetmap.org/search");
        url.searchParams.set("q", `${q} الرياض`);
        url.searchParams.set("format", "json");
        url.searchParams.set("limit", "6");
        url.searchParams.set("countrycodes", "sa");
        url.searchParams.set("accept-language", "ar");
        const res = await fetch(url.toString(), {
          headers: { "Accept-Language": "ar" },
        });
        const data: OsmResult[] = await res.json();
        setResults(data);
        setOpen(data.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);
  }

  function pick(r: OsmResult) {
    const url = toMapsUrl(r.lat, r.lon);
    onSelect(url);
    setQuery(shortName(r.display_name));
    setOpen(false);
    setResults([]);
  }

  function clear() {
    onSelect("");
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative">
      <label className="mb-1 block text-xs font-semibold text-ink-700">
        📍 موقع المنشأة على الخريطة
      </label>

      {/* Search input */}
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); search(e.target.value); }}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="ابحث باسم المنشأة (سيُضاف الرياض تلقائياً)..."
            className="w-full rounded-xl border border-sal-300 bg-white py-2 pr-9 pl-3 text-sm focus:border-sal-500 focus:outline-none transition"
            style={{ direction: "rtl" }}
          />
          {loading && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-sal-400 border-t-transparent" />
          )}
        </div>
        {value && (
          <button
            type="button"
            onClick={clear}
            className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100 transition"
          >
            مسح
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-sal-200 bg-white shadow-xl">
          {results.map((r) => (
            <li key={r.place_id}>
              <button
                type="button"
                onClick={() => pick(r)}
                className="flex w-full items-start gap-3 px-4 py-3 text-right text-sm hover:bg-sal-50 transition"
              >
                <span className="mt-0.5 shrink-0 text-base">📍</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink-900">{shortName(r.display_name)}</p>
                  <p className="text-[11px] text-ink-500" dir="ltr">
                    {parseFloat(r.lat).toFixed(5)}, {parseFloat(r.lon).toFixed(5)}
                  </p>
                </div>
                <span className="shrink-0 rounded-lg bg-sal-100 px-2 py-0.5 text-[11px] font-bold text-sal-700">
                  اختر
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Selected value */}
      {value && (
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2">
          <span className="text-green-600">✓</span>
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 truncate text-xs text-green-700 hover:underline"
            dir="ltr"
          >
            {value}
          </a>
          <span className="shrink-0 rounded-full bg-green-200 px-2 py-0.5 text-[10px] font-bold text-green-800">
            تم الحفظ
          </span>
        </div>
      )}
    </div>
  );
}
