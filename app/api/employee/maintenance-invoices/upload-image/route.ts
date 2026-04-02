import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function safeExt(fileName: string): string {
  const raw = fileName.split(".").pop()?.toLowerCase() || "jpg";
  const ext = raw.replace(/[^a-z0-9]/g, "");
  return ext || "jpg";
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

  const ext = safeExt(fileValue.name);
  const path = `employee/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await db.storage.from("invoices").upload(path, fileValue, {
    contentType: fileValue.type || "image/jpeg",
    upsert: false
  });
  if (uploadError) {
    return NextResponse.json({ ok: false, error: `upload_failed: ${uploadError.message}` }, { status: 500 });
  }

  const { data: publicData } = db.storage.from("invoices").getPublicUrl(path);
  return NextResponse.json({
    ok: true,
    path,
    publicUrl: publicData?.publicUrl ?? null
  });
}

