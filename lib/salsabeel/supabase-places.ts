import type { Place } from "./types";

const URL  = process.env.SUPABASE_URL;
const KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

function headers() {
  return {
    apikey:        KEY!,
    Authorization: `Bearer ${KEY}`,
    "Content-Type": "application/json",
    Prefer:        "return=minimal",
  };
}

export async function getCustomPlaces(): Promise<Place[]> {
  if (!URL || !KEY) return [];
  try {
    const res = await fetch(`${URL}/rest/v1/custom_places?select=data&order=created_at.desc`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const rows: { data: Place }[] = await res.json();
    return rows.map((r) => r.data);
  } catch {
    return [];
  }
}

export async function upsertCustomPlace(place: Place): Promise<boolean> {
  if (!URL || !KEY) return false;
  try {
    const res = await fetch(`${URL}/rest/v1/custom_places`, {
      method: "POST",
      headers: { ...headers(), Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ id: place.id, data: place }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteCustomPlace(id: string): Promise<boolean> {
  if (!URL || !KEY) return false;
  try {
    const res = await fetch(
      `${URL}/rest/v1/custom_places?id=eq.${encodeURIComponent(id)}`,
      { method: "DELETE", headers: headers() }
    );
    return res.ok;
  } catch {
    return false;
  }
}
