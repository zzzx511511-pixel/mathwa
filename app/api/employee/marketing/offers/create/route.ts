import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isPreviewMode } from "@/lib/demo/is-preview-mode";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/marketing/listing-form-constants";

const PAYMENT_SET = new Set(PAYMENT_METHOD_OPTIONS.map((o) => o.value));

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s.trim()
  );
}

/** Accepts Arabic/English digits and common separators. */
function parsePositiveNumber(raw: unknown): number | null {
  const map: Record<string, string> = {
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
    "۰": "0",
    "۱": "1",
    "۲": "2",
    "۳": "3",
    "۴": "4",
    "۵": "5",
    "۶": "6",
    "۷": "7",
    "۸": "8",
    "۹": "9"
  };
  if (raw == null) return null;
  let s = String(raw).trim().replace(/\s/g, "");
  if (!s) return null;
  s = [...s].map((ch) => map[ch] ?? ch).join("");
  s = s.replace(/\u066C/g, ".").replace(/,/g, "");
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const listingIdRaw = body?.listingId != null ? String(body.listingId).trim() : "";
  const title = String(body?.title ?? "").trim();
  const propertyType = String(body?.propertyType ?? "").trim();
  const city = String(body?.city ?? "").trim();
  const district = String(body?.district ?? "").trim();
  const listingMode = String(body?.listingMode ?? "").trim();
  const priceRaw = body?.price;
  const description = String(body?.description ?? "").trim();
  const paymentMethod = String(body?.paymentMethod ?? "").trim();
  const areaSqmRaw = body?.areaSqm;
  const hazardLevel = body?.hazardLevel != null ? String(body.hazardLevel).trim() : "";
  const latitude = body?.latitude != null ? String(body.latitude).trim() : "";
  const longitude = body?.longitude != null ? String(body.longitude).trim() : "";
  const videoUrl = body?.videoUrl != null ? String(body.videoUrl).trim() : "";
  const mainImageUrl = body?.mainImageUrl != null ? String(body.mainImageUrl).trim() : "";
  const galleryUrls = Array.isArray(body?.galleryUrls) ? body.galleryUrls : [];
  const features = body?.features != null && typeof body.features === "object" ? body.features : {};

  if (!title || !propertyType || !city || !district || !description) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }
  const priceNum = parsePositiveNumber(priceRaw);
  if (priceNum == null) {
    return NextResponse.json({ ok: false, error: "invalid_price" }, { status: 400 });
  }
  if (listingMode !== "sale" && listingMode !== "rent") {
    return NextResponse.json({ ok: false, error: "invalid_listing_mode" }, { status: 400 });
  }
  if (!(PAYMENT_SET as Set<string>).has(paymentMethod)) {
    return NextResponse.json({ ok: false, error: "invalid_payment_method" }, { status: 400 });
  }

  if (areaSqmRaw != null && String(areaSqmRaw).trim() !== "") {
    const a = parsePositiveNumber(areaSqmRaw);
    if (a == null || a <= 0) {
      return NextResponse.json({ ok: false, error: "invalid_area" }, { status: 400 });
    }
  }

  const urls = galleryUrls
    .map((u) => String(u ?? "").trim())
    .filter(Boolean)
    .slice(0, 8);
  for (const u of urls) {
    try {
      // eslint-disable-next-line no-new -- validation
      new URL(u);
    } catch {
      return NextResponse.json({ ok: false, error: "invalid_gallery_url" }, { status: 400 });
    }
  }
  if (mainImageUrl) {
    try {
      new URL(mainImageUrl);
    } catch {
      return NextResponse.json({ ok: false, error: "invalid_main_image" }, { status: 400 });
    }
  }
  if (videoUrl) {
    try {
      new URL(videoUrl);
    } catch {
      return NextResponse.json({ ok: false, error: "invalid_video_url" }, { status: 400 });
    }
  }

  if (latitude || longitude) {
    const lat = parseFloat(latitude.replace(",", "."));
    const lng = parseFloat(longitude.replace(",", "."));
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return NextResponse.json({ ok: false, error: "invalid_coordinates" }, { status: 400 });
    }
  }

  if (hazardLevel && !["high", "medium", "low"].includes(hazardLevel)) {
    return NextResponse.json({ ok: false, error: "invalid_hazard" }, { status: 400 });
  }

  if (isPreviewMode()) {
    return NextResponse.json({ ok: true, preview: true });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "missing_supabase_service_role_key: أضف NEXT_PUBLIC_SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY في البيئة (مثل Vercel)."
      },
      { status: 500 }
    );
  }

  if (!listingIdRaw || !isUuid(listingIdRaw)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "invalid_listing_id: معرّف العرض غير صالح. أعد تحميل الصفحة وحاول مرة أخرى."
      },
      { status: 400 }
    );
  }

  const areaSqmParsed =
    areaSqmRaw != null && String(areaSqmRaw).trim() !== "" ? parsePositiveNumber(areaSqmRaw) : null;

  const latParsed =
    latitude.trim() !== "" ? parseFloat(latitude.replace(",", ".")) : null;
  const lngParsed =
    longitude.trim() !== "" ? parseFloat(longitude.replace(",", ".")) : null;

  const row: Record<string, unknown> = {
    id: listingIdRaw,
    title,
    property_type: propertyType,
    city,
    district,
    listing_mode: listingMode,
    price: priceNum,
    area_sqm: areaSqmParsed != null && areaSqmParsed > 0 ? areaSqmParsed : null,
    payment_method: paymentMethod,
    hazard_level: hazardLevel || null,
    latitude: latParsed != null && !Number.isNaN(latParsed) ? latParsed : null,
    longitude: lngParsed != null && !Number.isNaN(lngParsed) ? lngParsed : null,
    description,
    main_image_url: mainImageUrl || null,
    gallery_urls: urls,
    video_url: videoUrl || null,
    features,
    status: "published",
    updated_at: new Date().toISOString()
  };

  const db = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data, error } = await db.from("listings").upsert(row, { onConflict: "id" }).select("id").single();

  if (error) {
    const msg = error.message || "";
    const hint =
      msg.includes("listings") && (msg.includes("does not exist") || msg.includes("schema cache"))
        ? " نفّذ ملف docs/supabase-marketing-listings.sql في SQL Editor لإنشاء الجدول public.listings."
        : "";
    console.error("marketing offers create:", error);
    return NextResponse.json(
      {
        ok: false,
        error: `listing_save_failed: ${msg}.${hint}`
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, id: data?.id ?? listingIdRaw });
}
