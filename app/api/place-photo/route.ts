import { NextRequest, NextResponse } from "next/server";
import { fetchGooglePhotoRefs } from "@/lib/salsabeel/google-photos";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const n = Math.min(parseInt(req.nextUrl.searchParams.get("n") ?? "1", 10), 5);
  if (!q) return NextResponse.json({ photos: [] });

  const refs = await fetchGooglePhotoRefs(q, n);
  const photos = refs.map(
    (ref) => `/api/place-photo-img?ref=${encodeURIComponent(ref)}`
  );

  return NextResponse.json({ photos }, {
    headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
  });
}
