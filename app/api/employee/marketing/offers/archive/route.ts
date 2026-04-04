import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Body = { listingId?: unknown; archive?: unknown };

function asText(v: unknown): string {
  return String(v ?? "").trim();
}

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const listingId = asText(body.listingId);
  const archive = Boolean(body.archive);

  if (!listingId) {
    return NextResponse.json({ ok: false, error: "listingId مطلوب." }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ ok: false, error: "missing_supabase_service_role_key" }, { status: 500 });
  }

  const nextStatus = archive ? "archived" : "published";
  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db
    .from("listings")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", listingId)
    .select("id, status")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ ok: false, error: "العرض غير موجود." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, status: data.status });
}
