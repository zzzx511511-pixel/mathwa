import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/salsabeel/admin-auth";
import { listStoredPhotos, deleteSpecificPhoto } from "@/lib/salsabeel/place-photos";

// GET /api/admin/storage-photos?place_id=X
// Returns current Storage photo URLs for a place (no Google fetch, read-only).
export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();

  const placeId = req.nextUrl.searchParams.get("place_id");
  if (!placeId) return NextResponse.json({ error: "place_id مطلوب" }, { status: 400 });

  const photos = await listStoredPhotos(placeId);
  return NextResponse.json({ photos }, { headers: { "Cache-Control": "no-store" } });
}

// DELETE /api/admin/storage-photos
// Body: { place_id, photo_url }
// Deletes a single Storage photo and clears .gid-* sentinels so Google re-fetches fresh.
export async function DELETE(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();

  let body: { place_id?: string; photo_url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const { place_id, photo_url } = body;
  if (!place_id || !photo_url) {
    return NextResponse.json({ error: "place_id و photo_url مطلوبان" }, { status: 400 });
  }

  const deleted = await deleteSpecificPhoto(place_id, photo_url);
  return NextResponse.json({ ok: true, deleted });
}
