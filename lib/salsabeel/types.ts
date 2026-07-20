export type Category = "cafes" | "restaurants" | "clinics" | "salons" | "malls";
export type Region = "شمال" | "جنوب" | "شرق" | "غرب" | "وسط";

export const CLINIC_SPECS = [
  { value: "أسنان",         label: "أسنان",         icon: "🦷" },
  { value: "تجميل",         label: "تجميل",         icon: "✨" },
  { value: "علاج طبيعي",   label: "علاج طبيعي",   icon: "🏃" },
  { value: "جلدية",         label: "جلدية",         icon: "💊" },
  { value: "عيون",          label: "عيون",          icon: "👁️" },
  { value: "نساء وولادة",  label: "نساء وولادة",  icon: "🌸" },
  { value: "أطفال",         label: "أطفال",         icon: "👶" },
  { value: "عام",           label: "عيادات عامة",  icon: "🏥" },
] as const;

export type ClinicSpec = typeof CLINIC_SPECS[number]["value"];

export type Branch = {
  id: string;
  name: string;
  address: string;
  city: string;
  neighborhood?: string;
  region?: Region;
  phone?: string;
  mapsUrl?: string;
  lat?: number;
  lng?: number;
  openingHours?: string;
  /** When true, always show this branch in the public branches list even if it is the
   *  place-level "hero" branch (whose data appears in the top info card). Defaults to
   *  false (hero branch is hidden from the list to avoid visual duplication). */
  showInBranchesListEvenIfHero?: boolean;
};

export type Place = {
  id: string;
  name: string;
  category: Category;
  region?: Region;
  neighborhood?: string;
  address?: string;
  openingHours?: string;
  description: string;
  opinion?: string;
  rating: number;
  visits: number;
  visits28d?: number;
  acceptanceRate?: number;
  rejectionRate?: number;
  priceRange?: string;
  phone?: string;
  instagramUrl?: string;
  instagramPosts?: string[];
  website?: string;
  mapsUrl?: string;
  googlePlaceId?: string;
  keywords?: string[];
  photos?: string[];
  videos?: string[];
  gradient: string;
  tags: string[];
  lat?: number;
  lng?: number;
  isHybrid?: boolean;
  isWomenOnly?: boolean;
  specialization?: string[];
  branches: Branch[];
  createdAt: string;
  _deleted?: boolean;
};

