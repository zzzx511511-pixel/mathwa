import Link from "next/link";
import type { Route } from "next";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { suggestedGeneralImages, suggestedIndustrialImages } from "@/lib/site/public-site-config";
import { BackButton } from "@/components/layout/back-button";
import { OfferPublicToolbar } from "@/components/offers/offer-public-toolbar";
import {
  mergeOffersForOffersPage,
  type ListingRow,
  type PropertyOfferRow,
  type UnifiedPublicOffer,
  type OffersPageSection
} from "@/lib/site/marketing-listings-public";

export const dynamic = "force-dynamic";

const cityOptions = ["الرياض", "جدة", "الدمام", "مكة", "المدينة", "الخبر", "الطائف"];
const districtOptions = ["السلي", "الملقا", "النرجس", "الياسمين", "العليا", "الصحافة", "النسيم"];
const typeOptionsBySection: Record<OffersPageSection, string[]> = {
  all: [
    "الكل",
    "مصانع",
    "مستودعات",
    "ورش",
    "أحواش",
    "أرض صناعية",
    "أرض تجارية",
    "أرض سكنية",
    "شقة",
    "دور",
    "فيلا",
    "دوبلكس",
    "تاون هاوس",
    "قصر",
    "مكتب تجاري",
    "عمارة تجارية",
    "سكن عمال"
  ],
  industrial: ["الكل", "مصنع", "مستودع", "ورشة", "حوش", "أرض صناعية"],
  "commercial-workers": ["الكل", "مكتب تجاري", "عمارة تجارية", "محل", "سكن عمال"],
  residential: ["الكل", "شقة", "دور", "فيلا", "دوبلكس", "تاون هاوس", "قصر"],
  lands: ["الكل", "أرض سكنية", "أرض تجارية", "أرض صناعية", "أرض زراعية"]
};

const sectionTitleByKey: Record<OffersPageSection, string> = {
  all: "كل العروض",
  industrial: "المصانع والمستودعات",
  "commercial-workers": "التجارية وسكن العمال",
  residential: "السكني",
  lands: "الأراضي"
};

export default async function OffersPage({
  searchParams
}: {
  searchParams?: { section?: string };
}) {
  const rawSection = searchParams?.section ?? "all";
  const section: OffersPageSection =
    rawSection === "industrial" ||
    rawSection === "commercial-workers" ||
    rawSection === "residential" ||
    rawSection === "lands"
      ? rawSection
      : "all";

  let offers: UnifiedPublicOffer[] = [];
  let offersLoadFailed = false;

  try {
    const supabase = getSupabaseServerClient();
    const [{ data: rpcData }, { data: listingData }] = await Promise.all([
      supabase.rpc("get_public_property_offers", { p_limit: 200 }),
      supabase.from("listings").select("*").eq("status", "published").order("created_at", { ascending: false })
    ]);

    const propertyRows = (rpcData ?? []) as PropertyOfferRow[];
    const listingRows = (listingData ?? []) as ListingRow[];

    offers = mergeOffersForOffersPage(section, propertyRows, listingRows);
  } catch {
    offersLoadFailed = true;
  }

  const filtersSection = (
    <section className="rounded-2xl border border-ink-900/10 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-3xl font-extrabold text-ink-900">{sectionTitleByKey[section]}</h2>
        <BackButton fallbackHref="/" />
      </div>
      {offersLoadFailed ? (
        <p className="mt-3 rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-sm text-amber-900/90">
          تعذّر تحميل العروض. تحقق من مفاتيح Supabase ومن وجود جدول <code className="text-xs">listings</code> ودالة{" "}
          <code className="text-xs">get_public_property_offers</code>.
        </p>
      ) : (
        <p className="mt-3 rounded-lg border border-brand-200/60 bg-brand-50/80 px-3 py-2 text-sm text-ink-900/85">
          تُعرض عروض <strong>التسويق</strong> من جدول <code className="text-xs">listings</code> وعروض{" "}
          <strong>العقارات الشاغرة</strong> من قاعدة البيانات حسب القسم المختار.
        </p>
      )}

      <div className="mt-4 grid gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-ink-900/10 bg-[#f8f3ea] px-3 py-2">
          <span className="text-ink-900/55">🔎</span>
          <input
            className="w-full bg-transparent text-sm text-ink-900 outline-none"
            placeholder="ابحث عن مصنع، مستودع، حوش، أو أرض..."
            readOnly
          />
        </div>
        <div className="grid gap-2 md:grid-cols-4">
          <select className="rounded-lg border border-ink-900/10 bg-white px-3 py-2 text-sm text-ink-900">
            <option>المنطقة: الكل</option>
            <option>الوسطى</option>
            <option>الشرقية</option>
            <option>الغربية</option>
            <option>الشمالية</option>
            <option>الجنوبية</option>
          </select>
          <div>
            <input
              list="city-options"
              className="w-full rounded-lg border border-ink-900/10 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-400"
              placeholder="ابحث عن مدينة..."
            />
            <datalist id="city-options">
              {cityOptions.map((city) => (
                <option key={city} value={city} />
              ))}
            </datalist>
          </div>
          <div>
            <input
              list="district-options"
              className="w-full rounded-lg border border-ink-900/10 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-400"
              placeholder="ابحث عن حي..."
            />
            <datalist id="district-options">
              {districtOptions.map((district) => (
                <option key={district} value={district} />
              ))}
            </datalist>
          </div>
          <select className="rounded-lg border border-ink-900/10 bg-white px-3 py-2 text-sm text-ink-900">
            {typeOptionsBySection[section].map((typeOption, idx) => (
              <option key={typeOption}>
                {idx === 0 ? `نوع العقار: ${typeOption}` : typeOption}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );

  const databaseOffersSection = (
    <section className="rounded-2xl bg-[#efe8dc] p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-ink-900/75">{offers.length} عرض</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {offers.map((offer, idx) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            idx={idx}
            contactHref={`/login?mode=signup&role=client&returnTo=${encodeURIComponent(
              section === "all" ? "/offers" : `/offers?section=${section}`
            )}`}
          />
        ))}
      </div>
    </section>
  );

  return (
    <div className="space-y-6">
      {filtersSection}
      {databaseOffersSection}
    </div>
  );
}

function OfferCard({
  offer,
  idx,
  contactHref
}: {
  offer: UnifiedPublicOffer;
  idx: number;
  contactHref: string;
}) {
  const detailHref = `/offers/${offer.id}` as Route;
  const riskLabel =
    offer.risk === "high"
      ? "خطورة عالية"
      : offer.risk === "medium"
        ? "خطورة متوسطة"
        : "خطورة منخفضة";
  const riskClass =
    offer.risk === "high"
      ? "bg-red-600 text-white"
      : offer.risk === "medium"
        ? "bg-blue-600 text-white"
        : "bg-emerald-600 text-white";

  const fallbackImage =
    /مصنع|مستودع|ورشة|صناعي/i.test(offer.type)
      ? suggestedIndustrialImages[idx % suggestedIndustrialImages.length]
      : suggestedGeneralImages[idx % suggestedGeneralImages.length];
  const heroImage = offer.imageUrl || fallbackImage;

  return (
    <article className="overflow-hidden rounded-xl border border-ink-900/10 bg-white">
      <Link
        href={detailHref}
        prefetch
        className="relative block h-44 bg-cover bg-center focus-visible:outline focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2"
        style={{ backgroundImage: `url('${heroImage}')` }}
        aria-label={`فتح تفاصيل: ${offer.title}`}
      >
        <span className="pointer-events-none absolute right-2 top-2 rounded-md bg-black/65 px-2 py-1 text-[11px] font-bold text-white">
          {offer.type}
        </span>
        <span className="pointer-events-none absolute left-2 top-2 rounded-md bg-blue-600 px-2 py-1 text-[11px] font-bold text-white">
          {offer.modeLabel}
        </span>
        <span className={`pointer-events-none absolute bottom-2 right-2 rounded-md px-2 py-1 text-[11px] font-bold ${riskClass}`}>
          {riskLabel}
        </span>
      </Link>
      <div className="space-y-2 p-4">
        <Link href={detailHref} prefetch className="block rounded-lg py-1 hover:bg-[#f8f3ea]/60">
          <h4 className="text-xl font-bold text-ink-900">{offer.title}</h4>
          <p className="text-sm text-ink-900/75">{offer.details}</p>
          <p className="text-sm text-ink-900/70">📍 {offer.area}</p>
          <p className="pt-1 text-lg font-extrabold text-brand-400">{offer.price}</p>
        </Link>
        <div className="mt-2">
          <OfferPublicToolbar compact path={`/offers/${offer.id}`} title={offer.title} kind="offer" />
        </div>
        <Link
          href={detailHref}
          prefetch
          className="mt-1 block rounded-lg border border-ink-900/15 px-3 py-2 text-center text-xs font-semibold text-ink-900 hover:bg-[#f8f3ea]"
        >
          عرض التفاصيل والصور
        </Link>
        <a
          href={contactHref}
          className="mt-2 block rounded-lg bg-brand-500 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-brand-400"
        >
          تواصل مع المسؤول عن العرض
        </a>
      </div>
    </article>
  );
}
