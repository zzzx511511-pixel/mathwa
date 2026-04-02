import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Body = {
  ownerId?: unknown;
  propertyId?: unknown;
  amount?: unknown;
  description?: unknown;
  status?: unknown;
};

function asText(v: unknown): string {
  return String(v ?? "").trim();
}

function asAmount(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

const ALLOWED_STATUS = new Set(["pending", "approved", "rejected"]);

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const ownerId = asText(body.ownerId);
  const propertyId = asText(body.propertyId);
  const amount = asAmount(body.amount);
  const description = asText(body.description);
  const status = asText(body.status).toLowerCase() || "pending";

  if (!ownerId) return NextResponse.json({ ok: false, error: "ownerId مطلوب." }, { status: 400 });
  if (!propertyId) return NextResponse.json({ ok: false, error: "propertyId مطلوب." }, { status: 400 });
  if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ ok: false, error: "المبلغ غير صحيح." }, { status: 400 });
  if (!ALLOWED_STATUS.has(status)) return NextResponse.json({ ok: false, error: "حالة الفاتورة غير صحيحة." }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ ok: false, error: "missing_supabase_service_role_key" }, { status: 500 });
  }
  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  // Some schemas may not have owner_id on maintenance_invoices; we try with it first then fallback.
  const payloadAttempts: Array<Record<string, unknown>> = [
    { owner_id: ownerId, property_id: propertyId, amount, description: description || null, status },
    { property_id: propertyId, amount, description: description || null, status }
  ];

  let lastError: string | null = null;
  for (const payload of payloadAttempts) {
    const { data, error } = await db.from("maintenance_invoices").insert(payload).select("*").maybeSingle();
    if (error) {
      lastError = error.message;
      continue;
    }
    if (!data) {
      lastError = "insert_returned_empty";
      continue;
    }
    return NextResponse.json({ ok: true, invoice: data });
  }

  return NextResponse.json({ ok: false, error: `invoice_create_failed: ${lastError || "unknown_error"}` }, { status: 500 });
}

