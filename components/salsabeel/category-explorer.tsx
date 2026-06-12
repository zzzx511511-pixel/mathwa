"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { Place } from "@/lib/salsabeel/types";
import type { CategoryMeta } from "@/lib/salsabeel/categories";
import { PlaceCard } from "./place-card";

const REGIONS = [
  { value: "all",  label: "🗺️ الكل" },
  { value: "شمال", label: "⬆️ شمال" },
  { value: "جنوب", label: "⬇️ جنوب" },
  { value: "شرق",  label: "➡️ شرق" },
  { value: "غرب",  label: "⬅️ غرب" },
  { value: "وسط",  label: "🎯 وسط" },
];

export function CategoryExplorer({
  places,
  cat,
}: {
  places: Place[];
  cat: CategoryMeta;
}) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const active       = searchParams.get("region") ?? "all";

  const filtered =
    active === "all" ? places : places.filter((p) => p.region === active);

  function setRegion(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete("region");
    else params.set("region", value);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="space-y-6">

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
            {filtered.length} {cat.label} في {active} الرياض
          </span>
        )}
      </div>

      {/* ── Places grid ── */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-sal-100 bg-white p-12 text-center">
          <p className="mb-3 text-4xl">{cat.icon}</p>
          <p className="font-semibold text-ink-700">
            لا توجد {cat.label} مضافة في {active} الرياض حتى الآن
          </p>
          <button
            onClick={() => setRegion("all")}
            className="mt-4 rounded-xl border border-sal-200 px-5 py-2 text-sm font-semibold text-sal-600 transition hover:bg-sal-50"
          >
            عرض كل المناطق
          </button>
        </div>
      )}
    </div>
  );
}
