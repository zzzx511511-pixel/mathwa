import { notFound } from "next/navigation";
import Link from "next/link";
import { getPlaceById } from "@/lib/salsabeel/data";
import { getCustomPlaces } from "@/lib/salsabeel/supabase-places";
import { getCategoryMeta } from "@/lib/salsabeel/categories";
import { RatingStars } from "@/components/salsabeel/rating-stars";
import { BranchPanel } from "@/components/salsabeel/branch-panel";
import { PlaceImage } from "@/components/salsabeel/place-image";
import { BackButton } from "@/components/salsabeel/back-button";
import { VisitTracker } from "@/components/salsabeel/visit-tracker";
import { getPlacePhotos } from "@/lib/salsabeel/place-photos";
import { PhotoLightbox } from "@/components/salsabeel/photo-lightbox";

export const dynamic = "force-dynamic";

function formatVisits(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return n.toString();
}

export default async function PlaceDetailPage({ params }: { params: { id: string } }) {
  let place = getPlaceById(params.id) ?? null;
  if (!place) {
    const custom = await getCustomPlaces();
    place = custom.find((p) => p.id === params.id) ?? null;
  }
  if (!place) notFound();

  const cat = getCategoryMeta(place.category);
  const mainBranch = place.branches[0];

  // Fetch (or serve from Supabase cache) 2 photos via Google Places API (Legacy)
  const cachedPhotos = await getPlacePhotos(
    place.id,
    place.name,
    place.neighborhood ?? mainBranch?.neighborhood,
    2
  );

  // Hero: Supabase-cached Google photo first, then manual photos
  const heroPhoto = cachedPhotos[0] ?? place.photos?.[0] ?? null;

  // Place-level location data (fallback to first branch for old entries that predate these fields)
  const displayNeighborhood = place.neighborhood ?? mainBranch?.neighborhood;
  const displayAddress      = place.address      ?? mainBranch?.address;
  const displayOpeningHours = place.openingHours ?? mainBranch?.openingHours;

  // Map URL: prefer address-based search when the place has its own address fields,
  // so a stale mapsUrl from a branch never leaks into the parent map button.
  const placeMapsHref = (place.address || place.neighborhood)
    ? `https://maps.google.com/?q=${encodeURIComponent(
        [place.name, place.neighborhood, place.address, "الرياض"].filter(Boolean).join(" ")
      )}`
    : place.mapsUrl
      ? place.mapsUrl
      : (mainBranch?.address
          ? `https://maps.google.com/?q=${encodeURIComponent(`${place.name} الرياض`)}`
          : null);

  // Gallery: Supabase-cached Google photos, then manual photos
  const galleryPhotos = cachedPhotos.length > 0 ? cachedPhotos : (place.photos ?? []);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <VisitTracker placeId={place.id} />

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
      <div className="relative overflow-hidden rounded-3xl h-56 md:h-72">
        {heroPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroPhoto}
            alt={place.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <PlaceImage
            photos={place.photos}
            category={place.category}
            name={place.name}
            className="h-full w-full"
          />
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6">
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
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {placeMapsHref && (
          <a
            href={placeMapsHref}
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
            📞 {mainBranch.phone}
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
          {displayOpeningHours && (
            <div className="flex items-start gap-3 rounded-xl bg-sal-50 p-3">
              <span className="text-xl">⏰</span>
              <div>
                <p className="text-xs font-semibold text-ink-600">ساعات العمل</p>
                <p className="text-sm font-bold text-ink-900">{displayOpeningHours}</p>
              </div>
            </div>
          )}
          {(place.phone || mainBranch?.phone) && (
            <div className="flex items-start gap-3 rounded-xl bg-sal-50 p-3">
              <span className="text-xl">📞</span>
              <div>
                <p className="text-xs font-semibold text-ink-600">الهاتف</p>
                <a
                  href={`tel:${place.phone ?? mainBranch?.phone}`}
                  className="text-sm font-bold text-sal-700 hover:underline"
                  dir="ltr"
                >
                  {place.phone ?? mainBranch?.phone}
                </a>
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
          {(displayNeighborhood || displayAddress) && (
            <div className="flex items-start gap-3 rounded-xl bg-sal-50 p-3">
              <span className="text-xl">📍</span>
              <div>
                <p className="text-xs font-semibold text-ink-600">الموقع</p>
                <p className="text-sm font-bold text-ink-900">
                  {[displayNeighborhood, displayAddress].filter(Boolean).join("، ")}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Social / contact links */}
        {(place.instagramUrl || place.website || place.phone) && (
          <div className="flex flex-wrap gap-2 border-t border-sal-50 pt-4">
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
                🌐 الموقع الإلكتروني
              </a>
            )}
          </div>
        )}
      </div>

      {/* Yellow opinion box — only shown when ratings are positive */}
      {place.opinion && (place.rejectionRate === undefined || place.rejectionRate <= 30) && (
        <div
          className="rounded-2xl p-5 text-sm leading-relaxed font-medium"
          style={{ background: "#fefce8", border: "1px solid #fde047", color: "#713f12" }}
        >
          {place.opinion}
        </div>
      )}

      {/* Acceptance / Rejection rates */}
      {(place.acceptanceRate !== undefined || place.rejectionRate !== undefined) && (
        <div className="rounded-2xl border border-sal-100 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-extrabold text-ink-900">📊 تقييم الزوار</h2>
          {place.acceptanceRate !== undefined && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-green-700">نسبة القبول</span>
                <span className="font-extrabold text-green-700 text-base">{place.acceptanceRate}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-3 rounded-full bg-green-500 transition-all"
                  style={{ width: `${place.acceptanceRate}%` }}
                />
              </div>
            </div>
          )}
          {place.rejectionRate !== undefined && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-red-600">نسبة الرفض</span>
                <span className="font-extrabold text-red-600 text-base">{place.rejectionRate}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-3 rounded-full bg-red-400 transition-all"
                  style={{ width: `${place.rejectionRate}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Photos gallery — Supabase-cached Google photos, then manual photos */}
      {galleryPhotos.length > 0 && (
        <div className="rounded-2xl border border-sal-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-extrabold text-ink-900">📷 صور المكان</h2>
          <PhotoLightbox photos={galleryPhotos.slice(0, 2)} altPrefix={place.name} />
        </div>
      )}

      {/* Branches — show for any place that has branch data */}
      {place.branches.length > 0 && (
        <div className="rounded-2xl border border-sal-100 bg-white p-6 shadow-sm">
          {place.branches.length === 1 ? (
            <h2 className="mb-4 text-xl font-extrabold text-ink-900">📍 موقع الفرع</h2>
          ) : (
            <>
              <h2 className="mb-1 text-xl font-extrabold text-ink-900">
                📍 فروع {place.name}
              </h2>
              <p className="mb-4 text-sm text-ink-600">
                {place.branches.length} فروع — اضغط على الفرع لعرض عنوانه وتفاصيله
              </p>
            </>
          )}
          <BranchPanel branches={place.branches} placeId={place.id} />
        </div>
      )}

      {/* Back */}
      <div className="text-center">
        <BackButton
          fallbackHref={cat ? `/category/${cat.slug}` : "/places"}
          label={cat ? `عودة لـ ${cat.label}` : "عودة"}
        />
      </div>
    </div>
  );
}
