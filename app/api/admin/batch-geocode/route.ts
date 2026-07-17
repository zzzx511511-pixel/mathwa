/**
 * POST /api/admin/batch-geocode
 * Auth-guarded. Geocodes a batch of places that have no place-level lat/lng.
 * Calls Google Places findplacefromtext for each, saves lat/lng + googlePlaceId
 * at the place level in Supabase. Does NOT touch branches.
 *
 * Body: { offset?: number; limit?: number; dry_run?: boolean }
 * Response: { done, processed, updated, failed, skipped, next_offset, total_pending }
 */
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/salsabeel/admin-auth";
import { getCustomPlaces, upsertCustomPlace } from "@/lib/salsabeel/supabase-places";
import { mergePlaces } from "@/lib/salsabeel/data";
import type { Place } from "@/lib/salsabeel/types";

const GOOGLE_KEY   = process.env.GOOGLE_PLACES_API_KEY ?? "";
const PLACES_BASE  = "https://maps.googleapis.com/maps/api/place";
const DELAY_MS     = 120; // ~8 req/sec — well within the 10 QPS limit

async function geocodePlace(
  place: Place
): Promise<{ lat: number; lng: number; placeId: string } | null> {
  if (!GOOGLE_KEY) return null;

  const branch    = place.branches[0];
  // Build the most specific query possible: name + neighborhood + address + city
  const queryParts = [
    place.name,
    branch?.neighborhood ?? place.neighborhood,
    branch?.address      ?? place.address,
    "الرياض",
  ].filter(Boolean);
  const query = queryParts.join(" ");

  try {
    const params = new URLSearchParams({
      input:     query,
      inputtype: "textquery",
      fields:    "geometry,place_id",
      language:  "ar",
      // Bias toward Riyadh centre (30 km radius)
      locationbias: "circle:30000@24.687731,46.721893",
      key: GOOGLE_KEY,
    });
    const res = await fetch(`${PLACES_BASE}/findplacefromtext/json?${params}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== "OK") return null;

    const candidate = data.candidates?.[0];
    const loc       = candidate?.geometry?.location;
    if (!loc?.lat || !loc?.lng) return null;

    return { lat: loc.lat, lng: loc.lng, placeId: candidate.place_id ?? "" };
  } catch {
    return null;
  }
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();

  if (!GOOGLE_KEY) {
    return NextResponse.json(
      { error: "GOOGLE_PLACES_API_KEY غير مضبوط" },
      { status: 503 }
    );
  }

  let body: { offset?: number; limit?: number; dry_run?: boolean } = {};
  try { body = await req.json(); } catch { /* empty body = defaults */ }

  const offset  = Number(body.offset  ?? 0);
  const limit   = Math.min(Number(body.limit ?? 30), 50); // cap at 50 per request
  const dryRun  = body.dry_run ?? false;

  const allPlaces   = mergePlaces(await getCustomPlaces());
  // Only process places that don't yet have place-level coordinates.
  const pending     = allPlaces.filter((p) => !p.lat || !p.lng);
  const slice       = pending.slice(offset, offset + limit);

  let updated = 0;
  let failed  = 0;
  let skipped = 0;

  for (const place of slice) {
    const geo = await geocodePlace(place);

    if (!geo) {
      failed++;
    } else if (!dryRun) {
      const ok = await upsertCustomPlace({
        ...place,
        lat: geo.lat,
        lng: geo.lng,
        // Only set googlePlaceId if not already present
        ...(place.googlePlaceId ? {} : { googlePlaceId: geo.placeId }),
      });
      if (ok) updated++;
      else failed++;
    } else {
      // dry_run — count what would be updated
      skipped++;
    }

    await delay(DELAY_MS);
  }

  const nextOffset   = offset + slice.length;
  const done         = nextOffset >= pending.length;
  const remaining    = Math.max(0, pending.length - nextOffset);

  return NextResponse.json({
    done,
    processed:     slice.length,
    updated,
    failed,
    skipped,
    next_offset:   nextOffset,
    total_pending: pending.length,
    remaining,
  });
}

// GET — returns summary counts (no Google call, no side effects)
export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();

  const allPlaces = mergePlaces(await getCustomPlaces());
  const withCoords    = allPlaces.filter((p) => p.lat && p.lng).length;
  const withoutCoords = allPlaces.filter((p) => !p.lat || !p.lng).length;

  return NextResponse.json({
    total:        allPlaces.length,
    with_coords:  withCoords,
    without_coords: withoutCoords,
    google_key_set: !!GOOGLE_KEY,
  });
}
