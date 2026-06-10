import { notFound } from "next/navigation";
import Link from "next/link";
import { getPlaceById, PLACES } from "@/lib/salsabeel/data";
import { getCategoryMeta } from "@/lib/salsabeel/categories";
import { RatingStars } from "@/components/salsabeel/rating-stars";
import { BranchPanel } from "@/components/salsabeel/branch-panel";

export function generateStaticParams() {
  return PLACES.map((p) => ({ id: p.id }));
}

function formatVisits(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return n.toString();
}

export default function PlaceDetailPage({ params }: { params: { id: string } }) {
  const place = getPlaceById(params.id);
  if (!place) notFound();

  const cat = getCategoryMeta(place.category);

  return (
    <div className="mx-auto max-w-3xl space-y-8">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-ink-600">
        <Link href="/" className="hover:text-sal-600">الرئيسية</Link>
        <span>/</span>
        {cat && (
          <>
            <Link href={`/category/${cat.slug}`} className="hover:text-sal-600">{cat.label}</Link>
            <span>/</span>
          </>
        )}
        <span className="text-ink-900 font-medium">{place.name}</span>
      </nav>

      {/* Hero */}
      <div
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${place.gradient} h-56 md:h-72 flex items-end p-6`}
      >
        {place.isWomenOnly && (
          <span className="absolute right-4 top-4 rounded-full bg-pink-600 px-3 py-1 text-sm font-bold text-white shadow">
            💇‍♀️ نسائية فقط
          </span>
        )}
        <div className="flex flex-wrap items-center gap-3">
          {cat && (
            <span
              className="rounded-full px-3 py-1 text-sm font-bold shadow"
              style={{ background: cat.bg, color: cat.color }}
            >
              {cat.icon} {cat.label}
            </span>
          )}
          <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-semibold text-white backdrop-blur">
            {place.branches.length} {place.branches.length === 1 ? "فرع" : "فروع"}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-2xl border border-sal-100 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-extrabold text-ink-900">{place.name}</h1>

        <div className="mt-3 flex flex-wrap items-center gap-4">
          <RatingStars rating={place.rating} />
          <span className="flex items-center gap-1.5 text-sm text-ink-600">
            <svg className="h-4 w-4 text-sal-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            {formatVisits(place.visits)} زيارة
          </span>
        </div>

        <p className="mt-4 leading-relaxed text-ink-700">{place.description}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {place.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-lg bg-sal-50 px-3 py-1 text-sm font-medium text-sal-700"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Branches */}
      <div className="rounded-2xl border border-sal-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-extrabold text-ink-900">
          📍 فروع {place.name}
        </h2>
        <p className="mb-4 text-sm text-ink-600">
          اضغط على الفرع لعرض عنوانه وتفاصيله
        </p>
        <BranchPanel branches={place.branches} />
      </div>

      {/* Back */}
      <div className="text-center">
        {cat && (
          <Link
            href={`/category/${cat.slug}`}
            className="inline-flex items-center gap-2 rounded-xl border border-sal-200 bg-white px-6 py-2.5 text-sm font-semibold text-sal-700 hover:bg-sal-50 transition"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            عودة لـ {cat.label}
          </Link>
        )}
      </div>
    </div>
  );
}
