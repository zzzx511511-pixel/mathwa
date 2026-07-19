/**
 * GET /api/admin/check-place-id?gid=<placeId>
 * Diagnostic: calls Google Places API and returns the name/address/types
 * for the given Place ID. Used to verify a stored googlePlaceId is correct.
 */
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/salsabeel/admin-auth";

const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY ?? "";
const PLACES_BASE = "https://maps.googleapis.com/maps/api/place";

export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();

  const gid = req.nextUrl.searchParams.get("gid");
  if (!gid) {
    return NextResponse.json({ error: "gid parameter required" }, { status: 400 });
  }
  if (!GOOGLE_KEY) {
    return NextResponse.json({ error: "GOOGLE_PLACES_API_KEY not configured" }, { status: 500 });
  }

  const url =
    `${PLACES_BASE}/details/json` +
    `?place_id=${encodeURIComponent(gid)}` +
    `&fields=name,formatted_address,types,business_status,photos` +
    `&language=ar` +
    `&key=${GOOGLE_KEY}`;

  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json() as {
    status: string;
    result?: {
      name?: string;
      formatted_address?: string;
      types?: string[];
      business_status?: string;
      photos?: { photo_reference: string }[];
    };
    error_message?: string;
  };

  if (data.status !== "OK") {
    return NextResponse.json(
      { error: `Google API error: ${data.status}`, detail: data.error_message },
      { status: 400 }
    );
  }

  const r = data.result!;
  return NextResponse.json({
    place_id: gid,
    name: r.name,
    address: r.formatted_address,
    types: r.types,
    business_status: r.business_status,
    photo_count: r.photos?.length ?? 0,
    maps_url: `https://www.google.com/maps/place/?q=place_id:${gid}`,
  });
}
