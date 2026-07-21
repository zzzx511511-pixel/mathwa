import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/salsabeel/admin-auth";
import { storeSelectedPhotos } from "@/lib/salsabeel/place-photos";

// Saves only the admin-selected photo refs to Supabase Storage.
// Clears any previously-cached photos and GID sentinels first.
export async function POST(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();

  let body: { place_id?: string; google_place_id?: string; refs?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const { place_id, google_place_id, refs } = body;
  if (!place_id || !google_place_id) {
    return NextResponse.json({ error: "place_id و google_place_id مطلوبان" }, { status: 400 });
  }

  const stored = await storeSelectedPhotos(place_id, google_place_id, refs ?? []);
  return NextResponse.json({ ok: true, count: stored.length, photos: stored });
}
