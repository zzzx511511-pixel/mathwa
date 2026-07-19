import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/salsabeel/admin-auth";

const GOOGLE_KEY  = process.env.GOOGLE_PLACES_API_KEY ?? "";
const PLACES_BASE = "https://maps.googleapis.com/maps/api/place";

// Riyadh city centre, used for both textsearch bias and nearbysearch origin.
const RIYADH_LAT = "24.7136";
const RIYADH_LNG = "46.6753";
const RIYADH_LOC = `${RIYADH_LAT},${RIYADH_LNG}`;
const SEARCH_RADIUS = "40000"; // 40 km — covers greater Riyadh including northern ring road

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
  const times = weekdayText.map((line) => {
    const m = line.match(/:\s*(.+)$/);
    return m ? m[1].trim() : line;
  });
  const unique = [...new Set(times)];
  if (unique.length === 1) return unique[0];
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

// Fetch Place Details for one candidate and build a branch record.
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
      // Original Google chain name, returned so the UI can warn about fuzzy matches.
      _placeName:   r.name ?? c.name ?? "",
      name:         branchName,
      address:      address || rawAddress,
      city:         "الرياض",
      neighborhood: neighborhood || undefined,
      lat:          r.geometry?.location?.lat ?? c.geometry?.location?.lat,
      lng:          r.geometry?.location?.lng ?? c.geometry?.location?.lng,
      openingHours: summarizeHours(r.opening_hours?.weekday_text),
      phone:        r.formatted_phone_number || undefined,
      mapsUrl:      r.url || `https://www.google.com/maps/place/?q=place_id:${c.place_id}`,
    };
  } catch {
    return null;
  }
}

/**
 * Textsearch: finds places by text relevance.
 * Uses just the chain name (no "الرياض" in the text) so branches that don't
 * contain "الرياض" explicitly in their Google data aren't penalised.
 * Location bias does the geographic filtering.
 */
async function runTextSearch(name: string, maxPages: number): Promise<RawResult[]> {
  const results: RawResult[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    const params = new URLSearchParams({
      query:    name,           // name only — location bias filters to Riyadh
      language: "ar",
      region:   "sa",
      location: RIYADH_LOC,
      radius:   SEARCH_RADIUS,
      key:      GOOGLE_KEY,
    });
    if (pageToken) {
      await new Promise((r) => setTimeout(r, 2000));
      params.set("pagetoken", pageToken);
    }
    try {
      const res = await fetch(`${PLACES_BASE}/textsearch/json?${params}`, {
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) break;
      const data = await res.json();
      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        if (page === 0) throw new Error(data.status as string);
        break;
      }
      results.push(...((data.results ?? []) as RawResult[]));
      pageToken = data.next_page_token as string | undefined;
      if (!pageToken) break;
    } catch (err) {
      if (page === 0) throw err;
      break;
    }
  }
  return results;
}

/**
 * Nearbysearch: finds places by proximity to Riyadh centre.
 * Uses a keyword match (more flexible than textsearch for obscure chains).
 * Returns different results than textsearch — together they maximise coverage.
 * Runs in parallel with textsearch pagination to avoid adding wall-clock time.
 */
async function runNearbySearch(name: string, maxPages: number): Promise<RawResult[]> {
  const results: RawResult[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    const params = new URLSearchParams({
      location: RIYADH_LOC,
      radius:   SEARCH_RADIUS,
      keyword:  name,
      language: "ar",
      key:      GOOGLE_KEY,
    });
    if (pageToken) {
      await new Promise((r) => setTimeout(r, 2000));
      params.set("pagetoken", pageToken);
    }
    try {
      const res = await fetch(`${PLACES_BASE}/nearbysearch/json?${params}`, {
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) break;
      const data = await res.json();
      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") break;
      const raw = (data.results ?? []) as Array<{
        place_id: string;
        name: string;
        vicinity?: string;
        geometry?: { location?: { lat: number; lng: number } };
      }>;
      results.push(
        ...raw.map((r) => ({
          place_id:          r.place_id,
          name:              r.name,
          formatted_address: r.vicinity ?? "", // nearbysearch returns vicinity, not formatted_address
          geometry:          r.geometry,
        }))
      );
      pageToken = data.next_page_token as string | undefined;
      if (!pageToken) break;
    } catch {
      break;
    }
  }
  return results;
}

export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();

  // Single-ID lookup: ?gid=ChIJ... bypasses all search and fetches details directly.
  const gid = req.nextUrl.searchParams.get("gid")?.trim();
  if (gid) {
    if (!GOOGLE_KEY) return NextResponse.json({ branches: [] });
    const candidate: RawResult = { place_id: gid, name: "", formatted_address: "" };
    const branch = await fetchBranchDetail(candidate, 0);
    return NextResponse.json({ branches: branch ? [branch] : [] });
  }

  const name     = req.nextUrl.searchParams.get("name")?.trim() ?? "";
  const paginate = req.nextUrl.searchParams.get("paginate") === "true";
  // With nearbysearch running in parallel, effective coverage is higher.
  // Keep the limit at 60 for paginate mode but allow both search types to contribute.
  const textPages   = paginate ? 3 : 1;
  const nearbyPages = paginate ? 2 : 1;
  const limitMax    = paginate ? 80 : 20;
  const limit = Math.min(
    parseInt(req.nextUrl.searchParams.get("limit") ?? (paginate ? "80" : "20")),
    limitMax
  );

  if (!name || !GOOGLE_KEY) return NextResponse.json({ branches: [] });

  // Run textsearch and nearbysearch IN PARALLEL so nearbysearch doesn't add wall-clock time.
  // They use different ranking algorithms and surface different subsets of the same chain.
  let textError: string | null = null;
  const [textResults, nearbyResults] = await Promise.all([
    runTextSearch(name, textPages).catch((err: Error) => {
      textError = err.message;
      return [] as RawResult[];
    }),
    runNearbySearch(name, nearbyPages).catch(() => [] as RawResult[]),
  ]);

  if (textError && !textResults.length && !nearbyResults.length) {
    return NextResponse.json({ branches: [], error: textError });
  }

  // Merge: textsearch first (generally more relevant), nearbysearch adds missing branches.
  const seen = new Set<string>(textResults.map((r) => r.place_id));
  const candidates: RawResult[] = [...textResults];
  for (const r of nearbyResults) {
    if (!seen.has(r.place_id)) {
      seen.add(r.place_id);
      candidates.push(r);
    }
  }

  const limited = candidates.slice(0, limit);

  // Fetch full details for every candidate in parallel.
  const branches = await Promise.all(limited.map((c, i) => fetchBranchDetail(c, i)));

  return NextResponse.json({ branches: branches.filter(Boolean) });
}
