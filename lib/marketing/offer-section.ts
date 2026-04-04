/** يطابق query ‎`?section=`‎ في ‎/offers وعمود ‎listings.offer_section */
export const OFFER_SECTION_KEYS = [
  "industrial",
  "commercial-workers",
  "residential",
  "lands"
] as const;

export type OfferSectionKey = (typeof OFFER_SECTION_KEYS)[number];

export const OFFER_SECTION_FORM_OPTIONS: Array<{ value: OfferSectionKey; label: string }> = [
  { value: "industrial", label: "مصانع ومستودعات" },
  { value: "commercial-workers", label: "تجارية وسكن عمال" },
  { value: "residential", label: "سكني" },
  { value: "lands", label: "أراضي" }
];

export function isOfferSectionKey(v: string): v is OfferSectionKey {
  return (OFFER_SECTION_KEYS as readonly string[]).includes(v);
}
