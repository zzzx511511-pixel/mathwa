import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const REQUEST_TYPES = new Set(["buy", "rent", "management", "consulting"]);

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const name = String(body?.name ?? "").trim();
  const phone = String(body?.phone ?? "").trim();
  const requestType = String(body?.requestType ?? "").trim();
  const propertyTypeWanted = String(body?.propertyTypeWanted ?? "").trim();
  const budgetMin = String(body?.budgetMin ?? "").trim();
  const budgetMax = String(body?.budgetMax ?? "").trim();
  const preferredCity = String(body?.preferredCity ?? "").trim();
  const source = String(body?.source ?? "website").trim();
  const interestedListingId = String(body?.interestedListingId ?? "").trim();
  const status = String(body?.status ?? "new").trim();
  const notes = String(body?.notes ?? "").trim();

  if (!name || !phone) {
    return NextResponse.json({ ok: false, error: "name_and_phone_required" }, { status: 400 });
  }
  if (!REQUEST_TYPES.has(requestType)) {
    return NextResponse.json({ ok: false, error: "invalid_request_type" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ ok: false, error: "missing_supabase_service_role_key" }, { status: 500 });
  }

  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db
    .from("marketing_leads")
    .insert({
      name,
      phone,
      request_type: requestType,
      property_type_wanted: propertyTypeWanted || null,
      budget_min: budgetMin || null,
      budget_max: budgetMax || null,
      preferred_city: preferredCity || null,
      source,
      interested_listing_id: interestedListingId || null,
      status: status || "new",
      notes: notes || null
    })
    .select("id")
    .single();

  if (error) {
    console.error("marketing_leads insert:", error.message);
    return NextResponse.json(
      {
        ok: false,
        error: `lead_save_failed: ${error.message}. نفّذ docs/supabase-marketing-leads.sql إن لم يكن الجدول موجوداً.`
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, id: data?.id });
}
