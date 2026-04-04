import { NextResponse } from "next/server";
import { isPreviewMode } from "@/lib/demo/is-preview-mode";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/marketing/listing-form-constants";

const PAYMENT_SET = new Set(PAYMENT_METHOD_OPTIONS.map((o) => o.value));

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const title = String(body?.title ?? "").trim();
  const propertyType = String(body?.propertyType ?? "").trim();
  const city = String(body?.city ?? "").trim();
  const district = String(body?.district ?? "").trim();
  const listingMode = String(body?.listingMode ?? "").trim();
  const price = String(body?.price ?? "").trim();
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
  void body?.listingId;

  if (!title || !propertyType || !city || !district || !price || !description) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }
  if (listingMode !== "sale" && listingMode !== "rent") {
    return NextResponse.json({ ok: false, error: "invalid_listing_mode" }, { status: 400 });
  }
  if (!(PAYMENT_SET as Set<string>).has(paymentMethod)) {
    return NextResponse.json({ ok: false, error: "invalid_payment_method" }, { status: 400 });
  }

  if (areaSqmRaw != null && String(areaSqmRaw).trim() !== "") {
    const a = Number(String(areaSqmRaw).trim());
    if (Number.isNaN(a) || a <= 0) {
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

  void features;

  const portalOpen =
    String(process.env.NEXT_PUBLIC_EMPLOYEE_PORTAL_OPEN ?? "")
      .trim()
      .replace(/^['"]|['"]$/g, "") === "true";

  if (isPreviewMode() || portalOpen) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json(
    {
      ok: false,
      error:
        "live_mode_not_configured: يلزم جداول listings/leads/quotes وتخزين Supabase قبل التفعيل الكامل (مواصفة Marketing v2)."
    },
    { status: 501 }
  );
}
