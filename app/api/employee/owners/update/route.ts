import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type Body = {
  ownerId?: unknown;
  fullName?: unknown;
  phone?: unknown;
  email?: unknown;
};

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

  const ownerId = asText(body.ownerId);
  const fullName = asText(body.fullName);
  const phone = asText(body.phone);
  const email = asText(body.email);
  if (!ownerId || !fullName) {
    return NextResponse.json({ ok: false, error: "owner_id والاسم مطلوبان." }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const db = url && serviceKey
    ? createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : getSupabaseServerClient();

  const { data: ownerRow, error: ownerErr } = await db
    .from("owners")
    .update({ full_name: fullName, phone: phone || null, email: email || null })
    .eq("id", ownerId)
    .select("*")
    .maybeSingle();
  if (ownerErr) {
    return NextResponse.json({ ok: false, error: `owner_update_failed: ${ownerErr.message}` }, { status: 500 });
  }

  const ownerUserId = String(ownerRow?.user_id ?? "");
  if (ownerUserId) {
    await db.from("users").update({ full_name: fullName, phone: phone || null, email: email || null }).eq("id", ownerUserId);
  }

  return NextResponse.json({ ok: true, owner: ownerRow });
}

