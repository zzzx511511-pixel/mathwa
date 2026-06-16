import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CATEGORIES, getCategoryMeta } from "@/lib/salsabeel/categories";
import { getByCategory, mergePlaces } from "@/lib/salsabeel/data";
import { getCustomPlaces, getVisitCounts28d } from "@/lib/salsabeel/supabase-places";
import { CategoryExplorer } from "@/components/salsabeel/category-explorer";
import type { Category } from "@/lib/salsabeel/types";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const cat = getCategoryMeta(params.slug as Category);
  if (!cat) notFound();

  const [custom, visitCounts] = await Promise.all([getCustomPlaces(), getVisitCounts28d()]);
  const allPlaces = mergePlaces(custom);
  const places = allPlaces.filter((p) => {
    if (cat.slug === "cafes")
      return p.category === "cafes" || (p.isHybrid && p.category === "restaurants");
    if (cat.slug === "restaurants")
      return p.category === "restaurants" || (p.isHybrid && p.category === "cafes");
    return p.category === cat.slug;
  });

  return (
    <div className="mx-auto max-w-screen-xl space-y-8 px-5 py-10">

      {/* ── Header ── */}
      <div
        className="flex flex-col gap-4 rounded-2xl p-6 sm:flex-row sm:items-center"
        style={{ background: cat.bg }}
      >
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-4xl shadow"
          style={{ background: cat.color + "22" }}
        >
          {cat.icon}
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-extrabold" style={{ color: cat.color }}>
              {cat.label}
            </h1>
            {cat.badge && (
              <span
                className="rounded-full px-3 py-0.5 text-xs font-bold text-white"
                style={{ background: cat.color }}
              >
                {cat.badge}
              </span>
            )}
          </div>
          {cat.count > 0 && (
            <p className="mt-1 text-sm font-medium opacity-70" style={{ color: cat.color }}>
              {places.length} مكان متاح
              {cat.count > places.length ? ` (من أصل +${cat.count})` : ""}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/70 px-4 py-2 text-sm font-semibold transition hover:bg-white"
            style={{ color: cat.color }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            الرئيسية
          </Link>
          <Link
            href="/places"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/70 px-4 py-2 text-sm font-semibold transition hover:bg-white"
            style={{ color: cat.color }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            استكشف الأماكن
          </Link>
        </div>
      </div>

      {/* ── Category explorer with region filter ── */}
      <Suspense>
        <CategoryExplorer places={places} cat={cat} visitCounts={visitCounts} />
      </Suspense>

      {/* ── Other categories ── */}
      <div className="rounded-2xl border border-sal-100 bg-white p-5">
        <p className="mb-3 text-sm font-semibold text-ink-700">تصنيفات أخرى</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.filter((c) => c.slug !== cat.slug).map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-medium transition hover:shadow"
              style={{ borderColor: c.color + "40", color: c.color, background: c.bg }}
            >
              {c.icon} {c.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
