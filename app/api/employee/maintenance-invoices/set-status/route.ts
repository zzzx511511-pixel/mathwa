import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Body = { invoiceId?: unknown; status?: unknown };

function asText(v: unknown): string {
  return String(v ?? "").trim();
}

const ALLOWED_STATUS = new Set(["approved", "rejected"]);

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const invoiceId = asText(body.invoiceId);
  const status = asText(body.status).toLowerCase();

  if (!invoiceId) {
    return NextResponse.json({ ok: false, error: "invoiceId مطلوب." }, { status: 400 });
  }
  if (!ALLOWED_STATUS.has(status)) {
    return NextResponse.json({ ok: false, error: "الحالة يجب أن تكون approved أو rejected." }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ ok: false, error: "missing_supabase_service_role_key" }, { status: 500 });
  }

  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.from("maintenance_invoices").update({ status }).eq("id", invoiceId).select("*").maybeSingle();
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ ok: false, error: "الفاتورة غير موجودة." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, invoice: data });
}

