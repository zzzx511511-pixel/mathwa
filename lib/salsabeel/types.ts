export type Category = "cafes" | "restaurants" | "clinics" | "salons" | "malls";
export type Region = "شمال" | "جنوب" | "شرق" | "غرب" | "وسط";

export type Branch = {
  id: string;
  name: string;
  address: string;
  city: string;
  phone?: string;
  mapsUrl?: string;
  openingHours?: string;
};

export type Place = {
  id: string;
  name: string;
  category: Category;
  region?: Region;
  description: string;
  opinion?: string;
  rating: number;
  visits: number;
  visits28d?: number;
  acceptanceRate?: number;
  rejectionRate?: number;
  priceRange?: string;
  instagramUrl?: string;
  photos?: string[];
  videos?: string[];
  gradient: string;
  tags: string[];
  isWomenOnly?: boolean;
  branches: Branch[];
  createdAt: string;
};

