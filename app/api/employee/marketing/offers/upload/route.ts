import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "marketing-offers";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

function safeExt(fileName: string): string {
  const raw = fileName.split(".").pop()?.toLowerCase() || "";
  const ext = raw.replace(/[^a-z0-9]/g, "");
  return ext || "bin";
}

function safeListingId(v: unknown): string | null {
  const s = String(v ?? "").trim();
  if (!s || s.length > 128) return null;
  if (/[./\\]/.test(s)) return null;
  return s;
}

function isBucketMissingError(msg: string): boolean {
  const m = msg.toLowerCase();
  return m.includes("bucket not found") || m.includes("not found") || m.includes("no such bucket");
}

async function ensureMarketingOffersBucket(
  db: SupabaseClient
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: buckets, error: listErr } = await db.storage.listBuckets();
  if (listErr) {
    const { error: createErr } = await db.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_VIDEO_BYTES
    });
    if (createErr) {
      const msg = createErr.message.toLowerCase();
      if (msg.includes("already exists") || msg.includes("duplicate")) {
        return { ok: true };
      }
      return { ok: false, error: `storage_create_bucket_failed: ${createErr.message}` };
    }
    return { ok: true };
  }

  const exists = (buckets ?? []).some((b) => b.name === BUCKET);
  if (exists) return { ok: true };

  const { error: createErr } = await db.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_VIDEO_BYTES
  });
  if (createErr) {
    const msg = createErr.message.toLowerCase();
    if (msg.includes("already exists") || msg.includes("duplicate")) {
      return { ok: true };
    }
    return { ok: false, error: `storage_create_bucket_failed: ${createErr.message}` };
  }
  return { ok: true };
}

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ ok: false, error: "missing_supabase_service_role_key" }, { status: 500 });
  }
  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_form_data" }, { status: 400 });
  }

  const listingId = safeListingId(form.get("listingId"));
  if (!listingId) {
    return NextResponse.json({ ok: false, error: "listingId مطلوب (معرّف صالح)." }, { status: 400 });
  }

  const kindRaw = String(form.get("kind") ?? "image").toLowerCase();
  const kind = kindRaw === "video" ? "video" : "image";

  const fileValue = form.get("file");
  if (!(fileValue instanceof File)) {
    return NextResponse.json({ ok: false, error: "file مطلوب." }, { status: 400 });
  }
  const file = fileValue;

  if (kind === "image") {
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ ok: false, error: "نوع الملف يجب أن يكون صورة." }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ ok: false, error: "حجم الصورة كبير. الحد الأقصى 10MB لكل صورة." }, { status: 400 });
    }
  } else {
    const ext = safeExt(file.name);
    const isMp4Mime = file.type === "video/mp4" || file.type === "application/octet-stream";
    const isMp4Name = ext === "mp4";
    if (!isMp4Mime && !isMp4Name) {
      return NextResponse.json({ ok: false, error: "الفيديو يجب أن يكون بصيغة MP4." }, { status: 400 });
    }
    if (file.size > MAX_VIDEO_BYTES) {
      return NextResponse.json({ ok: false, error: "حجم الفيديو يتجاوز 50MB." }, { status: 400 });
    }
  }

  const ensured = await ensureMarketingOffersBucket(db);
  if (!ensured.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: `${ensured.error}. أنشئ يدويًا من Supabase: Storage → bucket الاسم marketing-offers → Public.`
      },
      { status: 500 }
    );
  }

  const rand = Math.random().toString(36).slice(2);
  const ts = Date.now();
  let objectPath: string;
  let contentType: string;

  if (kind === "image") {
    const ext = safeExt(file.name);
    objectPath = `${listingId}/images/${ts}-${rand}.${ext}`;
    contentType = file.type || "image/jpeg";
  } else {
    objectPath = `${listingId}/videos/${ts}-${rand}.mp4`;
    contentType = file.type && file.type !== "application/octet-stream" ? file.type : "video/mp4";
  }

  async function doUpload(): Promise<{ error: { message: string } | null }> {
    return db.storage.from(BUCKET).upload(objectPath, file, {
      contentType,
      upsert: false
    });
  }

  let { error: uploadError } = await doUpload();

  if (uploadError && isBucketMissingError(uploadError.message)) {
    const retry = await ensureMarketingOffersBucket(db);
    if (!retry.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `upload_failed: ${uploadError.message}. ثم فشل إعادة إنشاء الـ bucket: ${retry.error}`
        },
        { status: 500 }
      );
    }
    ({ error: uploadError } = await doUpload());
  }

  if (uploadError) {
    return NextResponse.json({ ok: false, error: `upload_failed: ${uploadError.message}` }, { status: 500 });
  }

  const { data: publicData } = db.storage.from(BUCKET).getPublicUrl(objectPath);
  return NextResponse.json({
    ok: true,
    path: objectPath,
    publicUrl: publicData?.publicUrl ?? null,
    kind
  });
}
