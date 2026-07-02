// Uses Places API (Legacy): maps.googleapis.com/maps/api/place
// Endpoint: Find Place from Text → photo_reference → Photo redirect

const KEY = process.env.GOOGLE_PLACES_API_KEY ?? "";
const BASE = "https://maps.googleapis.com/maps/api/place";

export async function fetchGooglePhotoRefs(query: string, maxCount: number): Promise<string[]> {
  if (!KEY) {
    console.error("[google-photos] GOOGLE_PLACES_API_KEY is not set");
    return [];
  }
  try {
    const params = new URLSearchParams({
      input: query,
      inputtype: "textquery",
      fields: "photos",
      language: "ar",
      // bias toward Riyadh
      locationbias: "circle:30000@24.687731,46.721893",
      key: KEY,
    });
    const res = await fetch(`${BASE}/findplacefromtext/json?${params}`);
    if (!res.ok) {
      console.error(`[google-photos] FindPlace HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    if (data.status !== "OK") {
      const keyHint = `${KEY.slice(0, 8)}...${KEY.slice(-4)} (len=${KEY.length})`;
      console.error(`[google-photos] FindPlace status=${data.status} | ${data.error_message ?? ""} | key=${keyHint}`);
      return [];
    }
    const photos: Array<{ photo_reference: string }> = data.candidates?.[0]?.photos ?? [];
    if (photos.length === 0) {
      console.warn(`[google-photos] no photos for: "${query}"`);
    }
    return photos.slice(0, maxCount).map((p) => p.photo_reference);
  } catch (err) {
    console.error("[google-photos] FindPlace threw:", err);
    return [];
  }
}

// Resolves a photo_reference to the final Google CDN URL (no API key in result).
// The legacy Photo endpoint always 302-redirects to lh3.googleusercontent.com.
export async function fetchGooglePhotoCdnUrl(photoRef: string): Promise<string | null> {
  if (!KEY) return null;
  try {
    const params = new URLSearchParams({
      maxwidth: "800",
      photo_reference: photoRef,
      key: KEY,
    });
    const res = await fetch(`${BASE}/photo?${params}`);
    if (!res.ok) {
      console.error(`[google-photos] photo HTTP ${res.status}`);
      return null;
    }
    // After following redirect, res.url is the public CDN URL (no API key)
    return res.url ?? null;
  } catch (err) {
    console.error("[google-photos] photo threw:", err);
    return null;
  }
}
