import { NextRequest, NextResponse } from "next/server";

const KEY = process.env.GOOGLE_PLACES_API_KEY ?? "";
const BASE = "https://maps.googleapis.com/maps/api/place";

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref") ?? "";
  if (!ref || !KEY) return new NextResponse(null, { status: 400 });

  try {
    const params = new URLSearchParams({
      maxwidth: "800",
      photo_reference: ref,
      key: KEY,
    });
    const res = await fetch(`${BASE}/photo?${params}`);
    if (!res.ok) return new NextResponse(null, { status: res.status });

    // Redirect to the final public CDN URL (lh3.googleusercontent.com — no API key)
    return NextResponse.redirect(res.url);
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
