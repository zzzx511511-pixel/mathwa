import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Body = {
  ownerId?: unknown;
  propertyId?: unknown;
  amount?: unknown;
  description?: unknown;
  imageUrl?: unknown;
  /** مسار الملف داخل bucket invoices (مثل employee/xxx.jpg) */
  imagePath?: unknown;
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
  const imageUrl = asText(body.imageUrl);
  const imagePath = asText(body.imagePath);
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

  const desc = description || null;
  const withOwner = (extra: Record<string, unknown>): Record<string, unknown> => ({
    owner_id: ownerId,
    property_id: propertyId,
    amount,
    description: desc,
    status,
    ...extra
  });
  const withoutOwner = (extra: Record<string, unknown>): Record<string, unknown> => ({
    property_id: propertyId,
    amount,
    description: desc,
    status,
    ...extra
  });

  const hasImage = Boolean(imageUrl || imagePath);

  function imagePayloadAttempts(): Array<Record<string, unknown>> {
    const list: Array<Record<string, unknown>> = [];
    if (imageUrl) {
      list.push(
        withOwner({ image_url: imageUrl }),
        withOwner({ receipt_image_url: imageUrl }),
        withOwner({ receipt_url: imageUrl }),
        withOwner({ invoice_image_url: imageUrl }),
        withOwner({ attachment_url: imageUrl }),
        withOwner({ image: imageUrl }),
        withoutOwner({ image_url: imageUrl }),
        withoutOwner({ receipt_image_url: imageUrl }),
        withoutOwner({ receipt_url: imageUrl }),
        withoutOwner({ invoice_image_url: imageUrl }),
        withoutOwner({ attachment_url: imageUrl }),
        withoutOwner({ image: imageUrl })
      );
    }
    if (imagePath) {
      list.push(
        withOwner({ image_path: imagePath, image_url: imageUrl || null }),
        withOwner({ storage_path: imagePath }),
        withOwner({ invoice_image_path: imagePath }),
        withOwner({ attachment_path: imagePath }),
        withoutOwner({ image_path: imagePath, image_url: imageUrl || null }),
        withoutOwner({ storage_path: imagePath }),
        withoutOwner({ invoice_image_path: imagePath }),
        withoutOwner({ attachment_path: imagePath })
      );
    }
    return list;
  }

  const minimalPayloadAttempts: Array<Record<string, unknown>> = [withOwner({}), withoutOwner({})];

  const attempts = hasImage ? imagePayloadAttempts() : minimalPayloadAttempts;

  let lastError: string | null = null;
  for (const payload of attempts) {
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

  if (hasImage) {
    return NextResponse.json(
      {
        ok: false,
        error: `invoice_create_failed_with_image: ${lastError || "unknown_error"}. أضف أعمدة للصورة في جدول maintenance_invoices (مثل image_url و image_path) أو راجع أسماء الأعمدة.`
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: false, error: `invoice_create_failed: ${lastError || "unknown_error"}` }, { status: 500 });
}

