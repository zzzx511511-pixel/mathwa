import { notFound } from "next/navigation";
import Link from "next/link";
import { getPlaceById, PLACES } from "@/lib/salsabeel/data";

export function generateStaticParams() {
  return PLACES.flatMap((p) =>
    p.branches.map((b) => ({ id: p.id, branchId: b.id }))
  );
}

export default function BranchDetailPage({
  params,
}: {
  params: { id: string; branchId: string };
}) {
  const place = getPlaceById(params.id);
  if (!place) notFound();

  const branch = place.branches.find((b) => b.id === params.branchId);
  if (!branch) notFound();

  const mapsHref = branch.mapsUrl
    ? branch.mapsUrl
    : `https://maps.google.com/?q=${encodeURIComponent(
        place.name + " " + branch.name + " " + branch.address + "، الرياض"
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
          {place.region && (
            <span className="mt-1.5 inline-block rounded-full bg-sal-50 px-3 py-0.5 text-xs font-bold text-sal-700">
              📍 {place.region} الرياض
            </span>
          )}
        </div>

        <div className="space-y-3">
          {/* Address */}
          <div className="flex items-start gap-3 rounded-xl bg-sal-50 p-3">
            <span className="text-xl">📍</span>
            <div>
              <p className="text-xs font-semibold text-ink-600">العنوان</p>
              <p className="text-sm font-bold text-ink-900">{branch.address}، {branch.city}</p>
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
