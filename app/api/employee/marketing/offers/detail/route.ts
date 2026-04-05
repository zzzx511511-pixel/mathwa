import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s.trim()
  );
}

export async function GET(req: Request) {
  const listingId = new URL(req.url).searchParams.get("listingId")?.trim() ?? "";
  if (!listingId || !isUuid(listingId)) {
    return NextResponse.json({ ok: false, error: "listingId غير صالح." }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ ok: false, error: "missing_supabase_service_role_key" }, { status: 500 });
  }

  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.from("listings").select("*").eq("id", listingId).maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ ok: false, error: "العرض غير موجود." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, listing: data });
}
