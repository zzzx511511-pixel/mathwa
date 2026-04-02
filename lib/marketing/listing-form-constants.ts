/** أنواع تعرض لها مستوى خطورة (صناعي) — مطابقة لمواصفة v2 */
export const PROPERTY_TYPES_WITH_HAZARD = new Set([
  "مصنع",
  "مستودع",
  "ورشة",
  "حوش",
  "أرض صناعية"
]);

export const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "نقداً" },
  { value: "installment", label: "تقسيط" },
  { value: "finance", label: "تمويل" },
  { value: "negotiable", label: "قابل للتفاوض" }
] as const;

export type PaymentMethodValue = (typeof PAYMENT_METHOD_OPTIONS)[number]["value"];

export const FEATURE_OPTIONS = [
  { key: "parking", label: "موقف سيارات" },
  { key: "elevator", label: "مصعد" },
  { key: "pool", label: "مسبح" },
  { key: "central_ac", label: "تكييف مركزي" },
  { key: "security", label: "أمن وحراسة" }
] as const;

export type FeatureKey = (typeof FEATURE_OPTIONS)[number]["key"];
