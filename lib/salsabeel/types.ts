export type Category = "cafes" | "restaurants" | "clinics" | "salons" | "malls";

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
  description: string;
  rating: number;
  visits: number;
  gradient: string;
  tags: string[];
  isWomenOnly?: boolean;
  branches: Branch[];
  createdAt: string;
};
