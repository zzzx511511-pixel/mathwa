"use client";

import { useState, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { Place } from "@/lib/salsabeel/types";
import { CLINIC_SPECS } from "@/lib/salsabeel/types";
import type { CategoryMeta } from "@/lib/salsabeel/categories";
import { PlaceCard } from "./place-card";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[ً-ٟ]/g, "");
}

const REGIONS = [
  { value: "all",  label: "🗺️ الكل" },
  { value: "شمال", label: "⬆️ شمال" },
  { value: "جنوب", label: "⬇️ جنوب" },
  { value: "شرق",  label: "➡️ شرق" },
  { value: "غرب",  label: "⬅️ غرب" },
  { value: "وسط",  label: "🎯 وسط" },
];

// Approximate center coordinates for each Riyadh region
const REGION_CENTERS: Record<string, { lat: number; lng: number }> = {
  "شمال": { lat: 24.80, lng: 46.65 },
  "جنوب": { lat: 24.57, lng: 46.72 },
  "شرق":  { lat: 24.67, lng: 46.80 },
  "غرب":  { lat: 24.67, lng: 46.60 },
  "وسط":  { lat: 24.69, lng: 46.69 },
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type SortMode = "default" | "visits" | "nearest";

export function CategoryExplorer({
  places,
  cat,
  visitCounts = {},
}: {
  places: Place[];
  cat: CategoryMeta;
  visitCounts?: Record<string, number>;
}) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const active       = searchParams.get("region") ?? "all";
  const [search, setSearch]       = useState("");
  const [spec, setSpec]           = useState("all");
  const [sort, setSort]           = useState<SortMode>("default");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoState, setGeoState]   = useState<"idle" | "loading" | "error">("idle");
  const [geoError, setGeoError]   = useState<string>("");

  const filtered = useMemo(() => {
    const byRegion = active === "all" ? places : places.filter((p) => p.region === active);
    const bySpec   = spec === "all"   ? byRegion : byRegion.filter((p) =>
      p.specialization?.includes(spec) || p.tags.includes(spec)
    );
    if (!search.trim()) return bySpec;
    const q = normalize(search.trim());
    return bySpec.filter((p) =>
      normalize(p.name).includes(q) ||
      normalize(p.description ?? "").includes(q) ||
      p.tags.some((t) => normalize(t).includes(q)) ||
      (p.keywords ?? []).some((k) => normalize(k).includes(q))
    );
  }, [places, active, search, spec]);

  const displayed = useMemo(() => {
    if (sort === "visits") {
      return [...filtered].sort(
        (a, b) =>
          (visitCounts[b.id] ?? b.visits28d ?? b.visits) -
          (visitCounts[a.id] ?? a.visits28d ?? a.visits)
      );
    }
    if (sort === "nearest" && userCoords) {
      return [...filtered].sort((a, b) => {
        const fallbackA = REGION_CENTERS[a.region ?? "وسط"] ?? REGION_CENTERS["وسط"];
        const fallbackB = REGION_CENTERS[b.region ?? "وسط"] ?? REGION_CENTERS["وسط"];
        const latA = a.lat ?? fallbackA.lat;
        const lngA = a.lng ?? fallbackA.lng;
        const latB = b.lat ?? fallbackB.lat;
        const lngB = b.lng ?? fallbackB.lng;
        return (
          haversineKm(userCoords.lat, userCoords.lng, latA, lngA) -
          haversineKm(userCoords.lat, userCoords.lng, latB, lngB)
        );
      });
    }
    return filtered;
  }, [filtered, sort, userCoords, visitCounts]);

  function setRegion(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete("region");
    else params.set("region", value);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function handleNearestClick() {
    if (sort === "nearest") { setSort("default"); return; }
    if (userCoords) { setSort("nearest"); return; }
    if (!navigator.geolocation) {
      setGeoError("متصفحك لا يدعم تحديد الموقع");
      setGeoState("error");
      return;
    }
    setGeoState("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSort("nearest");
        setGeoState("idle");
      },
      () => {
        setGeoError("تعذّر الوصول لموقعك — تأكد من إذن الموقع في المتصفح");
        setGeoState("error");
      },
      { timeout: 10000 }
    );
  }

  const GRAD = "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 55%, #0369a1 100%)";

  function sortBtn(mode: SortMode, label: string, onClick?: () => void) {
    const isActive = sort === mode;
    return (
      <button
        onClick={onClick ?? (() => setSort(isActive ? "default" : mode))}
        className="flex items-center gap-1.5 rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all hover:-translate-y-0.5"
        style={
          isActive
            ? { background: GRAD, borderColor: "transparent", color: "#fff" }
            : { background: "#f0f9ff", borderColor: "#e0f2fe", color: "#0c4a6e" }
        }
      >
        {label}
      </button>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Search bar ── */}
      <div className="relative">
        <svg
          className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400"
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`ابحث في ${cat.label}...`}
          className="w-full rounded-2xl border border-sal-100 bg-sal-50 py-3 pr-12 pl-10 text-sm text-ink-900 outline-none focus:border-sal-400 focus:bg-white transition"
          style={{ direction: "rtl" }}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 text-lg leading-none"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Sort row ── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-ink-500 ml-1">ترتيب:</span>
        {sortBtn("visits", "🔥 الأكثر زيارة (28 يوم)")}
        <button
          onClick={handleNearestClick}
          disabled={geoState === "loading"}
          className="flex items-center gap-1.5 rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-wait"
          style={
            sort === "nearest"
              ? { background: GRAD, borderColor: "transparent", color: "#fff" }
              : { background: "#f0f9ff", borderColor: "#e0f2fe", color: "#0c4a6e" }
          }
        >
          {geoState === "loading" ? "⏳ جارٍ تحديد موقعك..." : "📍 الأقرب إليك"}
        </button>
        {sort !== "default" && (
          <button
            onClick={() => setSort("default")}
            className="rounded-xl border-2 border-ink-100 bg-white px-3 py-2 text-xs font-bold text-ink-500 transition hover:bg-ink-50"
          >
            ✕ إلغاء
          </button>
        )}
        {geoState === "error" && (
          <p className="text-xs text-red-500 font-medium">{geoError}</p>
        )}
      </div>

      {/* ── Clinic specialization filter (clinics only) ── */}
      {cat.slug === "clinics" && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSpec("all")}
            className={[
              "rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all hover:-translate-y-0.5",
              spec === "all"
                ? "shadow-md"
                : "bg-white opacity-70 hover:opacity-100",
            ].join(" ")}
            style={
              spec === "all"
                ? { background: cat.bg, borderColor: cat.color, color: cat.color }
                : { background: "#f0f9ff", borderColor: "#e0f2fe", color: "#0c4a6e" }
            }
          >
            🏥 جميع التخصصات
          </button>
          {CLINIC_SPECS.map((s) => {
            const isActive = spec === s.value;
            return (
              <button
                key={s.value}
                onClick={() => setSpec(s.value)}
                className={[
                  "rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all hover:-translate-y-0.5",
                  isActive ? "shadow-md" : "bg-white opacity-70 hover:opacity-100",
                ].join(" ")}
                style={
                  isActive
                    ? { background: cat.bg, borderColor: cat.color, color: cat.color }
                    : { background: "#f0f9ff", borderColor: "#e0f2fe", color: "#0c4a6e" }
                }
              >
                {s.icon} {s.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Region filter strip ── */}
      <div className="flex flex-wrap items-center gap-2">
        {REGIONS.map((r) => {
          const isActive = active === r.value;
          const count    = r.value === "all"
            ? places.length
            : places.filter((p) => p.region === r.value).length;

          return (
            <button
              key={r.value}
              onClick={() => setRegion(r.value)}
              disabled={count === 0 && r.value !== "all"}
              className={[
                "flex items-center gap-1.5 rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all",
                isActive
                  ? "shadow-md -translate-y-0.5"
                  : "bg-white hover:-translate-y-0.5 disabled:opacity-30 disabled:cursor-not-allowed",
              ].join(" ")}
              style={
                isActive
                  ? { background: cat.bg, borderColor: cat.color, color: cat.color }
                  : { background: "#f0f9ff", borderColor: "#e0f2fe", color: "#0c4a6e" }
              }
            >
              {r.label}
              {r.value !== "all" && count > 0 && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-black leading-none"
                  style={
                    isActive
                      ? { background: cat.color + "22", color: cat.color }
                      : { background: "#e0f2fe", color: "#0369a1" }
                  }
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}

        {/* Count pill */}
        {active !== "all" && (
          <span className="mr-auto rounded-full bg-ink-50 px-3 py-1 text-xs font-semibold text-ink-500">
            {displayed.length} {cat.label} في {active} الرياض
          </span>
        )}
      </div>

      {/* ── Places grid ── */}
      {displayed.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayed.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-sal-100 bg-white p-12 text-center">
          <p className="mb-3 text-4xl">{cat.icon}</p>
          <p className="font-semibold text-ink-700">
            {search.trim()
              ? `لا توجد نتائج لـ "${search}" في ${active === "all" ? cat.label : `${active} الرياض`}`
              : `لا توجد ${cat.label} مضافة في ${active} الرياض حتى الآن`}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            {search && (
              <button
                onClick={() => setSearch("")}
                className="rounded-xl border border-sal-200 px-5 py-2 text-sm font-semibold text-sal-600 transition hover:bg-sal-50"
              >
                مسح البحث
              </button>
            )}
            {active !== "all" && (
              <button
                onClick={() => setRegion("all")}
                className="rounded-xl border border-sal-200 px-5 py-2 text-sm font-semibold text-sal-600 transition hover:bg-sal-50"
              >
                عرض كل المناطق
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
