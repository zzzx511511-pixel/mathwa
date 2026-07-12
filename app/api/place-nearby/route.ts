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
    const params = new URLSearchParams({
      location: `${lat},${lng}`,
      radius: "300",
      language: "ar",
      key: GOOGLE_KEY,
      ...(name ? { keyword: name } : {}),
    });

    const res = await fetch(`${PLACES_BASE}/nearbysearch/json?${params}`, {
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return NextResponse.json({ results: [] });
    const data = await res.json();
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      return NextResponse.json({ results: [] });
    }

    const results = ((data.results ?? []) as {
      place_id: string;
      name: string;
      vicinity: string;
      types?: string[];
    }[])
      .slice(0, 6)
      .map((r) => ({
        place_id: r.place_id,
        name: r.name,
        address: r.vicinity,
      }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
