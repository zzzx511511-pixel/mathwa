// Google Places API (Legacy) → Supabase Storage photo cache.
// First call fetches from Google and stores permanently.
// All subsequent calls serve from Supabase (no Google hit).

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const GOOGLE_KEY   = process.env.GOOGLE_PLACES_API_KEY ?? "";
const BUCKET       = "place-photos";
const PLACES_BASE  = "https://maps.googleapis.com/maps/api/place";

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
// .skip  → admin deleted photos, don't auto-refetch
// .gid-* → the Google Place ID that was used to fetch the cached photos
async function getStoredState(
  placeId: string,
  count: number
): Promise<{ urls: string[]; skipGoogle: boolean; storedGid: string | null; fileNames: string[] }> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return { urls: [], skipGoogle: false, storedGid: null, fileNames: [] };
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
    if (!res.ok) return { urls: [], skipGoogle: false, storedGid: null, fileNames: [] };
    const files: { name: string }[] = await res.json();
    const fileNames = files.map((f) => f.name);
    const skipGoogle = files.some((f) => f.name === ".skip");
    const gidFile = files.find((f) => f.name.startsWith(".gid-"));
    const storedGid = gidFile ? decodeURIComponent(gidFile.name.slice(5)) : null;
    const urls = files
      .filter((f) => /photo_\d+\.(jpg|jpeg|png|webp)$/i.test(f.name))
      .slice(0, count)
      .map((f) => `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${placeId}/${f.name}`);
    return { urls, skipGoogle, storedGid, fileNames };
  } catch {
    return { urls: [], skipGoogle: false, storedGid: null, fileNames: [] };
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

// Write a sentinel recording which Google Place ID was used for the cached photos.
async function writeGidSentinel(placeId: string, googlePlaceId: string): Promise<void> {
  await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${placeId}/.gid-${encodeURIComponent(googlePlaceId)}`,
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
    return {
      refs: photos.slice(0, count).map((p: { photo_reference: string }) => p.photo_reference),
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
  const { urls: cached, skipGoogle, storedGid, fileNames } = await getStoredState(placeId, count);

  // Admin manually cleared photos — don't auto-refetch from Google.
  if (skipGoogle) return [];

  if (googlePlaceId) {
    // ── Place-ID path ──────────────────────────────────────────────────────
    // Cache hit: photos were fetched with the same Place ID → trust them.
    if (storedGid === googlePlaceId && cached.length > 0) return cached;

    // Cache miss or stale (different source): clear old photos/gid and re-fetch.
    if (!GOOGLE_KEY) return [];
    await ensureBucket();
    await clearPhotosAndGid(placeId, fileNames);

    const { refs, businessStatus } = await fetchGoogleDataById(googlePlaceId, count);
    if (businessStatus) saveBusinessStatus(placeId, businessStatus).catch(() => {});

    // Record the source regardless of how many photos we get.
    await writeGidSentinel(placeId, googlePlaceId);

    if (!refs.length) return [];

    const results = await Promise.all(refs.map((ref, i) => downloadAndStore(placeId, ref, i)));
    // Return only what this Place ID provided — never supplement from another source.
    return results.filter(Boolean) as string[];
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
