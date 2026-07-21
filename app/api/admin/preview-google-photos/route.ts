import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/salsabeel/admin-auth";
import { fetchGooglePhotoRefsPreview } from "@/lib/salsabeel/place-photos";

// Returns Google photo refs + proxy preview URLs without storing anything.
// Admin can then choose which photos to save via /api/admin/save-selected-photos.
export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();

  const gid   = req.nextUrl.searchParams.get("gid") ?? null;
  const name  = req.nextUrl.searchParams.get("name") ?? "";
  const nbh   = req.nextUrl.searchParams.get("nbh") ?? undefined;
  const count = Math.min(parseInt(req.nextUrl.searchParams.get("count") ?? "10", 10), 20);

  if (!name && !gid) {
    return NextResponse.json({ error: "name أو gid مطلوب" }, { status: 400 });
  }

  const refs = await fetchGooglePhotoRefsPreview(gid, name, nbh, count);

  const items = refs.map((ref) => ({
    ref,
    // Proxy URL: resolves the ref via Google and redirects — no API key in response
    previewUrl: `/api/place-photo-img?ref=${encodeURIComponent(ref)}&maxwidth=400`,
  }));

  return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
}
