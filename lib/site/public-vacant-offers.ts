/**
 * الواجهة العامة (الرئيسية /offers /offers/[id]) تعرض وحدات شاغرة فقط.
 * الحقول المعتمدة من صفوف RPC get_public_property_offers: occupancy_status | status |
 * property_status | offer_status | listing_status (أيّها وُجد).
 * يُفضّل في Supabase تقييد الـ RPC بـ WHERE status = 'vacant' ثم يبقى هذا الفلتر طبقة إضافية.
 * إن لم يُرجع أي حقل حالة: نُبقي السجل للتوافق مع بيانات قديمة قبل إضافة العمود.
 */
const OCCUPIED = new Set(
  [
    "occupied",
    "مؤجَر",
    "مؤجر",
    "rented",
    "leased",
    "unavailable",
    "غير متاح"
  ].map((s) => s.toLowerCase())
);

const VACANT = new Set(
  ["vacant", "شاغر", "available", "متاح", "for_rent", "للإيجار", "empty"].map((s) =>
    s.toLowerCase()
  )
);

function normalizeStatus(row: Record<string, unknown>): string | null {
  const raw =
    row.occupancy_status ?? row.status ?? row.property_status ?? row.offer_status ?? row.listing_status;
  if (raw == null || raw === "") return null;
  return String(raw).trim().toLowerCase();
}

/** هل يُعرض في الموقع العام؟ */
export function isOfferRowVacantForPublic(row: Record<string, unknown>): boolean {
  const s = normalizeStatus(row);
  if (s === null) return true;
  if (VACANT.has(s) || [...VACANT].some((v) => s.includes(v))) return true;
  if (OCCUPIED.has(s) || [...OCCUPIED].some((o) => s.includes(o))) return false;
  return false;
}

export function filterPublicVacantOffers<T extends Record<string, unknown>>(rows: T[]): T[] {
  return rows.filter((r) => isOfferRowVacantForPublic(r));
}
