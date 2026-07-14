/**
 * TEMPORARY DEBUG ENDPOINT — remove after investigation.
 *
 * GET /api/admin/debug-place-photos?place_id=ChIJZ90PzfzjLj4RMLsLHRLkIAY&count=5
 *
 * Calls Google Place Details for the given place_id, downloads each photo,
 * stores them under _debug/<place_id>/ in Supabase Storage, and returns:
 *   - photo_reference values from Google
 *   - Supabase public URLs for visual inspection
 * This makes it possible to identify which photo_reference belongs to the wrong place.
 */
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/salsabeel/admin-auth";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const GOOGLE_KEY   = process.env.GOOGLE_PLACES_API_KEY ?? "";
const BUCKET       = "place-photos";
const PLACES_BASE  = "https://maps.googleapis.com/maps/api/place";

const storageH = {
  apikey:        SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

async function fetchPhotoRefs(
  googlePlaceId: string,
  count: number
): Promise<{ refs: string[]; attributions: string[]; rawCount: number }> {
  const params = new URLSearchParams({
    place_id: googlePlaceId,
    fields:   "photos",
    key:      GOOGLE_KEY,
  });
  const res  = await fetch(`${PLACES_BASE}/details/json?${params}`, { signal: AbortSignal.timeout(10000) });
  const data = await res.json();
  if (data.status !== "OK") throw new Error(`Google status: ${data.status} — ${data.error_message ?? ""}`);
  const photos: { photo_reference: string; html_attributions?: string[] }[] = data.result?.photos ?? [];
  return {
    rawCount:     photos.length,
    refs:         photos.slice(0, count).map((p) => p.photo_reference),
    attributions: photos.slice(0, count).map((p) => (p.html_attributions ?? []).join(", ")),
  };
}

async function downloadPhoto(ref: string): Promise<{ buffer: ArrayBuffer; mime: string } | null> {
  const params = new URLSearchParams({ maxwidth: "800", photo_reference: ref, key: GOOGLE_KEY });
  const res = await fetch(`${PLACES_BASE}/photo?${params}`, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) return null;
  return { buffer: await res.arrayBuffer(), mime: res.headers.get("content-type") ?? "image/jpeg" };
}

async function uploadDebug(path: string, buffer: ArrayBuffer, mime: string): Promise<string | null> {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      apikey:        SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": mime,
      "x-upsert":    "true",
    },
    body: buffer,
  });
  if (!res.ok) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();
  if (!SUPABASE_URL || !SUPABASE_KEY || !GOOGLE_KEY)
    return NextResponse.json({ error: "Missing env vars (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / GOOGLE_PLACES_API_KEY)" }, { status: 500 });

  const googlePlaceId = req.nextUrl.searchParams.get("place_id");
  const count         = Math.min(Number(req.nextUrl.searchParams.get("count") ?? "10"), 20);
  if (!googlePlaceId) return NextResponse.json({ error: "?place_id= required" }, { status: 400 });

  try {
    const { refs, attributions, rawCount } = await fetchPhotoRefs(googlePlaceId, count);

    const results = await Promise.all(
      refs.map(async (ref, i) => {
        const photo = await downloadPhoto(ref);
        if (!photo) return { index: i, ref, attribution: attributions[i], url: null, error: "download failed" };
        const ext  = photo.mime.includes("png") ? "png" : photo.mime.includes("webp") ? "webp" : "jpg";
        const path = `_debug/${googlePlaceId}/photo_${i}.${ext}`;
        const url  = await uploadDebug(path, photo.buffer, photo.mime);
        return { index: i, ref, attribution: attributions[i] ?? "", url };
      })
    );

    return NextResponse.json({
      google_place_id:  googlePlaceId,
      total_photos_google: rawCount,
      requested_count:  count,
      photos: results,
      note: "Photos stored under _debug/<place_id>/ in Supabase. Delete manually when done.",
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
