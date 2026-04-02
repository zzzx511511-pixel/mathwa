import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type Body = {
  ownerId?: unknown;
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
  tenantName?: unknown;
  tenantPhone?: unknown;
  contractStart?: unknown;
  contractEnd?: unknown;
};

function asText(v: unknown) {
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
  const propertyName = asText(body.propertyName);
  const location = asText(body.location);
  const city = asText(body.city);
  const mapAddress = asText(body.mapAddress);
  const propertyType = asText(body.propertyType);
  const tenantName = asText(body.tenantName);
  const tenantPhone = asText(body.tenantPhone);
  const contractStart = asText(body.contractStart);
  const contractEnd = asText(body.contractEnd);
  const conditionStatus = asText(body.conditionStatus) || "good";
  const latitude = Number(body.latitude ?? NaN);
  const longitude = Number(body.longitude ?? NaN);
  const areaSqm = Number(body.areaSqm ?? 0);
  const commissionPercent = Number(body.commissionPercent ?? 0);

  if (!ownerId || !propertyName) {
    return NextResponse.json({ ok: false, error: "owner_id واسم العقار مطلوبان." }, { status: 400 });
  }

  const propertyPayload: Record<string, unknown> = {
    owner_id: ownerId,
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
    status: tenantName ? "occupied" : "vacant"
  };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const db = url && serviceKey
    ? createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : getSupabaseServerClient();

  const payloadAttempts: Array<Record<string, unknown>> = [
    propertyPayload,
    Object.fromEntries(Object.entries(propertyPayload).filter(([k]) => k !== "map_address")),
    Object.fromEntries(
      Object.entries(propertyPayload).filter(([k]) => k !== "map_address" && k !== "latitude" && k !== "longitude")
    )
  ];
  let insertedProperty: Record<string, unknown> | null = null;
  let propertyError: { message?: string } | null = null;
  for (const payload of payloadAttempts) {
    const { data, error } = await db.from("properties").insert(payload).select("*").maybeSingle();
    if (!error && data?.id) {
      insertedProperty = data as Record<string, unknown>;
      propertyError = null;
      break;
    }
    propertyError = error;
  }

  if (propertyError || !insertedProperty?.id) {
    return NextResponse.json(
      { ok: false, error: `properties_insert_failed: ${propertyError?.message ?? "unknown"}` },
      { status: 500 }
    );
  }

  let insertedTenant: Record<string, unknown> | null = null;
  if (tenantName || tenantPhone || contractStart || contractEnd) {
    const tenantPayload: Record<string, unknown> = {
      property_id: insertedProperty.id,
      full_name: tenantName || null,
      phone: tenantPhone || null,
      contract_start: contractStart || null,
      contract_end: contractEnd || null
    };
    const { data: tenantData, error: tenantError } = await db
      .from("tenants")
      .insert(tenantPayload)
      .select("*")
      .maybeSingle();
    if (tenantError) {
      return NextResponse.json(
        { ok: false, error: `tenants_insert_failed: ${tenantError.message}` },
        { status: 500 }
      );
    }
    insertedTenant = (tenantData as Record<string, unknown>) ?? null;
  }

  return NextResponse.json({
    ok: true,
    property: insertedProperty,
    tenant: insertedTenant
  });
}
