import { isOfferSectionKey, type OfferSectionKey } from "@/lib/marketing/offer-section";
import { filterPublicVacantOffers } from "@/lib/site/public-vacant-offers";

/** قيم ‎section‎ في ‎/offers?section=‎ */
export type OffersPageSection = "all" | OfferSectionKey;

/** صف عقار من ‎get_public_property_offers‎ */
export type PropertyOfferRow = {
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

/** صف من ‎listings‎ */
export type ListingRow = {
  id: string;
  title: string;
  property_type: string;
  city: string;
  district: string;
  listing_mode: string;
  price: number;
  description: string;
  main_image_url: string | null;
  gallery_urls: unknown;
  video_url: string | null;
  hazard_level: string | null;
  /** عمود الترقية — الافتراضي industrial */
  offer_section?: string | null;
  status: string;
};

export type UnifiedPublicOffer = {
  id: string;
  title: string;
  details: string;
  type: string;
  area: string;
  price: string;
  imageUrl: string | null;
  modeLabel: "للبيع" | "للإيجار";
  risk: "high" | "medium" | "low";
  /** من جدول listings — للتصفية حسب القسم */
  offerSection?: OfferSectionKey;
  source: "property_rpc" | "listing";
};

const SECTION_PATTERNS: Record<OfferSectionKey, RegExp> = {
  industrial: /مصنع|مستودع|ورشة|حوش|صناعي|أرض صناعية/i,
  "commercial-workers": /تجاري|سكن عمال|مكتب|عمارة|محل|تجارية/i,
  residential: /شقة|دور|فيلا|دوبلكس|تاون|قصر|سكني|سكنية/i,
  lands: /أرض|اراضي|زراعية|أراضي/i
};

export function propertyRowMatchesOffersSection(row: PropertyOfferRow, section: OffersPageSection): boolean {
  if (section === "all") return true;
  const t = String(row.property_type ?? row.title ?? row.summary ?? "");
  return SECTION_PATTERNS[section].test(t);
}

export function listingRowMatchesOffersSection(row: ListingRow, section: OffersPageSection): boolean {
  if (section === "all") return true;
  const key = String(row.offer_section ?? "industrial").trim();
  return key === section;
}

function pickRiskFromText(text: string, idx: number): "high" | "medium" | "low" {
  if (/عالي|خطورة عالية/i.test(text)) return "high";
  if (/متوسط|خطورة متوسطة/i.test(text)) return "medium";
  if (/منخفض|خطورة منخفضة/i.test(text)) return "low";
  return (["high", "medium", "low"] as const)[idx % 3];
}

function hazardToRisk(hazard: string | null | undefined, idx: number): "high" | "medium" | "low" {
  const h = String(hazard ?? "").toLowerCase();
  if (h === "high") return "high";
  if (h === "medium") return "medium";
  if (h === "low") return "low";
  return pickRiskFromText("", idx);
}

function galleryUrlsToArray(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((u) => String(u ?? "").trim()).filter(Boolean);
  return [];
}

export function mapListingRowToUnifiedOffer(row: ListingRow, idx: number): UnifiedPublicOffer {
  const urls = galleryUrlsToArray(row.gallery_urls);
  const main = row.main_image_url?.trim() || urls[0] || null;
  const modeLabel: "للبيع" | "للإيجار" = row.listing_mode === "rent" ? "للإيجار" : "للبيع";
  const priceStr =
    row.price != null && Number.isFinite(Number(row.price))
      ? `${new Intl.NumberFormat("ar-SA").format(Number(row.price))} ر.س`
      : "السعر عند التواصل";
  const rawSec = String(row.offer_section ?? "industrial").trim();
  const section: OfferSectionKey | undefined = isOfferSectionKey(rawSec) ? rawSec : undefined;
  return {
    id: String(row.id),
    title: row.title,
    details: row.description || "تفاصيل متاحة بعد التواصل.",
    type: row.property_type,
    area: [row.city, row.district].filter(Boolean).join(" - ") || "—",
    price: priceStr,
    imageUrl: main,
    modeLabel,
    risk: hazardToRisk(row.hazard_level, idx),
    offerSection: section,
    source: "listing"
  };
}

/** للصفحة الرئيسية: عروض ‎listings‎ حسب العمود + عروض ‎RPC‎ حسب النمط النصي */
export function offersForHomeCategory(
  all: UnifiedPublicOffer[],
  section: OfferSectionKey,
  pattern: RegExp
): UnifiedPublicOffer[] {
  const byColumn = all.filter((o) => o.offerSection === section);
  const fromRpc = all.filter(
    (o) =>
      o.source === "property_rpc" && pattern.test(`${o.type} ${o.title} ${o.details}`)
  );
  const seen = new Set<string>();
  const out: UnifiedPublicOffer[] = [];
  for (const o of [...byColumn, ...fromRpc]) {
    if (seen.has(o.id)) continue;
    seen.add(o.id);
    out.push(o);
  }
  return out;
}

export function mapPropertyRowToUnifiedOffer(row: PropertyOfferRow, idx: number): UnifiedPublicOffer {
  const type = String(row.property_type ?? "عقار");
  const summary = String(row.summary ?? "");
  const modeLabel: "للبيع" | "للإيجار" = /إيجار|للايجار|للتأجير/i.test(summary) ? "للإيجار" : "للبيع";
  return {
    id: String(row.id ?? `idx-${idx}`),
    title: String(row.title ?? "عرض عقاري"),
    details: summary || "تفاصيل متاحة بعد التواصل.",
    type,
    area: [row.city, row.district].filter(Boolean).join(" - ") || "الرياض",
    price:
      row.price != null && Number.isFinite(Number(row.price))
        ? `${new Intl.NumberFormat("ar-SA").format(Number(row.price))} ر.س`
        : "السعر عند التواصل",
    imageUrl: row.image_url ?? null,
    modeLabel,
    risk: pickRiskFromText(type + " " + summary, idx),
    source: "property_rpc"
  };
}

export function mergeOffersForOffersPage(
  section: OffersPageSection,
  propertyRows: PropertyOfferRow[],
  listingRows: ListingRow[]
): UnifiedPublicOffer[] {
  const rpcFiltered = filterPublicVacantOffers(propertyRows as Record<string, unknown>[]).map(
    (r, i) => mapPropertyRowToUnifiedOffer(r as PropertyOfferRow, i)
  );
  const listingMapped = listingRows.map((r, i) => mapListingRowToUnifiedOffer(r, i));

  const fromRpc = rpcFiltered.filter((o) => {
    const row = propertyRows.find((r) => String(r?.id) === o.id);
    return row ? propertyRowMatchesOffersSection(row, section) : section === "all";
  });
  const fromListings = listingMapped.filter((o) => {
    const row = listingRows.find((r) => String(r.id) === o.id);
    return row ? listingRowMatchesOffersSection(row, section) : section === "all";
  });

  const seen = new Set<string>();
  const out: UnifiedPublicOffer[] = [];
  for (const o of [...fromListings, ...fromRpc]) {
    if (seen.has(o.id)) continue;
    seen.add(o.id);
    out.push(o);
  }
  return out;
}
