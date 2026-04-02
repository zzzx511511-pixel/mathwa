import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function asText(v: unknown): string {
  return String(v ?? "").trim();
}

function isArchived(row: Record<string, unknown>): boolean {
  return Boolean(row.archived || row.is_archived || row.archived_at || String(row.status ?? "").toLowerCase() === "archived");
}

export async function POST(req: Request) {
  let body: { ownerId?: unknown } = {};
  try {
    body = (await req.json()) as { ownerId?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const ownerId = asText(body.ownerId);
  if (!ownerId) return NextResponse.json({ ok: false, error: "ownerId مطلوب." }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ ok: false, error: "missing_supabase_service_role_key" }, { status: 500 });
  }
  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data, error } = await db
    .from("properties")
    .select("id, name, location, city, owner_id, archived, is_archived, archived_at, status")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const properties = (data ?? [])
    .map((p) => p as Record<string, unknown>)
    .filter((p) => !isArchived(p))
    .map((p) => ({
      id: String(p.id ?? ""),
      name: String(p.name ?? "").trim() || "—",
      location: String(p.location ?? "").trim() || "",
      city: String(p.city ?? "").trim() || ""
    }))
    .filter((p) => p.id);

  return NextResponse.json({ ok: true, properties });
}

