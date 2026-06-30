const KEY = process.env.GOOGLE_PLACES_API_KEY ?? "";
const BASE = "https://places.googleapis.com/v1";

export async function fetchGooglePhotoNames(query: string, maxCount: number): Promise<string[]> {
  if (!KEY) return [];
  try {
    const res = await fetch(`${BASE}/places:searchText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": KEY,
        "X-Goog-FieldMask": "places.photos",
      },
      body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const photos: Array<{ name: string }> = data.places?.[0]?.photos ?? [];
    return photos.slice(0, maxCount).map((p) => p.name);
  } catch {
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
    if (!res.ok) return null;
    const data = await res.json();
    return (data.photoUri as string) ?? null;
  } catch {
    return null;
  }
}
