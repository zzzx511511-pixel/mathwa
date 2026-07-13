// Pending user requests (suggest place, report error, wrong photo).
//
// Required Supabase table — run once in the SQL editor:
//
//   CREATE TABLE pending_requests (
//     id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
//     type        text NOT NULL,
//     place_id    text,
//     place_name  text,
//     content     jsonb NOT NULL DEFAULT '{}',
//     status      text NOT NULL DEFAULT 'pending',
//     created_at  timestamptz DEFAULT now()
//   );
//   CREATE INDEX ON pending_requests (status, created_at DESC);

const URL = process.env.SUPABASE_URL ?? "";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

function headers(extra?: Record<string, string>) {
  return {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

export type RequestType   = "suggest_place" | "edit_place" | "wrong_photo";
export type RequestStatus = "pending" | "approved" | "rejected";

export interface PendingRequest {
  id: string;
  type: RequestType;
  place_id?: string;
  place_name?: string;
  content: Record<string, unknown>;
  status: RequestStatus;
  created_at: string;
}

export async function createRequest(
  data: Omit<PendingRequest, "id" | "status" | "created_at">
): Promise<boolean> {
  if (!URL || !KEY) return false;
  try {
    const res = await fetch(`${URL}/rest/v1/pending_requests`, {
      method: "POST",
      headers: headers({ Prefer: "return=minimal" }),
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getPendingRequests(): Promise<PendingRequest[]> {
  if (!URL || !KEY) return [];
  try {
    const res = await fetch(
      `${URL}/rest/v1/pending_requests?status=eq.pending&order=created_at.desc&limit=200`,
      { headers: headers(), cache: "no-store" }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function updateRequestStatus(
  id: string,
  status: RequestStatus
): Promise<boolean> {
  if (!URL || !KEY) return false;
  try {
    const res = await fetch(
      `${URL}/rest/v1/pending_requests?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: headers({ Prefer: "return=minimal" }),
        body: JSON.stringify({ status }),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}
