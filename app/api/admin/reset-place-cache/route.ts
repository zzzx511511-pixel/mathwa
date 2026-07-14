/**
 * POST /api/admin/reset-place-cache
 * Body: {
 *   place_id:       string   — Supabase folder to clear (e.g. "c104")
 *   google_place_id: string  — Google Place ID to re-fetch from
 *   place_name:     string   — display name (e.g. "بيك")
 *   count?:         number   — how many photos to fetch (default 2)
 *   delete_debug?:  boolean  — also delete _debug/<google_place_id>/ (default true)
 * }
 *
 * Steps:
 *   1. Delete all photos + .gid-* in place_id/ (leaves .skip intact)
 *   2. Optionally delete _debug/<google_place_id>/
 *   3. Re-fetch photos from Google using the (now fixed) getPlacePhotos
 *   4. Return new photo URLs for verification
 */
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/salsabeel/admin-auth";
import { getPlacePhotos } from "@/lib/salsabeel/place-photos";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const BUCKET       = "place-photos";

const headers = {
  apikey:         SUPABASE_KEY,
  Authorization:  `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

async function listPrefix(prefix: string): Promise<string[]> {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ prefix: `${prefix}/`, limit: 200, sortBy: { column: "name", order: "asc" } }),
  });
  if (!res.ok) return [];
  const items: { name: string }[] = await res.json();
  return items.map((f) => f.name).filter(Boolean);
}

async function deleteByPrefix(prefix: string): Promise<void> {
  const names = await listPrefix(prefix);
  if (!names.length) return;
  await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}`, {
    method: "DELETE",
    headers,
    body: JSON.stringify({ prefixes: names.map((n) => `${prefix}/${n}`) }),
  });
}

async function clearPlaceStorage(placeId: string): Promise<void> {
  const names = await listPrefix(placeId);
  const toClear = names.filter((n) => /photo_\d+\.(jpg|jpeg|png|webp)$/i.test(n) || n.startsWith(".gid-"));
  if (!toClear.length) return;
  await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}`, {
    method: "DELETE",
    headers,
    body: JSON.stringify({ prefixes: toClear.map((n) => `${placeId}/${n}`) }),
  });
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();
  if (!SUPABASE_URL || !SUPABASE_KEY)
    return NextResponse.json({ error: "Supabase env vars not configured" }, { status: 500 });

  const body = await req.json() as {
    place_id: string;
    google_place_id: string;
    place_name: string;
    count?: number;
    delete_debug?: boolean;
  };

  const { place_id, google_place_id, place_name, count = 2, delete_debug = true } = body;
  if (!place_id || !google_place_id || !place_name)
    return NextResponse.json({ error: "place_id, google_place_id, and place_name are required" }, { status: 400 });

  try {
    // Step 1: clear existing photos + sentinel for the place
    await clearPlaceStorage(place_id);

    // Step 2: delete _debug folder for this Google Place ID (if requested)
    if (delete_debug) {
      await deleteByPrefix(`_debug/${google_place_id}`);
    }

    // Step 3: re-fetch from Google using the updated code (PHOTO_INDEX_SKIP applied)
    const photos = await getPlacePhotos(place_id, place_name, undefined, count, google_place_id);

    return NextResponse.json({
      place_id,
      google_place_id,
      cleared:    true,
      debug_deleted: delete_debug,
      new_photos: photos,
      count:      photos.length,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
