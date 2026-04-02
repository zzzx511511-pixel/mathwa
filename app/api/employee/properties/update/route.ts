import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type Body = {
  propertyId?: unknown;
  propertyName?: unknown;
  location?: unknown;
  city?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  mapAddress?: unknown;
  propertyType?: unknown;
  areaSqm?: unknown;
  commissionPercent?: unknown;
  conditionStatus?: unknown;
  tenantId?: unknown;
  tenantName?: unknown;
  tenantPhone?: unknown;
  contractStart?: unknown;
  contractEnd?: unknown;
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

  const propertyId = asText(body.propertyId);
  const propertyName = asText(body.propertyName);
  if (!propertyId || !propertyName) {
    return NextResponse.json({ ok: false, error: "property_id واسم العقار مطلوبان." }, { status: 400 });
  }

  const location = asText(body.location);
  const city = asText(body.city);
  const mapAddress = asText(body.mapAddress);
  const propertyType = asText(body.propertyType);
  const conditionStatus = asText(body.conditionStatus) || "good";
  const latitude = Number(body.latitude ?? NaN);
  const longitude = Number(body.longitude ?? NaN);
  const areaSqm = Number(body.areaSqm ?? 0);
  const commissionPercent = Number(body.commissionPercent ?? 0);
  const tenantId = asText(body.tenantId);
  const tenantName = asText(body.tenantName);
  const tenantPhone = asText(body.tenantPhone);
  const contractStart = asText(body.contractStart);
  const contractEnd = asText(body.contractEnd);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  // IMPORTANT: We must not return ok=true unless the DB update actually happened.
  // Service role bypasses RLS; without it, PostgREST can return 0 affected rows without an explicit error.
  if (!url || !serviceKey) {
    return NextResponse.json(
      { ok: false, error: "missing_supabase_service_role_key: اضف SUPABASE_SERVICE_ROLE_KEY على السيرفر (Vercel) لضمان حفظ التعديلات." },
      { status: 500 }
    );
  }
  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const status = tenantName ? "occupied" : "vacant";
  const propertyUpdatePayload: Record<string, unknown> = {
    name: propertyName,
    location,
    city,
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    map_address: mapAddress || null,
    type: propertyType || null,
    area_sqm: Number.isFinite(areaSqm) ? areaSqm : null,
    commission_rate: Number.isFinite(commissionPercent) ? commissionPercent / 100 : null,
    property_condition: conditionStatus,
    status
  };

  const payloadAttempts: Array<Record<string, unknown>> = [
    propertyUpdatePayload,
    Object.fromEntries(Object.entries(propertyUpdatePayload).filter(([k]) => k !== "map_address")),
    Object.fromEntries(
      Object.entries(propertyUpdatePayload).filter(([k]) => !["map_address", "latitude", "longitude"].includes(k))
    ),
    {
      name: propertyName,
      location,
      city,
      type: propertyType || null,
      area_sqm: Number.isFinite(areaSqm) ? areaSqm : null,
      commission_rate: Number.isFinite(commissionPercent) ? commissionPercent / 100 : null,
      status
    },
    {
      name: propertyName,
      location,
      city
    },
    {
      name: propertyName,
      location
    }
  ];
  let propertyUpdated = false;
  let propertyErrorMessage: string | null = null;
  for (const payload of payloadAttempts) {
    const { error, data } = await db
      .from("properties")
      .update(payload)
      .eq("id", propertyId)
      // NOTE: This repo's typings allow only the columns arg for select().
      // We validate success using returned rows length.
      .select("id");

    if (error) {
      propertyErrorMessage = error.message;
      continue;
    }
    const updatedRows = Array.isArray(data) ? data.length : null;
    if (updatedRows === 1) {
      propertyUpdated = true;
      propertyErrorMessage = null;
      break;
    }
    // No error but also no rows updated (common when RLS/permissions block the update or id not found).
    propertyErrorMessage = `no_rows_updated (rows=${updatedRows ?? "null"})`;
  }
  if (!propertyUpdated) {
    const msg = propertyErrorMessage || "unknown_error";
    const statusCode = msg.includes("no_rows_updated") ? 404 : 500;
    return NextResponse.json({ ok: false, error: `property_update_failed: ${msg}` }, { status: statusCode });
  }

  let tenant: Record<string, unknown> | null = null;
  const hasTenantData = tenantName || tenantPhone || contractStart || contractEnd;
  if (tenantId) {
    const payload = hasTenantData
      ? {
          full_name: tenantName || null,
          phone: tenantPhone || null,
          contract_start: contractStart || null,
          contract_end: contractEnd || null
        }
      : { full_name: null, phone: null, contract_start: null, contract_end: null };
    const { error, data } = await db.from("tenants").update(payload).eq("id", tenantId).select("id");
    if (error) return NextResponse.json({ ok: false, error: `tenant_update_failed: ${error.message}` }, { status: 500 });
    const updatedRows = Array.isArray(data) ? data.length : null;
    if (updatedRows !== 1) {
      return NextResponse.json({ ok: false, error: `tenant_update_failed: no_rows_updated (rows=${updatedRows ?? "null"})` }, { status: 404 });
    }
    // Return tenant object shaped from request (avoids requiring a read that may be blocked in some setups).
    tenant = {
      id: tenantId,
      property_id: propertyId,
      full_name: tenantName || null,
      phone: tenantPhone || null,
      contract_start: contractStart || null,
      contract_end: contractEnd || null
    };
  } else if (hasTenantData) {
    const { data, error } = await db
      .from("tenants")
      .insert({
        property_id: propertyId,
        full_name: tenantName || null,
        phone: tenantPhone || null,
        contract_start: contractStart || null,
        contract_end: contractEnd || null
      })
      .select("*")
      .maybeSingle();
    if (error) return NextResponse.json({ ok: false, error: `tenant_insert_failed: ${error.message}` }, { status: 500 });
    tenant = (data as Record<string, unknown>) ?? null;
  }

  return NextResponse.json({
    ok: true,
    property: {
      id: propertyId,
      name: propertyName,
      location,
      city,
      latitude: Number.isFinite(latitude) ? latitude : null,
      longitude: Number.isFinite(longitude) ? longitude : null,
      map_address: mapAddress || null,
      type: propertyType || null,
      area_sqm: Number.isFinite(areaSqm) ? areaSqm : null,
      commission_rate: Number.isFinite(commissionPercent) ? commissionPercent / 100 : null,
      property_condition: conditionStatus,
      status
    },
    tenant
  });
}

