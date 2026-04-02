import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { BackButton } from "@/components/layout/back-button";
import { OfferPublicToolbar } from "@/components/offers/offer-public-toolbar";
import { suggestedGeneralImages, suggestedIndustrialImages } from "@/lib/site/public-site-config";
import { filterPublicVacantOffers } from "@/lib/site/public-vacant-offers";

export const dynamic = "force-dynamic";

type OfferRow = {
  id: string | null;
  title: string | null;
  summary: string | null;
  property_type: string | null;
  price: number | null;
  image_url: string | null;
  city: string | null;
  district: string | null;
  occupancy_status?: string | null;
  status?: string | null;
  property_status?: string | null;
};

export default async function OfferDetailsPage({
  params
}: {
  params: { id: string };
}) {
  const { id } = params;
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.rpc("get_public_property_offers", { p_limit: 240 });
  const rows = filterPublicVacantOffers((data ?? []) as OfferRow[]);
  const row = rows.find((item) => String(item.id) === id);

  if (!row) notFound();

  const type = String(row.property_type ?? "عقار");
  const details = String(row.summary ?? "لا توجد تفاصيل إضافية.");
  const area = [row.city, row.district].filter(Boolean).join(" - ") || "الرياض";
  const price =
    row.price && Number.isFinite(row.price)
      ? `${new Intl.NumberFormat("ar-SA").format(row.price)} ر.س`
      : "السعر عند التواصل";

  const fallbackImage = /مصنع|مستودع|ورشة|صناعي/i.test(type)
    ? suggestedIndustrialImages[0]
    : suggestedGeneralImages[0];
  const mainMedia = row.image_url || fallbackImage;
  const isVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(mainMedia);
  const gallery = [mainMedia, ...suggestedGeneralImages.slice(0, 3)];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-ink-900/10 bg-white p-6">
        <div className="mb-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-extrabold text-ink-900">{row.title ?? "تفاصيل العرض"}</h1>
            <BackButton fallbackHref="/offers" />
          </div>
          <OfferPublicToolbar
            path={`/offers/${id}`}
            title={String(row.title ?? "عرض عقاري")}
            kind="offer"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-ink-900/10 bg-[#ece8e0]">
            {isVideo ? (
              <video controls className="h-72 w-full bg-black object-cover">
                <source src={mainMedia} />
              </video>
            ) : (
              <img
                src={mainMedia}
                alt={String(row.title ?? "صورة العرض")}
                className="h-72 w-full object-contain object-center"
                loading="eager"
              />
            )}
          </div>
          <article className="rounded-xl border border-ink-900/10 bg-white p-5">
            <p className="text-sm text-ink-900/70">نوع العقار</p>
            <p className="text-lg font-bold text-ink-900">{type}</p>
            <p className="mt-3 text-sm text-ink-900/70">الموقع العام</p>
            <p className="text-base font-semibold text-ink-900">{area}</p>
            <p className="mt-3 text-sm text-ink-900/70">السعر</p>
            <p className="text-xl font-extrabold text-brand-400">{price}</p>
            <p className="mt-4 text-sm leading-8 text-ink-900/80">{details}</p>
            <a
              href={`/login?mode=signup&role=client&returnTo=${encodeURIComponent(`/offers/${id}`)}`}
              className="mt-4 inline-block rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-400"
            >
              تواصل مع المسؤول عن العرض
            </a>
          </article>
        </div>
      </section>

      <section className="rounded-2xl bg-[#efe8dc] p-6">
        <h2 className="text-2xl font-bold text-ink-900">صور إضافية</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {gallery.map((src, idx) => (
            <img
              key={`${src}-${idx}`}
              src={src}
              alt={`صورة ${idx + 1}`}
              className="h-40 w-full rounded-lg border border-ink-900/10 object-contain bg-[#f5f1eb]"
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-ink-900/10 bg-white p-6">
        <h2 className="text-2xl font-bold text-ink-900">فيديو العرض</h2>
        <div className="mt-4 rounded-xl border border-dashed border-ink-900/20 bg-[#f8f3ea] p-5 text-sm text-ink-900/75">
          {isVideo ? "الفيديو ظاهر أعلى الصفحة." : "لا يوجد فيديو مرفق لهذا العرض حاليًا."}
        </div>
      </section>
    </div>
  );
}
