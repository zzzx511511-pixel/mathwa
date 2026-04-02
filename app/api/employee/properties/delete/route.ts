import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function asText(v: unknown): string {
  return String(v ?? "").trim();
}

export async function POST(req: Request) {
  let body: { propertyId?: unknown } = {};
  try {
    body = (await req.json()) as { propertyId?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const propertyId = asText(body.propertyId);
  if (!propertyId) return NextResponse.json({ ok: false, error: "property_id مطلوب." }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const db = url && serviceKey
    ? createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : getSupabaseServerClient();

  await db.from("tenants").delete().eq("property_id", propertyId);
  const { error } = await db.from("properties").delete().eq("id", propertyId);
  if (error) return NextResponse.json({ ok: false, error: `property_delete_failed: ${error.message}` }, { status: 500 });

  return NextResponse.json({ ok: true });
}

