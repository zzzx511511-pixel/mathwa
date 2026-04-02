import type { Metadata } from "next";
import { FavoritesClient } from "./favorites-client";

export const metadata: Metadata = {
  title: "مفضلاتي | مثوى العقارية",
  description: "العروض العقارية المحفوظة في مفضلتك."
};

export default function FavoritesPage() {
  return <FavoritesClient />;
}
