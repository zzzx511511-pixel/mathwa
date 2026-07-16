/**
 * GET /api/admin/places-full
 * Auth-guarded: returns the full merged Place[] (static + custom overrides).
 * Admin client pages use this instead of importing data.ts directly, so the
 * 857 KB static dataset stays out of the browser bundle.
 */
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/salsabeel/admin-auth";
import { getCustomPlaces } from "@/lib/salsabeel/supabase-places";
import { mergePlaces } from "@/lib/salsabeel/data";

export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();
  try {
    const places = mergePlaces(await getCustomPlaces());
    return NextResponse.json(places);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
