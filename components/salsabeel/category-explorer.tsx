"use client";

import { useState, useMemo, lazy, Suspense, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { Place } from "@/lib/salsabeel/types";
import { CLINIC_SPECS } from "@/lib/salsabeel/types";
import type { CategoryMeta } from "@/lib/salsabeel/categories";
import { PlaceCard } from "./place-card";

const CategoryMapView = lazy(() =>
  import("./category-map-view").then((m) => ({ default: m.CategoryMapView }))
);

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

// Region centers kept only for the map view — NOT used for distance sorting.
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
  statuses = {},
}: {
  places: Place[];
  cat: CategoryMeta;
  visitCounts?: Record<string, number>;
  statuses?: Record<string, string>;
}) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const active       = searchParams.get("region") ?? "all";
  const [search, setSearch]       = useState("");
  const [spec, setSpec]           = useState("all");
  const [sort, setSort]           = useState<SortMode>("default");
  const [view, setView]           = useState<"cards" | "map">("cards");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoState, setGeoState]   = useState<"idle" | "loading" | "error">("idle");
  const [geoError, setGeoError]   = useState<string>("");

  // Persist sort+coords to sessionStorage so back-navigation can restore them
  useEffect(() => {
    try {
      sessionStorage.setItem("sal_sort", sort);
      if (userCoords) sessionStorage.setItem("sal_coords", JSON.stringify(userCoords));
    } catch { /* ignore */ }
  }, [sort, userCoords]);

  // Restore scroll position AND sort state when returning from a place detail page
  useEffect(() => {
    try {
      const savedUrl    = sessionStorage.getItem("sal_back_url");
      const savedScroll = sessionStorage.getItem("sal_back_scroll");
      if (savedUrl === window.location.href && savedScroll) {
        sessionStorage.removeItem("sal_back_url");
        sessionStorage.removeItem("sal_back_scroll");
        const y = parseInt(savedScroll, 10);
        if (y > 0) requestAnimationFrame(() => window.scrollTo({ top: y, behavior: "instant" }));

        const savedSort   = sessionStorage.getItem("sal_sort") as SortMode | null;
        const savedCoords = sessionStorage.getItem("sal_coords");
        if (savedSort && savedSort !== "default") {
          setSort(savedSort);
          if (savedSort === "nearest" && savedCoords) {
            setUserCoords(JSON.parse(savedCoords));
          }
        }
      }
    } catch { /* ignore */ }
  }, []);

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
      // Helper: best available coords — place-level first, then first branch with GPS.
      function bestCoords(p: Place): { lat: number; lng: number } | null {
        if (p.lat != null && p.lng != null) return { lat: p.lat, lng: p.lng };
        const b = p.branches.find((br) => br.lat != null && br.lng != null);
        return b ? { lat: b.lat!, lng: b.lng! } : null;
      }
      return [...filtered].sort((a, b) => {
        const ca = bestCoords(a);
        const cb = bestCoords(b);
        const distA = ca ? haversineKm(userCoords.lat, userCoords.lng, ca.lat, ca.lng) : Infinity;
        const distB = cb ? haversineKm(userCoords.lat, userCoords.lng, cb.lat, cb.lng) : Infinity;
        return distA - distB;
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

  const GRAD = "linear-gradient(135deg, #FF8A6A 0%, #FF6B4A 55%, #E05030 100%)";

  function sortBtn(mode: SortMode, label: string, onClick?: () => void) {
    const isActive = sort === mode;
    return (
      <button
        onClick={onClick ?? (() => setSort(isActive ? "default" : mode))}
        className="flex items-center gap-1.5 rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all hover:-translate-y-0.5"
        style={
          isActive
            ? { background: GRAD, borderColor: "transparent", color: "#fff" }
            : { background: "#FAF7F2", borderColor: "#C4E8E5", color: "#0F5C56" }
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

      {/* ── Sort row + View toggle ── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-ink-500 ml-1">ترتيب:</span>
        {view === "cards" && (
          <>
            {sortBtn("visits", "🔥 الأكثر زيارة (28 يوم)")}
            <button
              onClick={handleNearestClick}
              disabled={geoState === "loading"}
              className="flex items-center gap-1.5 rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-wait"
              style={
                sort === "nearest"
                  ? { background: GRAD, borderColor: "transparent", color: "#fff" }
                  : { background: "#FAF7F2", borderColor: "#C4E8E5", color: "#0F5C56" }
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
          </>
        )}
        {geoState === "error" && (
          <p className="text-xs text-red-500 font-medium">{geoError}</p>
        )}

        {/* View toggle */}
        <div className="mr-auto flex rounded-xl border-2 border-sal-100 overflow-hidden">
          <button
            onClick={() => setView("cards")}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold transition-colors"
            style={
              view === "cards"
                ? { background: cat.color, color: "#fff" }
                : { background: "#FAF7F2", color: "#0F5C56" }
            }
            title="عرض البطاقات"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
            بطاقات
          </button>
          <button
            onClick={() => setView("map")}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold transition-colors"
            style={
              view === "map"
                ? { background: cat.color, color: "#fff" }
                : { background: "#FAF7F2", color: "#0F5C56" }
            }
            title="عرض الخريطة"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
            </svg>
            خريطة
          </button>
        </div>
      </div>

      {/* ── Clinic specialization filter (clinics only — 4 visible specs) ── */}
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
                : { background: "#FAF7F2", borderColor: "#C4E8E5", color: "#0F5C56" }
            }
          >
            🏥 جميع التخصصات
          </button>
          {CLINIC_SPECS.filter((s) =>
            ["أسنان", "تجميل", "علاج طبيعي", "جلدية"].includes(s.value)
          ).map((s) => {
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
                    : { background: "#FAF7F2", borderColor: "#C4E8E5", color: "#0F5C56" }
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
                  : { background: "#FAF7F2", borderColor: "#C4E8E5", color: "#0F5C56" }
              }
            >
              {r.label}
              {r.value !== "all" && count > 0 && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-black leading-none"
                  style={
                    isActive
                      ? { background: cat.color + "22", color: cat.color }
                      : { background: "#C4E8E5", color: "#0F5C56" }
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

      {/* ── Map view ── */}
      {view === "map" && (
        <Suspense
          fallback={
            <div className="flex h-64 items-center justify-center rounded-2xl border border-sal-100 bg-sal-50">
              <p className="text-sm font-semibold text-ink-500">⏳ جارٍ تحميل الخريطة...</p>
            </div>
          }
        >
          <CategoryMapView places={displayed} cat={cat} />
        </Suspense>
      )}

      {/* ── Nearest note ── */}
      {view === "cards" && sort === "nearest" && (() => {
        const withCoords  = displayed.filter((p) => p.lat != null && p.lng != null).length;
        const withoutCoords = displayed.length - withCoords;
        if (withoutCoords === 0) return null;
        return (
          <p className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
            📍 {withCoords > 0
              ? `${withCoords} منشأة لديها إحداثيات دقيقة وتظهر أولاً — ${withoutCoords} منشأة بدون إحداثيات مسجّلة وتظهر في النهاية`
              : `لا توجد إحداثيات دقيقة لأي منشأة حالياً — يمكن إضافتها من لوحة التحكم`}
          </p>
        );
      })()}

      {/* ── Cards grid ── */}
      {view === "cards" && (
        displayed.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayed.map((place) => (
              <PlaceCard key={place.id} place={place} status={statuses[place.id]} />
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
        )
      )}
    </div>
  );
}
