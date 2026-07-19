/**
 * GET /api/admin/place-info?place_id=X
 *
 * Returns the full branch list (id, name, address, lat, lng) for one place.
 * Used by the full-branch-fetch UI to detect already-registered branches.
 */
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/salsabeel/admin-auth";
import { getCustomPlaces } from "@/lib/salsabeel/supabase-places";
import { mergePlaces } from "@/lib/salsabeel/data";

export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();

  const place_id = req.nextUrl.searchParams.get("place_id")?.trim();
  if (!place_id) {
    return NextResponse.json({ error: "place_id required" }, { status: 400 });
  }

  const allPlaces = mergePlaces(await getCustomPlaces());
  const place = allPlaces.find((p) => p.id === place_id);
  if (!place) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({
    id:   place.id,
    name: place.name,
    branches: place.branches.map((b) => ({
      id:      b.id,
      name:    b.name,
      address: b.address,
      lat:     b.lat,
      lng:     b.lng,
    })),
  });
}
