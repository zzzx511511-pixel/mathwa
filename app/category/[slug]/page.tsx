import { notFound } from "next/navigation";
import Link from "next/link";
import { CATEGORIES, getCategoryMeta } from "@/lib/salsabeel/categories";
import { getByCategory } from "@/lib/salsabeel/data";
import { PlaceCard } from "@/components/salsabeel/place-card";
import type { Category } from "@/lib/salsabeel/types";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const cat = getCategoryMeta(params.slug as Category);
  if (!cat) notFound();

  const places = getByCategory(cat.slug);

  return (
    <div className="space-y-8">

      {/* Header */}
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
              {places.length} مكان متاح {cat.count > places.length ? `(من أصل +${cat.count})` : ""}
            </p>
          )}
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-xl bg-white/70 px-4 py-2 text-sm font-semibold hover:bg-white transition"
          style={{ color: cat.color }}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          الرئيسية
        </Link>
      </div>

      {/* Places grid */}
      {places.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {places.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-sal-100 bg-white p-12 text-center">
          <p className="text-4xl mb-3">{cat.icon}</p>
          <p className="font-semibold text-ink-700">لا توجد أماكن مضافة في هذا التصنيف بعد</p>
          <Link
            href="/admin"
            className="mt-4 inline-block rounded-xl bg-sal-600 px-5 py-2 text-sm font-bold text-white hover:bg-sal-700"
          >
            أضف المكان الأول
          </Link>
        </div>
      )}

      {/* Other categories */}
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
