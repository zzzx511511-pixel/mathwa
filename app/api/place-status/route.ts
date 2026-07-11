import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/salsabeel/admin-auth";
import { getPlaceStatuses, checkAndSavePlaceStatus } from "@/lib/salsabeel/place-photos";

export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();
  const statuses = await getPlaceStatuses();
  return NextResponse.json(statuses);
}

// Batch-check business status for a list of places against Google Places API.
// Body: { places: [{ id, name, neighborhood? }] }
export async function POST(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();
  try {
    const { places } = await req.json() as {
      places: { id: string; name: string; neighborhood?: string }[];
    };
    if (!Array.isArray(places) || places.length === 0) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }

    const results: { id: string; business_status: string | null }[] = [];

    // Check sequentially to avoid Google rate-limit errors.
    for (const p of places) {
      const status = await checkAndSavePlaceStatus(p.id, p.name, p.neighborhood);
      results.push({ id: p.id, business_status: status });
      // Small delay between calls to respect Google's rate limits.
      await new Promise((r) => setTimeout(r, 200));
    }

    return NextResponse.json({ ok: true, results });
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
}
