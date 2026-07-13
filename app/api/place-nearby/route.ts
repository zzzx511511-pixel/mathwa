import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/salsabeel/admin-auth";

const GOOGLE_KEY  = process.env.GOOGLE_PLACES_API_KEY ?? "";
const PLACES_BASE = "https://maps.googleapis.com/maps/api/place";

export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();

  const lat  = req.nextUrl.searchParams.get("lat");
  const lng  = req.nextUrl.searchParams.get("lng");
  const name = req.nextUrl.searchParams.get("name")?.trim() ?? "";

  if (!lat || !lng) return NextResponse.json({ results: [] });
  if (!GOOGLE_KEY) return NextResponse.json({ error: "مفتاح Google غير موجود" }, { status: 500 });

  try {
    const nearbyParams = new URLSearchParams({
      location: `${lat},${lng}`,
      radius: "500",
      language: "ar",
      key: GOOGLE_KEY,
      ...(name ? { keyword: name } : {}),
    });

    const fetches: Promise<Response>[] = [
      fetch(`${PLACES_BASE}/nearbysearch/json?${nearbyParams}`, { signal: AbortSignal.timeout(8000) }),
    ];

    // textsearch includes CLOSED_TEMPORARILY places that nearbysearch may omit
    if (name) {
      const textParams = new URLSearchParams({
        query: name,
        location: `${lat},${lng}`,
        radius: "500",
        language: "ar",
        key: GOOGLE_KEY,
      });
      fetches.push(fetch(`${PLACES_BASE}/textsearch/json?${textParams}`, { signal: AbortSignal.timeout(8000) }));
    }

    const responses = await Promise.all(fetches);
    const jsons = await Promise.all(
      responses.map((r) => (r.ok ? r.json() : Promise.resolve({ results: [] }))),
    );

    type NearbyResult = { place_id: string; name: string; vicinity: string };
    type TextResult   = { place_id: string; name: string; formatted_address: string };

    const seen   = new Set<string>();
    const merged: { place_id: string; name: string; address: string }[] = [];

    for (const r of ((jsons[0]?.results ?? []) as NearbyResult[])) {
      if (!seen.has(r.place_id)) {
        seen.add(r.place_id);
        merged.push({ place_id: r.place_id, name: r.name, address: r.vicinity });
      }
    }

    if (jsons[1]) {
      for (const r of ((jsons[1]?.results ?? []) as TextResult[])) {
        if (!seen.has(r.place_id)) {
          seen.add(r.place_id);
          merged.push({ place_id: r.place_id, name: r.name, address: r.formatted_address });
        }
      }
    }

    return NextResponse.json({ results: merged.slice(0, 6) });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
