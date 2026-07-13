import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/salsabeel/admin-auth";

const GOOGLE_KEY  = process.env.GOOGLE_PLACES_API_KEY ?? "";
const PLACES_BASE = "https://maps.googleapis.com/maps/api/place";

// Extract "حي X" neighborhood from a Google formatted address.
function extractNeighborhood(address: string): string {
  const m = address.match(/حي\s+([؀-ۿa-zA-Z][^\s،,،\n]{0,20})/);
  return m ? m[1].trim() : "";
}

// Strip city, postal code, and country from a Google formatted address for Riyadh.
function cleanAddress(raw: string): string {
  return raw
    .replace(/،?\s*الرياض\s*\d{4,6}/g, "")
    .replace(/،?\s*المملكة العربية السعودية/g, "")
    .replace(/،?\s*Saudi Arabia/gi, "")
    .replace(/،?\s*الرياض\b/g, "")
    .replace(/,\s*Riyadh\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .replace(/^،|،$/g, "")
    .trim();
}

// Compact opening_hours.weekday_text into one readable string.
function summarizeHours(weekdayText: string[] | undefined): string | undefined {
  if (!weekdayText?.length) return undefined;
  // If all entries share the same time range, collapse to one line.
  const times = weekdayText.map((line) => {
    const m = line.match(/:\s*(.+)$/);
    return m ? m[1].trim() : line;
  });
  const unique = [...new Set(times)];
  if (unique.length === 1) return unique[0];
  // Otherwise use the first day's hours as a representative sample.
  const m = weekdayText[0]?.match(/:\s*(.+)$/);
  return m ? m[1].trim() : weekdayText[0];
}

interface RawResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry?: { location?: { lat: number; lng: number } };
}

interface DetailResult {
  formatted_address?: string;
  geometry?: { location?: { lat: number; lng: number } };
  opening_hours?: { weekday_text?: string[] };
  formatted_phone_number?: string;
  url?: string;
}

export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();

  const name  = req.nextUrl.searchParams.get("name")?.trim() ?? "";
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "15"), 20);

  if (!name || !GOOGLE_KEY) return NextResponse.json({ branches: [] });

  // Step 1: textsearch for all chain locations in Riyadh.
  const textParams = new URLSearchParams({
    query: `${name} الرياض`,
    language: "ar",
    region: "sa",
    key: GOOGLE_KEY,
  });

  let candidates: RawResult[] = [];
  try {
    const res  = await fetch(`${PLACES_BASE}/textsearch/json?${textParams}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return NextResponse.json({ branches: [] });
    const data = await res.json();
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS")
      return NextResponse.json({ branches: [], error: data.status });
    candidates = (data.results ?? []).slice(0, limit) as RawResult[];
  } catch {
    return NextResponse.json({ branches: [] });
  }

  // Step 2: place/details for each candidate in parallel.
  const branches = await Promise.all(
    candidates.map(async (c, i) => {
      const detailParams = new URLSearchParams({
        place_id: c.place_id,
        fields: "formatted_address,geometry,opening_hours,formatted_phone_number,url",
        language: "ar",
        key: GOOGLE_KEY,
      });
      try {
        const res  = await fetch(`${PLACES_BASE}/details/json?${detailParams}`, {
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (data.status !== "OK") return null;
        const r: DetailResult = data.result;

        const rawAddress  = r.formatted_address ?? c.formatted_address;
        const neighborhood = extractNeighborhood(rawAddress);
        const address      = cleanAddress(rawAddress);
        const branchName   = neighborhood
          ? `فرع ${neighborhood}`
          : `الفرع ${i + 1}`;

        return {
          _googlePlaceId: c.place_id,
          name:         branchName,
          address:      address || rawAddress,
          city:         "الرياض",
          neighborhood: neighborhood || undefined,
          lat:          r.geometry?.location?.lat ?? c.geometry?.location?.lat,
          lng:          r.geometry?.location?.lng ?? c.geometry?.location?.lng,
          openingHours: summarizeHours(r.opening_hours?.weekday_text),
          phone:        r.formatted_phone_number || undefined,
          mapsUrl:      r.url || undefined,
        };
      } catch {
        return null;
      }
    })
  );

  return NextResponse.json({ branches: branches.filter(Boolean) });
}
