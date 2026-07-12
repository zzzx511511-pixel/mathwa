import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/salsabeel/admin-auth";

const GOOGLE_KEY  = process.env.GOOGLE_PLACES_API_KEY ?? "";
const PLACES_BASE = "https://maps.googleapis.com/maps/api/place";

export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [] });
  if (!GOOGLE_KEY) return NextResponse.json({ error: "مفتاح Google غير موجود" }, { status: 500 });

  try {
    const params = new URLSearchParams({
      query: `${q} الرياض`,
      fields: "place_id,name,formatted_address",
      language: "ar",
      key: GOOGLE_KEY,
    });
    const res = await fetch(`${PLACES_BASE}/textsearch/json?${params}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return NextResponse.json({ results: [] });
    const data = await res.json();
    if (data.status !== "OK") return NextResponse.json({ results: [] });

    const results = (data.results as { place_id: string; name: string; formatted_address: string }[])
      .slice(0, 5)
      .map((r) => ({ place_id: r.place_id, name: r.name, address: r.formatted_address }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
