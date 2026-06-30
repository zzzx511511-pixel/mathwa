const KEY = process.env.GOOGLE_PLACES_API_KEY ?? "";
const BASE = "https://places.googleapis.com/v1";

export async function fetchGooglePhotoNames(query: string, maxCount: number): Promise<string[]> {
  if (!KEY) {
    console.error("[google-photos] GOOGLE_PLACES_API_KEY is not set — set it in Vercel env vars");
    return [];
  }
  try {
    const res = await fetch(`${BASE}/places:searchText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": KEY,
        "X-Goog-FieldMask": "places.photos",
      },
      // Places API (New) uses "pageSize", NOT "maxResultCount" (old API field)
      body: JSON.stringify({ textQuery: query, pageSize: 1 }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[google-photos] Text Search ${res.status}: ${body}`);
      return [];
    }
    const data = await res.json();
    const photos: Array<{ name: string }> = data.places?.[0]?.photos ?? [];
    if (photos.length === 0) {
      console.warn(`[google-photos] no photos found for: "${query}"`);
    }
    return photos.slice(0, maxCount).map((p) => p.name);
  } catch (err) {
    console.error("[google-photos] Text Search threw:", err);
    return [];
  }
}

export async function fetchGooglePhotoUri(photoName: string): Promise<string | null> {
  if (!KEY) return null;
  try {
    const res = await fetch(
      `${BASE}/${photoName}/media?maxWidthPx=800&skipHttpRedirect=true`,
      { headers: { "X-Goog-Api-Key": KEY } }
    );
    if (!res.ok) {
      console.error(`[google-photos] media ${res.status} for: ${photoName.slice(0, 80)}`);
      return null;
    }
    const data = await res.json();
    return (data.photoUri as string) ?? null;
  } catch (err) {
    console.error("[google-photos] media threw:", err);
    return null;
  }
}
