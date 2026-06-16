import type { Place } from "./types";

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[ً-ٟ]/g, "");
}

export function matchesQuery(place: Place, rawQ: string, expandedTerms: string[] = []): boolean {
  if (!rawQ && expandedTerms.length === 0) return true;

  const allTerms = [rawQ, ...expandedTerms]
    .map(normalize)
    .filter(Boolean);

  if (allTerms.length === 0) return true;

  const corpus = [
    place.name,
    place.description,
    ...place.tags,
    ...(place.keywords ?? []),
    place.neighborhood ?? "",
    place.address ?? "",
    place.category,
  ]
    .map(normalize)
    .join(" ");

  return allTerms.some((term) => corpus.includes(term));
}

/** Call /api/search-expand and return expanded terms (returns [] on failure) */
export async function expandQuery(q: string): Promise<string[]> {
  try {
    const res = await fetch("/api/search-expand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q }),
    });
    const data = await res.json() as { terms?: string[] };
    return Array.isArray(data.terms) ? data.terms : [];
  } catch {
    return [];
  }
}
