import { Suspense } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/salsabeel/categories";
import { mergePlaces } from "@/lib/salsabeel/data";
import { getCustomPlaces } from "@/lib/salsabeel/supabase-places";
import { PlacesExplorer } from "@/components/salsabeel/places-explorer";

export const dynamic = "force-dynamic";

const GRAD = "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 55%, #0369a1 100%)";
const GLOW = "rgba(56,189,248,0.3)";

export default async function PlacesPage() {
  const custom = await getCustomPlaces();
  const allPlaces = mergePlaces(custom);

  return (
    <div className="min-h-screen" style={{ background: "#f0f9ff" }}>

      {/* ── Page Header ─────────────────────────────────── */}
      <div
        className="px-5 py-16 text-center"
        style={{ background: "linear-gradient(160deg, #082f49 0%, #0369a1 60%, #0ea5e9 100%)" }}
      >
        <div className="mx-auto max-w-screen-xl">
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-bold"
            style={{ background: "rgba(56,189,248,0.12)", borderColor: "rgba(56,189,248,0.3)", color: "#38bdf8" }}
          >
            ✦ استكشف الأماكن
          </div>
          <h1 className="text-4xl font-black text-white md:text-5xl">
            كل ما تحتاجه في مكان واحد
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-base text-white/60">
            ابحث عن أي مكان أو فلتر حسب المنطقة
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-screen-xl space-y-16 px-5 py-12">

        {/* ── Categories ──────────────────────────────── */}
        <section id="categories">
          <div className="mb-8">
            <p className="mb-2 text-sm font-bold uppercase tracking-widest" style={{ color: "#0ea5e9" }}>
              التصنيفات
            </p>
            <h2 className="text-3xl font-black text-ink-900">تصفح حسب التصنيف</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="group relative overflow-hidden rounded-3xl border p-6 text-center transition hover:-translate-y-1 hover:shadow-xl"
                style={{ background: "#fff", borderColor: "#e0f2fe" }}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute right-0 top-0 h-16 w-16 rounded-bl-[64px]"
                  style={{ background: GRAD, opacity: 0.07 }}
                />
                {cat.badge && (
                  <span
                    className="mb-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                    style={{ background: cat.color }}
                  >
                    {cat.badge}
                  </span>
                )}
                <span className="mb-3 block text-4xl">{cat.icon}</span>
                <p className="text-base font-black text-ink-900">{cat.label}</p>
                {cat.count > 0 && (
                  <p className="mt-0.5 text-xs font-bold" style={{ color: "#0ea5e9" }}>
                    +{cat.count}
                  </p>
                )}
                <p className="mt-1 text-xs leading-relaxed text-ink-600 line-clamp-2">
                  {cat.count > 0 ? `${cat.count}+ مكان مُقيَّم` : "قريباً"}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Interactive Explorer (search + region + places) ── */}
        <Suspense fallback={<div className="py-10 text-center text-sm text-ink-600">جاري التحميل...</div>}>
          <PlacesExplorer allPlaces={allPlaces} />
        </Suspense>

        {/* ── Quick Links ──────────────────────────────── */}
        <section>
          <div className="rounded-3xl p-8 text-center text-white" style={{ background: GRAD, boxShadow: `0 20px 60px ${GLOW}` }}>
            <h3 className="text-2xl font-black">اكتشف المزيد</h3>
            <p className="mt-2 text-white/80 text-sm">تصفح الأماكن حسب التصنيف</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  className="rounded-2xl border border-white/30 bg-white/15 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/25"
                >
                  {cat.icon} {cat.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
