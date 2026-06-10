import type { Category } from "./types";

export type CategoryMeta = {
  slug: Category;
  label: string;
  icon: string;
  count: number;
  color: string;
  bg: string;
  badge?: string;
};

export const CATEGORIES: CategoryMeta[] = [
  {
    slug: "cafes",
    label: "كافيهات",
    icon: "☕",
    count: 425,
    color: "#92400E",
    bg: "#FEF3C7",
  },
  {
    slug: "restaurants",
    label: "مطاعم",
    icon: "🍽️",
    count: 415,
    color: "#991B1B",
    bg: "#FEE2E2",
  },
  {
    slug: "clinics",
    label: "عيادات",
    icon: "🏥",
    count: 105,
    color: "#1E40AF",
    bg: "#DBEAFE",
  },
  {
    slug: "salons",
    label: "صالونات",
    icon: "💇‍♀️",
    count: 255,
    color: "#9D174D",
    bg: "#FCE7F3",
    badge: "نسائية فقط",
  },
  {
    slug: "malls",
    label: "مجمعات",
    icon: "🏪",
    count: 0,
    color: "#065F46",
    bg: "#D1FAE5",
    badge: "جديد",
  },
];

export function getCategoryMeta(slug: Category): CategoryMeta | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getCategoryLabel(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}
