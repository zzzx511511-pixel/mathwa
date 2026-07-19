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
    // Deduplicate by id — keep first occurrence (newest, since ordered by created_at.desc).
    // Guards against duplicate rows if the table's id column lacks a unique constraint.
    const seen = new Set<string>();
    const result: Place[] = [];
    for (const row of rows) {
      if (!seen.has(row.data.id)) {
        seen.add(row.data.id);
        result.push(row.data);
      }
    }
    return result;
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

export async function getVisitCounts28d(): Promise<Record<string, number>> {
  if (!URL || !KEY) return {};
  try {
    const since = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString();
    const res = await fetch(
      `${URL}/rest/v1/place_visits?select=place_id&visited_at=gte.${encodeURIComponent(since)}&limit=50000`,
      { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, cache: "no-store" }
    );
    if (!res.ok) return {};
    const rows: { place_id: string }[] = await res.json();
    const counts: Record<string, number> = {};
    for (const row of rows) counts[row.place_id] = (counts[row.place_id] ?? 0) + 1;
    return counts;
  } catch {
    return {};
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
