import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function asText(v: unknown): string {
  return String(v ?? "").trim();
}

export async function POST(req: Request) {
  let body: { ownerId?: unknown } = {};
  try {
    body = (await req.json()) as { ownerId?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const ownerId = asText(body.ownerId);
  if (!ownerId) return NextResponse.json({ ok: false, error: "owner_id مطلوب." }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const db = url && serviceKey
    ? createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : getSupabaseServerClient();

  const { data: ownerRow } = await db.from("owners").select("user_id").eq("id", ownerId).maybeSingle();
  const { data: props } = await db.from("properties").select("id").eq("owner_id", ownerId);
  const propertyIds = (props ?? []).map((p: { id?: unknown }) => String(p.id ?? "")).filter(Boolean);
  if (propertyIds.length > 0) {
    await db.from("tenants").delete().in("property_id", propertyIds);
  }
  await db.from("properties").delete().eq("owner_id", ownerId);
  const { error: ownerDeleteError } = await db.from("owners").delete().eq("id", ownerId);
  if (ownerDeleteError) {
    return NextResponse.json({ ok: false, error: `owner_delete_failed: ${ownerDeleteError.message}` }, { status: 500 });
  }

  const userId = asText(ownerRow?.user_id);
  if (userId) {
    await db.from("users").delete().eq("id", userId);
  }

  return NextResponse.json({ ok: true });
}

