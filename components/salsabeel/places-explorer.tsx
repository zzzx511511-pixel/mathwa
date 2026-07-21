"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Place, Region } from "@/lib/salsabeel/types";
import { matchesQuery, expandQuery } from "@/lib/salsabeel/search";
import { PlaceCard } from "./place-card";

const REGIONS: { label: string; value: Region | "all" }[] = [
  { label: "الكل", value: "all" },
  { label: "شمال", value: "شمال" },
  { label: "جنوب", value: "جنوب" },
  { label: "شرق", value: "شرق" },
  { label: "غرب", value: "غرب" },
  { label: "وسط", value: "وسط" },
];

export function PlacesExplorer({ allPlaces, statuses = {} }: { allPlaces: Place[]; statuses?: Record<string, string> }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialRegion = (searchParams.get("region") as Region | null) ?? "all";
  const initialQuery  = searchParams.get("q") ?? "";

  const [search, setSearch] = useState(initialQuery);
  const [region, setRegion] = useState<Region | "all">(initialRegion);
  const [period, setPeriod] = useState<"all" | "28d">("all");
  const [expandedTerms, setExpandedTerms] = useState<string[]>([]);
  const [aiSearching, setAiSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const q = search.trim();
    if (!q) { setExpandedTerms([]); setAiSearching(false); return; }
    setAiSearching(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const terms = await expandQuery(q);
      setExpandedTerms(terms);
      setAiSearching(false);
    }, 700);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  function handleRegionChange(v: Region | "all") {
    setRegion(v);
    const params = new URLSearchParams();
    if (v !== "all") params.set("region", v);
    router.replace(`/places${params.toString() ? "?" + params : ""}`, { scroll: false });
  }

  const filtered = useMemo(() => {
    return allPlaces.filter((p) => {
      const matchSearch = matchesQuery(p, search.trim(), expandedTerms);
      const matchRegion = region === "all" || p.region === region;
      return matchSearch && matchRegion;
    });
  }, [allPlaces, search, expandedTerms, region]);

  const topRated = useMemo(
    () => [...filtered].sort((a, b) => b.rating - a.rating).slice(0, 6),
    [filtered]
  );

  const mostVisited = useMemo(() => {
    const sorted = [...filtered].sort((a, b) =>
      period === "28d"
        ? (b.visits28d ?? b.visits) - (a.visits28d ?? a.visits)
        : b.visits - a.visits
    );
    return sorted.slice(0, 6);
  }, [filtered, period]);

  const GRAD = "linear-gradient(135deg, #FF8A6A 0%, #FF6B4A 55%, #E05030 100%)";

  return (
    <div className="space-y-14">

      {/* ── Search + Region Filter ─────────────────────── */}
      <div className="rounded-3xl border border-sal-100 bg-white p-6 shadow-sm space-y-4">
        {/* Search */}
        <div className="relative">
          <svg
            className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sal-400"
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن مكان، تصنيف، أو وسم..."
            className="w-full rounded-2xl border border-sal-100 bg-sal-50 py-3 pr-12 pl-4 text-sm text-ink-900 outline-none focus:border-sal-400 focus:bg-white transition"
            style={{ direction: "rtl" }}
          />
          {search && (
            <button
              onClick={() => { setSearch(""); setExpandedTerms([]); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
            >
              ✕
            </button>
          )}
          {search && (
            <span className="absolute left-12 top-1/2 -translate-y-1/2 text-[10px] font-bold"
              style={{ color: aiSearching ? "#94a3b8" : "#0F5C56" }}>
              {aiSearching ? "..." : "✦ AI"}
            </span>
          )}
        </div>

        {/* Region buttons */}
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((r) => (
            <button
              key={r.value}
              onClick={() => handleRegionChange(r.value)}
              className="rounded-xl px-4 py-1.5 text-sm font-bold transition"
              style={
                region === r.value
                  ? { background: GRAD, color: "#fff" }
                  : { background: "#FAF7F2", color: "#0F5C56", border: "1px solid #bae6fd" }
              }
            >
              {r.value === "all" ? "🗺 الكل" : r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Top Rated ─────────────────────────────────── */}
      <section>
        <div className="mb-6">
          <p className="mb-1 text-sm font-bold uppercase tracking-widest" style={{ color: "#0F5C56" }}>
            الأعلى تقييماً
          </p>
          <h2 className="text-2xl font-black text-ink-900">⭐ الأماكن الأكثر إعجاباً</h2>
        </div>
        {topRated.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {topRated.map((place) => <PlaceCard key={place.id} place={place} status={statuses[place.id]} />)}
          </div>
        ) : (
          <p className="rounded-2xl border border-sal-100 bg-white py-10 text-center text-sm text-ink-600">
            لا توجد نتائج تطابق بحثك
          </p>
        )}
      </section>

      {/* ── Most Visited ──────────────────────────────── */}
      <section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-1 text-sm font-bold uppercase tracking-widest" style={{ color: "#0F5C56" }}>
              الأكثر زيارة
            </p>
            <h2 className="text-2xl font-black text-ink-900">🔥 الوجهات التي لا يفوتها أحد</h2>
          </div>
          {/* 28-day toggle */}
          <div
            className="flex overflow-hidden rounded-xl border"
            style={{ borderColor: "#C4E8E5" }}
          >
            <button
              onClick={() => setPeriod("all")}
              className="px-4 py-1.5 text-xs font-bold transition"
              style={
                period === "all"
                  ? { background: GRAD, color: "#fff" }
                  : { background: "#FAF7F2", color: "#0F5C56" }
              }
            >
              كل الوقت
            </button>
            <button
              onClick={() => setPeriod("28d")}
              className="px-4 py-1.5 text-xs font-bold transition"
              style={
                period === "28d"
                  ? { background: GRAD, color: "#fff" }
                  : { background: "#FAF7F2", color: "#0F5C56" }
              }
            >
              خلال 28 يوم
            </button>
          </div>
        </div>
        {mostVisited.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {mostVisited.map((place) => <PlaceCard key={place.id} place={place} status={statuses[place.id]} />)}
          </div>
        ) : (
          <p className="rounded-2xl border border-sal-100 bg-white py-10 text-center text-sm text-ink-600">
            لا توجد نتائج تطابق بحثك
          </p>
        )}
      </section>
    </div>
  );
}
