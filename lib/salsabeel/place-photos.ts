// Google Places API (Legacy) → Supabase Storage photo cache.
// First call fetches from Google and stores permanently.
// All subsequent calls serve from Supabase (no Google hit).

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const GOOGLE_KEY   = process.env.GOOGLE_PLACES_API_KEY ?? "";
const BUCKET       = "place-photos";
const PLACES_BASE  = "https://maps.googleapis.com/maps/api/place";

// Per-Place-ID photo indices to skip when fetching from Google.
// Only needed when Google's own data for a specific place contains photos
// from a neighbouring business (a Google Maps data error, not a code bug).
const PHOTO_INDEX_SKIP: Record<string, number[]> = {
  "ChIJZ90PzfzjLj4RMLsLHRLkIAY": [0], // بيك — Google photo[0] is فلافل ثمار
};

function storageHeaders(extra?: Record<string, string>) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

// Create the bucket if it doesn't exist (idempotent — 409 = already exists).
async function ensureBucket(): Promise<void> {
  try {
    await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: "POST",
      headers: storageHeaders(),
      body: JSON.stringify({
        id: BUCKET,
        name: BUCKET,
        public: true,
        file_size_limit: 5242880, // 5 MB
      }),
    });
  } catch {
    // ignore
  }
}

// List cached photos, check for sentinels, and return raw file names for cleanup.
// .skip       → admin deleted photos, don't auto-refetch
// .gid-<id>-<N> → the Google Place ID used to fetch the photos, and N = how many
//                  were successfully stored. The count is the authoritative cap when
//                  serving from cache — prevents stale leftover photos from leaking
//                  in even if the pre-clear step failed silently.
async function getStoredState(
  placeId: string,
  count: number
): Promise<{ urls: string[]; skipGoogle: boolean; storedGid: string | null; storedCount: number; fileNames: string[] }> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return { urls: [], skipGoogle: false, storedGid: null, storedCount: 0, fileNames: [] };
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
      method: "POST",
      headers: storageHeaders(),
      body: JSON.stringify({
        prefix: `${placeId}/`,
        limit: 20,
        sortBy: { column: "name", order: "asc" },
      }),
    });
    if (!res.ok) return { urls: [], skipGoogle: false, storedGid: null, storedCount: 0, fileNames: [] };
    const files: { name: string; updated_at?: string }[] = await res.json();
    const fileNames = files.map((f) => f.name);
    const skipGoogle = files.some((f) => f.name === ".skip");

    // Parse ".gid-<encodedId>-<count>" — the trailing "-<digits>" is the photo count.
    // Prefer the newer format (with count suffix) over legacy (without) when both exist.
    const gidFile =
      files.find((f) => f.name.startsWith(".gid-") && /-\d+$/.test(f.name)) ??
      files.find((f) => f.name.startsWith(".gid-"));
    let storedGid: string | null = null;
    let storedCount = 0;
    if (gidFile) {
      const raw = gidFile.name.slice(5); // strip ".gid-"
      const countMatch = raw.match(/-(\d+)$/);
      if (countMatch) {
        storedCount = parseInt(countMatch[1], 10);
        storedGid = decodeURIComponent(raw.slice(0, raw.length - countMatch[0].length));
      } else {
        // Legacy sentinel without count — treat count as unknown (conservative: 0 to force re-fetch).
        storedGid = decodeURIComponent(raw);
        storedCount = 0;
      }
    }

    const urls = files
      .filter((f) => /photo_\d+\.(jpg|jpeg|png|webp)$/i.test(f.name))
      .slice(0, count)
      .map((f) => {
        // Append updated_at as a cache-buster so CDN edges don't serve stale
        // content after a delete+re-upload of the same filename.
        const base = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${placeId}/${f.name}`;
        return f.updated_at ? `${base}?t=${encodeURIComponent(f.updated_at)}` : base;
      });
    return { urls, skipGoogle, storedGid, storedCount, fileNames };
  } catch {
    return { urls: [], skipGoogle: false, storedGid: null, storedCount: 0, fileNames: [] };
  }
}

// Delete all photo files and any .gid-* sentinels (but leave .skip intact).
async function clearPhotosAndGid(placeId: string, fileNames: string[]): Promise<void> {
  const toClear = fileNames.filter(
    (n) => /photo_\d+\.(jpg|jpeg|png|webp)$/i.test(n) || n.startsWith(".gid-")
  );
  if (!toClear.length) return;
  await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}`, {
    method: "DELETE",
    headers: storageHeaders(),
    body: JSON.stringify({ prefixes: toClear.map((n) => `${placeId}/${n}`) }),
  });
}

// Write a sentinel recording which Google Place ID was used and how many photos were stored.
async function writeGidSentinel(placeId: string, googlePlaceId: string, count: number): Promise<void> {
  const filename = `.gid-${encodeURIComponent(googlePlaceId)}-${count}`;
  await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${placeId}/${filename}`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "text/plain",
        "x-upsert": "true",
      },
      body: "1",
    }
  );
}

async function writeSentinel(placeId: string): Promise<void> {
  await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${placeId}/.skip`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "text/plain",
      "x-upsert": "true",
    },
    body: "1",
  });
}

export async function clearSkipSentinel(placeId: string): Promise<void> {
  await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}`, {
    method: "DELETE",
    headers: storageHeaders(),
    body: JSON.stringify({ prefixes: [`${placeId}/.skip`] }),
  });
}

// Delete all cached photos for a place and write a .skip sentinel so Google
// doesn't auto-refetch on the next page visit.
export async function deleteStoredPhotos(placeId: string): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return false;
  try {
    const listRes = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
      method: "POST",
      headers: storageHeaders(),
      body: JSON.stringify({ prefix: `${placeId}/`, limit: 50 }),
    });
    if (!listRes.ok) return false;
    const files: { name: string }[] = await listRes.json();

    // Delete all existing files (photos + any old sentinel)
    if (files.length) {
      const paths = files.map((f) => `${placeId}/${f.name}`);
      const delRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}`, {
        method: "DELETE",
        headers: storageHeaders(),
        body: JSON.stringify({ prefixes: paths }),
      });
      if (!delRes.ok) return false;
    }

    // Write sentinel to prevent Google auto-refetch
    await writeSentinel(placeId);
    return true;
  } catch {
    return false;
  }
}

// Delete a single wrong photo and clear .gid-* sentinels so the next page visit
// fetches a fresh replacement from Google. Other correct photos are left intact
// but will also be re-fetched (clearPhotosAndGid runs before any Google call).
// Does NOT write .skip — auto-refetch is desirable here.
export async function deleteSpecificPhoto(placeId: string, photoUrl: string): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return false;
  try {
    // Extract filename from the Supabase public URL.
    // URL shape: .../object/public/place-photos/{placeId}/{filename}
    const filename = photoUrl.split("/").pop();
    if (!filename || !/^photo_\d+\.(jpg|jpeg|png|webp)$/i.test(filename)) return false;

    const listRes = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
      method: "POST",
      headers: storageHeaders(),
      body: JSON.stringify({ prefix: `${placeId}/`, limit: 50 }),
    });
    if (!listRes.ok) return false;
    const files: { name: string }[] = await listRes.json();

    // Delete the specific photo + all .gid-* sentinels.
    // Clearing .gid-* means getPlacePhotos will see a cache miss on next request
    // and re-fetch all photos fresh from Google (with the correct googlePlaceId).
    const toDelete = files
      .filter((f) => f.name === filename || f.name.startsWith(".gid-"))
      .map((f) => `${placeId}/${f.name}`);

    if (toDelete.length) {
      await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}`, {
        method: "DELETE",
        headers: storageHeaders(),
        body: JSON.stringify({ prefixes: toDelete }),
      });
    }
    return true;
  } catch {
    return false;
  }
}

// Fetch via Place ID (accurate — no text-search guessing).
async function fetchGoogleDataById(
  googlePlaceId: string,
  count: number
): Promise<{ refs: string[]; businessStatus: string | null }> {
  if (!GOOGLE_KEY) return { refs: [], businessStatus: null };
  try {
    const params = new URLSearchParams({
      place_id: googlePlaceId,
      fields: "photos,business_status",
      key: GOOGLE_KEY,
    });
    const res = await fetch(`${PLACES_BASE}/details/json?${params}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { refs: [], businessStatus: null };
    const data = await res.json();
    if (data.status !== "OK") {
      console.error(`[place-photos] Details status=${data.status} | place_id=${googlePlaceId}`);
      return { refs: [], businessStatus: null };
    }
    const photos: { photo_reference: string }[] = data.result?.photos ?? [];
    const skip     = PHOTO_INDEX_SKIP[googlePlaceId] ?? [];
    const eligible = skip.length ? photos.filter((_, i) => !skip.includes(i)) : photos;
    return {
      refs: eligible.slice(0, count).map((p: { photo_reference: string }) => p.photo_reference),
      businessStatus: data.result?.business_status ?? null,
    };
  } catch (err) {
    console.error("[place-photos] fetchGoogleDataById threw:", err);
    return { refs: [], businessStatus: null };
  }
}

// Fetch photo references + business_status from Google Places Legacy API.
async function fetchGoogleData(
  query: string,
  count: number
): Promise<{ refs: string[]; businessStatus: string | null }> {
  if (!GOOGLE_KEY) return { refs: [], businessStatus: null };
  try {
    const params = new URLSearchParams({
      input: query,
      inputtype: "textquery",
      fields: "photos,business_status",
      language: "ar",
      locationbias: "circle:30000@24.687731,46.721893",
      key: GOOGLE_KEY,
    });
    const res = await fetch(`${PLACES_BASE}/findplacefromtext/json?${params}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { refs: [], businessStatus: null };
    const data = await res.json();
    if (data.status !== "OK") {
      const hint = `${GOOGLE_KEY.slice(0, 8)}...${GOOGLE_KEY.slice(-4)} (len=${GOOGLE_KEY.length})`;
      console.error(
        `[place-photos] Google status=${data.status} | ${data.error_message ?? ""} | key=${hint}`
      );
      return { refs: [], businessStatus: null };
    }
    const candidate = data.candidates?.[0];
    const photos: { photo_reference: string }[] = candidate?.photos ?? [];
    const businessStatus: string | null = candidate?.business_status ?? null;
    return {
      refs: photos.slice(0, count).map((p: { photo_reference: string }) => p.photo_reference),
      businessStatus,
    };
  } catch (err) {
    console.error("[place-photos] fetchGoogleData threw:", err);
    return { refs: [], businessStatus: null };
  }
}

function dbHeaders(extra?: Record<string, string>) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

export async function saveBusinessStatus(placeId: string, status: string): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/place_status`, {
      method: "POST",
      headers: dbHeaders({ Prefer: "resolution=merge-duplicates" }),
      body: JSON.stringify({ id: placeId, business_status: status, checked_at: new Date().toISOString() }),
    });
  } catch {
    // non-critical
  }
}

export interface PlaceStatus {
  id: string;
  business_status: string;
  checked_at: string;
}

export async function getPlaceStatuses(): Promise<PlaceStatus[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/place_status?select=id,business_status,checked_at`,
      { headers: dbHeaders() }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function getPlaceStatus(placeId: string): Promise<string | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/place_status?id=eq.${encodeURIComponent(placeId)}&select=business_status&limit=1`,
      { headers: dbHeaders() }
    );
    if (!res.ok) return null;
    const rows: { business_status: string }[] = await res.json();
    return rows[0]?.business_status ?? null;
  } catch {
    return null;
  }
}

// Explicitly check and save business_status for a single place (no photo side effect).
export async function checkAndSavePlaceStatus(
  placeId: string,
  placeName: string,
  neighborhood?: string,
  googlePlaceId?: string
): Promise<string | null> {
  if (!GOOGLE_KEY) return null;
  const { businessStatus } = googlePlaceId
    ? await fetchGoogleDataById(googlePlaceId, 0)
    : await fetchGoogleData([placeName, neighborhood, "الرياض"].filter(Boolean).join(" "), 0);
  if (businessStatus) await saveBusinessStatus(placeId, businessStatus);
  return businessStatus;
}

// Download one photo from Google and upload it to Supabase Storage.
async function downloadAndStore(
  placeId: string,
  photoRef: string,
  index: number
): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      maxwidth: "800",
      photo_reference: photoRef,
      key: GOOGLE_KEY,
    });
    // Google Places Photo API 302-redirects to the public CDN; fetch follows automatically.
    const imgRes = await fetch(`${PLACES_BASE}/photo?${params}`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!imgRes.ok) {
      console.error(`[place-photos] Google photo HTTP ${imgRes.status}`);
      return null;
    }

    const buffer  = await imgRes.arrayBuffer();
    const mime    = imgRes.headers.get("content-type") ?? "image/jpeg";
    const ext     = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
    const path    = `${placeId}/photo_${index}.${ext}`;

    const uploadRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": mime,
          "x-upsert": "true",
          "Cache-Control": "public, max-age=31536000",
        },
        body: buffer,
      }
    );

    if (!uploadRes.ok) {
      const detail = await uploadRes.text().catch(() => "");
      console.error(`[place-photos] Supabase upload failed (${placeId}/${index}): ${detail}`);
      return null;
    }

    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
  } catch (err) {
    console.error(`[place-photos] downloadAndStore threw (${placeId}/${index}):`, err);
    return null;
  }
}

/**
 * Fetch photo refs from Google without storing anything — used by the admin
 * preview flow so the admin can select which photos to keep before saving.
 */
export async function fetchGooglePhotoRefsPreview(
  googlePlaceId: string | null,
  placeName: string,
  neighborhood: string | undefined,
  count = 10
): Promise<string[]> {
  if (!GOOGLE_KEY) return [];
  const { refs } = googlePlaceId
    ? await fetchGoogleDataById(googlePlaceId, count)
    : await fetchGoogleData(
        [placeName, neighborhood, "الرياض"].filter(Boolean).join(" "),
        count
      );
  return refs;
}

/**
 * Download and store only the admin-selected photo refs.
 * Clears previous photos + GID sentinels, then stores the selected subset.
 * If refs is empty, writes .skip to prevent auto-refetch.
 */
export async function storeSelectedPhotos(
  placeId: string,
  googlePlaceId: string,
  refs: string[]
): Promise<string[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  await ensureBucket();
  const { fileNames } = await getStoredState(placeId, 20);
  // Clear old photos, GID sentinels, and any existing .skip
  await clearPhotosAndGid(placeId, fileNames);
  await clearSkipSentinel(placeId);

  if (!refs.length) {
    // Admin chose no photos — write .skip so Google doesn't auto-refetch
    await writeSentinel(placeId);
    return [];
  }

  const results = await Promise.all(refs.map((ref, i) => downloadAndStore(placeId, ref, i)));
  const stored = results.filter(Boolean) as string[];
  await writeGidSentinel(placeId, googlePlaceId, stored.length);
  return stored;
}

/**
 * Get up to `count` photos for a place.
 * Checks Supabase Storage first; fetches from Google and stores if missing.
 *
 * When `googlePlaceId` is provided the function ONLY ever fetches from that
 * exact Place ID — no text-search fallback, no mixing from other sources.
 * If the Place ID yields fewer photos than `count`, only those photos are
 * returned; the count is never padded from another source.
 */
export async function getPlacePhotos(
  placeId: string,
  placeName: string,
  neighborhood?: string,
  count = 2,
  googlePlaceId?: string
): Promise<string[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];

  // 1. Check cache, skip-sentinel, and source tracking in one Storage call.
  const { urls: cached, skipGoogle, storedGid, storedCount, fileNames } = await getStoredState(placeId, count);

  // Admin manually cleared photos — don't auto-refetch from Google.
  if (skipGoogle) return [];

  if (googlePlaceId) {
    // ── Place-ID path ──────────────────────────────────────────────────────
    // Cache hit: photos were fetched with the same Place ID.
    // Use storedCount (from sentinel filename) as the authoritative cap — prevents
    // stale leftover photos from leaking in even if the pre-clear DELETE failed.
    if (storedGid === googlePlaceId && storedCount > 0) return cached.slice(0, storedCount);

    // Cache miss or stale (different source): clear old photos/gid and re-fetch.
    if (!GOOGLE_KEY) return [];
    await ensureBucket();
    await clearPhotosAndGid(placeId, fileNames);

    const { refs, businessStatus } = await fetchGoogleDataById(googlePlaceId, count);
    if (businessStatus) saveBusinessStatus(placeId, businessStatus).catch(() => {});

    if (!refs.length) {
      // No photos from this Place ID — write a zero-count sentinel so we don't
      // re-fetch every page load, and return empty.
      await writeGidSentinel(placeId, googlePlaceId, 0);
      return [];
    }

    const results = await Promise.all(refs.map((ref, i) => downloadAndStore(placeId, ref, i)));
    const stored = results.filter(Boolean) as string[];

    // Record source + exact count stored. On the next cache read, slice(0, storedCount)
    // ensures no stale photos beyond this count can be served.
    await writeGidSentinel(placeId, googlePlaceId, stored.length);

    // Return only what this Place ID provided — never supplement from another source.
    return stored;
  }

  // ── Text-search path (no googlePlaceId) ───────────────────────────────────
  if (cached.length >= count) return cached.slice(0, count);
  if (!GOOGLE_KEY) return cached;
  await ensureBucket();

  const { refs, businessStatus } = await fetchGoogleData(
    [placeName, neighborhood, "الرياض"].filter(Boolean).join(" "),
    count
  );
  if (businessStatus) saveBusinessStatus(placeId, businessStatus).catch(() => {});
  if (!refs.length) return cached;

  const results = await Promise.all(refs.map((ref, i) => downloadAndStore(placeId, ref, i)));
  const stored = results.filter(Boolean) as string[];
  return stored.length ? stored : cached;
}
