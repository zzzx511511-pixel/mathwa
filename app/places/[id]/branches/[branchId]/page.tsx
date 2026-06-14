import { notFound } from "next/navigation";
import Link from "next/link";
import { getPlaceById } from "@/lib/salsabeel/data";
import { getCustomPlaces } from "@/lib/salsabeel/supabase-places";

export const dynamic = "force-dynamic";

export default async function BranchDetailPage({
  params,
}: {
  params: { id: string; branchId: string };
}) {
  let place = getPlaceById(params.id) ?? null;
  if (!place) {
    const custom = await getCustomPlaces();
    place = custom.find((p) => p.id === params.id) ?? null;
  }
  if (!place) notFound();

  const branch = place.branches.find((b) => b.id === params.branchId);
  if (!branch) notFound();

  const mapsHref = branch.mapsUrl
    ? branch.mapsUrl
    : `https://maps.google.com/?q=${encodeURIComponent(
        `${place.name} ${branch.address} الرياض`
      )}`;

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-10">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-ink-600">
        <Link href="/places" className="hover:text-sal-600">استكشف</Link>
        <span>/</span>
        <Link href={`/places/${place.id}`} className="hover:text-sal-600">{place.name}</Link>
        <span>/</span>
        <span className="font-medium text-ink-900">{branch.name}</span>
      </nav>

      {/* Branch card */}
      <div className="rounded-2xl border border-sal-100 bg-white p-6 shadow-sm space-y-5">
        <div>
          <p className="text-xs font-semibold text-sal-500 uppercase tracking-wider mb-1">{place.name}</p>
          <h1 className="text-2xl font-extrabold text-ink-900">{branch.name}</h1>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {(branch.region ?? place.region) && (
              <span className="rounded-full bg-sal-50 px-3 py-0.5 text-xs font-bold text-sal-700">
                📍 {branch.region ?? place.region} الرياض
              </span>
            )}
            {branch.neighborhood && (
              <span className="rounded-full bg-ink-50 px-3 py-0.5 text-xs font-semibold text-ink-600">
                {branch.neighborhood}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {/* Address */}
          <div className="flex items-start gap-3 rounded-xl bg-sal-50 p-3">
            <span className="text-xl">📍</span>
            <div>
              <p className="text-xs font-semibold text-ink-600">العنوان</p>
              <p className="text-sm font-bold text-ink-900">
                {branch.neighborhood ? `${branch.neighborhood}، ` : ""}{branch.address}، {branch.city}
              </p>
            </div>
          </div>

          {/* Phone */}
          {branch.phone && (
            <div className="flex items-start gap-3 rounded-xl bg-sal-50 p-3">
              <span className="text-xl">📞</span>
              <div>
                <p className="text-xs font-semibold text-ink-600">الهاتف</p>
                <a
                  href={`tel:${branch.phone}`}
                  className="text-sm font-bold text-sal-700 hover:underline"
                  dir="ltr"
                >
                  {branch.phone}
                </a>
              </div>
            </div>
          )}

          {/* Hours */}
          {branch.openingHours && (
            <div className="flex items-start gap-3 rounded-xl bg-sal-50 p-3">
              <span className="text-xl">⏰</span>
              <div>
                <p className="text-xs font-semibold text-ink-600">ساعات العمل</p>
                <p className="text-sm font-bold text-ink-900">{branch.openingHours}</p>
              </div>
            </div>
          )}
        </div>

        {/* Map button */}
        <a
          href={mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow transition hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 55%, #0369a1 100%)" }}
        >
          📍 افتح في الخريطة
        </a>

        {/* Place-level contact links */}
        {(place.instagramUrl || place.website || place.phone) && (
          <div className="flex flex-wrap gap-2 border-t border-sal-100 pt-4">
            {place.phone && (
              <a
                href={`tel:${place.phone}`}
                className="inline-flex items-center gap-2 rounded-xl border border-sal-200 bg-sal-50 px-4 py-2 text-sm font-bold text-sal-700 transition hover:bg-sal-100"
              >
                📞 <span dir="ltr">{place.phone}</span>
              </a>
            )}
            {place.instagramUrl && (
              <a
                href={place.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-pink-50 px-4 py-2 text-sm font-bold text-pink-700 transition hover:bg-pink-100"
              >
                📸 انستقرام
              </a>
            )}
            {place.website && (
              <a
                href={place.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
              >
                🌐 الموقع
              </a>
            )}
          </div>
        )}
      </div>

      {/* Back to place */}
      <div className="text-center">
        <Link
          href={`/places/${place.id}`}
          className="inline-flex items-center gap-2 rounded-xl border border-sal-200 bg-white px-6 py-2.5 text-sm font-semibold text-sal-700 hover:bg-sal-50 transition"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          عودة لـ {place.name}
        </Link>
      </div>
    </div>
  );
}
