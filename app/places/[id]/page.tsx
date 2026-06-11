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
  const mainBranch = place.branches[0];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-ink-600">
        <Link href="/places" className="hover:text-sal-600">استكشف</Link>
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
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${place.gradient} h-56 md:h-72 flex items-end p-6`}>
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

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {mainBranch?.mapsUrl && (
          <a
            href={mainBranch.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold text-white shadow transition hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 55%, #0369a1 100%)" }}
          >
            📍 الموقع
          </a>
        )}
        {!mainBranch?.mapsUrl && mainBranch?.address && (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(mainBranch.address + "، الرياض")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold text-white shadow transition hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 55%, #0369a1 100%)" }}
          >
            📍 الموقع
          </a>
        )}
        {mainBranch?.phone && (
          <a
            href={`tel:${mainBranch.phone}`}
            className="inline-flex items-center gap-2 rounded-2xl border border-sal-200 bg-white px-5 py-2.5 text-sm font-bold text-sal-700 shadow-sm transition hover:bg-sal-50"
          >
            📞 اتصل
          </a>
        )}
        {place.instagramUrl && (
          <a
            href={place.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl border px-5 py-2.5 text-sm font-bold transition hover:bg-pink-50"
            style={{ borderColor: "#f9a8d4", color: "#db2777" }}
          >
            📸 انستقرام
          </a>
        )}
      </div>

      {/* Main info */}
      <div className="rounded-2xl border border-sal-100 bg-white p-6 shadow-sm space-y-4">
        <h1 className="text-3xl font-extrabold text-ink-900">{place.name}</h1>

        <div className="flex flex-wrap items-center gap-4">
          <RatingStars rating={place.rating} />
          <span className="flex items-center gap-1.5 text-sm text-ink-600">
            <svg className="h-4 w-4 text-sal-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            {formatVisits(place.visits)} زيارة
          </span>
        </div>

        <p className="leading-relaxed text-ink-700">{place.description}</p>

        <div className="flex flex-wrap gap-2">
          {place.tags.map((tag) => (
            <span key={tag} className="rounded-lg bg-sal-50 px-3 py-1 text-sm font-medium text-sal-700">
              {tag}
            </span>
          ))}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 gap-3 border-t border-sal-50 pt-4 sm:grid-cols-2">
          {mainBranch?.openingHours && (
            <div className="flex items-start gap-3 rounded-xl bg-sal-50 p-3">
              <span className="text-xl">⏰</span>
              <div>
                <p className="text-xs font-semibold text-ink-600">ساعات العمل</p>
                <p className="text-sm font-bold text-ink-900">{mainBranch.openingHours}</p>
              </div>
            </div>
          )}
          {mainBranch?.phone && (
            <div className="flex items-start gap-3 rounded-xl bg-sal-50 p-3">
              <span className="text-xl">📞</span>
              <div>
                <p className="text-xs font-semibold text-ink-600">الهاتف</p>
                <p className="text-sm font-bold text-ink-900" dir="ltr">{mainBranch.phone}</p>
              </div>
            </div>
          )}
          {place.priceRange && (
            <div className="flex items-start gap-3 rounded-xl bg-sal-50 p-3">
              <span className="text-xl">💰</span>
              <div>
                <p className="text-xs font-semibold text-ink-600">نطاق السعر</p>
                <p className="text-sm font-bold text-ink-900">{place.priceRange}</p>
              </div>
            </div>
          )}
          {mainBranch?.address && (
            <div className="flex items-start gap-3 rounded-xl bg-sal-50 p-3">
              <span className="text-xl">📍</span>
              <div>
                <p className="text-xs font-semibold text-ink-600">العنوان</p>
                <p className="text-sm font-bold text-ink-900">{mainBranch.address}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Yellow opinion box — no title */}
      {place.opinion && (
        <div
          className="rounded-2xl p-5 text-sm leading-relaxed font-medium"
          style={{ background: "#fefce8", border: "1px solid #fde047", color: "#713f12" }}
        >
          {place.opinion}
        </div>
      )}

      {/* Branches */}
      <div className="rounded-2xl border border-sal-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-extrabold text-ink-900">📍 فروع {place.name}</h2>
        <p className="mb-4 text-sm text-ink-600">اضغط على الفرع لعرض عنوانه وتفاصيله</p>
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
