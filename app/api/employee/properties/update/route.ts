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
  const db = url && serviceKey
    ? createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : getSupabaseServerClient();

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
    const { error } = await db.from("properties").update(payload).eq("id", propertyId);
    if (!error) {
      propertyUpdated = true;
      propertyErrorMessage = null;
      break;
    }
    propertyErrorMessage = error.message;
  }
  if (!propertyUpdated) {
    return NextResponse.json({ ok: false, error: `property_update_failed: ${propertyErrorMessage}` }, { status: 500 });
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
    const { data, error } = await db.from("tenants").update(payload).eq("id", tenantId).select("*").maybeSingle();
    if (error) return NextResponse.json({ ok: false, error: `tenant_update_failed: ${error.message}` }, { status: 500 });
    tenant = (data as Record<string, unknown>) ?? null;
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

