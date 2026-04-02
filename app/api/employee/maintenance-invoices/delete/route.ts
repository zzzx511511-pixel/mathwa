import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "invoices";

type Body = { invoiceId?: unknown };

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

  const invoiceId = asText(body.invoiceId);
  if (!invoiceId) {
    return NextResponse.json({ ok: false, error: "invoiceId مطلوب." }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ ok: false, error: "missing_supabase_service_role_key" }, { status: 500 });
  }

  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: row, error: fetchError } = await db.from("maintenance_invoices").select("*").eq("id", invoiceId).maybeSingle();
  if (fetchError) {
    return NextResponse.json({ ok: false, error: fetchError.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ ok: false, error: "الفاتورة غير موجودة." }, { status: 404 });
  }

  const r = row as Record<string, unknown>;
  const storagePath = [r.image_path, r.storage_path, r.invoice_image_path, r.attachment_path]
    .map((x) => String(x ?? "").trim())
    .find(Boolean);

  if (storagePath) {
    const { error: removeErr } = await db.storage.from(BUCKET).remove([storagePath]);
    if (removeErr) {
      console.warn("maintenance_invoices delete: storage remove", removeErr.message);
    }
  }

  const { error: delError } = await db.from("maintenance_invoices").delete().eq("id", invoiceId);
  if (delError) {
    return NextResponse.json({ ok: false, error: delError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
