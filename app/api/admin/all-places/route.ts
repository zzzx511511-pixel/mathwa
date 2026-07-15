/**
 * GET /api/admin/all-places
 * Returns id, name, category, branches_count for every live place.
 * Used by the full-branch-fetch admin page to populate the place selector.
 */
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/salsabeel/admin-auth";
import { getCustomPlaces } from "@/lib/salsabeel/supabase-places";
import { mergePlaces } from "@/lib/salsabeel/data";

export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();
  try {
    const places = mergePlaces(await getCustomPlaces());
    return NextResponse.json({
      places: places.map((p) => ({
        id:            p.id,
        name:          p.name,
        category:      p.category,
        branches_count: p.branches.length,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
