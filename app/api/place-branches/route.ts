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
  name?: string;
  formatted_address?: string;
  geometry?: { location?: { lat: number; lng: number } };
  opening_hours?: { weekday_text?: string[] };
  formatted_phone_number?: string;
  url?: string;
}

// Fetch Place Details for a single candidate and build a branch record.
async function fetchBranchDetail(c: RawResult, index: number) {
  const detailParams = new URLSearchParams({
    place_id: c.place_id,
    fields: "name,formatted_address,geometry,opening_hours,formatted_phone_number,url",
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

    const rawAddress   = r.formatted_address ?? c.formatted_address;
    const neighborhood = extractNeighborhood(rawAddress);
    const address      = cleanAddress(rawAddress);
    const branchName   = neighborhood ? `فرع ${neighborhood}` : `الفرع ${index + 1}`;

    return {
      _googlePlaceId: c.place_id,
      // Original Google place name (chain name), used for search-quality warnings.
      _placeName:   r.name ?? c.name ?? "",
      name:         branchName,
      address:      address || rawAddress,
      city:         "الرياض",
      neighborhood: neighborhood || undefined,
      lat:          r.geometry?.location?.lat ?? c.geometry?.location?.lat,
      lng:          r.geometry?.location?.lng ?? c.geometry?.location?.lng,
      openingHours: summarizeHours(r.opening_hours?.weekday_text),
      phone:        r.formatted_phone_number || undefined,
      // M2: fall back to a stable Google Maps URL when the detail URL is missing
      mapsUrl:      r.url || `https://www.google.com/maps/place/?q=place_id:${c.place_id}`,
    };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();

  // Single-ID lookup: ?gid=ChIJ... bypasses textsearch and fetches details directly.
  const gid = req.nextUrl.searchParams.get("gid")?.trim();
  if (gid) {
    if (!GOOGLE_KEY) return NextResponse.json({ branches: [] });
    const candidate: RawResult = { place_id: gid, name: "", formatted_address: "" };
    const branch = await fetchBranchDetail(candidate, 0);
    return NextResponse.json({ branches: branch ? [branch] : [] });
  }

  const name     = req.nextUrl.searchParams.get("name")?.trim() ?? "";
  // paginate=true: fetch up to 3 Google pages (60 results) with pagetoken delays.
  const paginate = req.nextUrl.searchParams.get("paginate") === "true";
  const maxPages = paginate ? 3 : 1;
  const limitDefault = paginate ? "60" : "15";
  const limitMax     = paginate ? 60 : 20;
  const limit        = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? limitDefault), limitMax);

  if (!name || !GOOGLE_KEY) return NextResponse.json({ branches: [] });

  // Step 1: textsearch for all chain locations in Riyadh, with optional pagination.
  let candidates: RawResult[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    const textParams = new URLSearchParams({
      query: `${name} الرياض`,
      language: "ar",
      region: "sa",
      // M4: bias results to Riyadh (centre ≈ 24.71°N 46.68°E, radius 35 km)
      location: "24.7136,46.6753",
      radius: "35000",
      key: GOOGLE_KEY,
    });
    if (pageToken) {
      // Google requires a 2-second delay before the next page token is valid.
      await new Promise((r) => setTimeout(r, 2000));
      textParams.set("pagetoken", pageToken);
    }
    try {
      const res = await fetch(`${PLACES_BASE}/textsearch/json?${textParams}`, {
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) break;
      const data = await res.json();
      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        if (page === 0) return NextResponse.json({ branches: [], error: data.status });
        break;
      }
      candidates.push(...((data.results ?? []) as RawResult[]));
      pageToken = data.next_page_token as string | undefined;
      if (!pageToken) break;
    } catch {
      if (page === 0) return NextResponse.json({ branches: [] });
      break;
    }
  }

  candidates = candidates.slice(0, limit);

  // Step 2: place/details for each candidate in parallel.
  const branches = await Promise.all(candidates.map((c, i) => fetchBranchDetail(c, i)));

  return NextResponse.json({ branches: branches.filter(Boolean) });
}
