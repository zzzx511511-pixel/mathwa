import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "invoices";

function safeExt(fileName: string): string {
  const raw = fileName.split(".").pop()?.toLowerCase() || "jpg";
  const ext = raw.replace(/[^a-z0-9]/g, "");
  return ext || "jpg";
}

function isBucketMissingError(msg: string): boolean {
  const m = msg.toLowerCase();
  return m.includes("bucket not found") || m.includes("not found") || m.includes("no such bucket");
}

async function ensureInvoicesBucket(db: ReturnType<typeof createClient>): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: buckets, error: listErr } = await db.storage.listBuckets();
  if (listErr) {
    // لا نوقف التنفيذ: أحيانًا listBuckets يفشل بينما الإنشاء/الرفع يعملان بصلاحية الخدمة
    const { error: createErr } = await db.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 10485760
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
    fileSizeLimit: 10485760
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

  const fileValue = form.get("file");
  if (!(fileValue instanceof File)) {
    return NextResponse.json({ ok: false, error: "file مطلوب." }, { status: 400 });
  }

  if (!fileValue.type.startsWith("image/")) {
    return NextResponse.json({ ok: false, error: "نوع الملف يجب أن يكون صورة." }, { status: 400 });
  }
  if (fileValue.size > 10 * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: "حجم الصورة كبير. الحد الأقصى 10MB." }, { status: 400 });
  }

  const ensured = await ensureInvoicesBucket(db);
  if (!ensured.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: `${ensured.error}. أنشئ يدويًا من Supabase: Storage → New bucket → الاسم invoices → Public.`
      },
      { status: 500 }
    );
  }

  const ext = safeExt(fileValue.name);
  const path = `employee/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  async function doUpload(): Promise<{ error: { message: string } | null }> {
    return db.storage.from(BUCKET).upload(path, fileValue, {
      contentType: fileValue.type || "image/jpeg",
      upsert: false
    });
  }

  let { error: uploadError } = await doUpload();

  if (uploadError && isBucketMissingError(uploadError.message)) {
    const retry = await ensureInvoicesBucket(db);
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
    return NextResponse.json(
      {
        ok: false,
        error: `upload_failed: ${uploadError.message}`
      },
      { status: 500 }
    );
  }

  const { data: publicData } = db.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({
    ok: true,
    path,
    publicUrl: publicData?.publicUrl ?? null
  });
}
