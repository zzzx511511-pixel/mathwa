import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "invoices";

/**
 * يفتح صورة الفاتورة عبر رابط موقّع (مناسب للـ bucket الخاص أو العام).
 * الاستخدام: /api/employee/maintenance-invoices/image?path=employee%2Fxxx.jpg
 */
export async function GET(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ ok: false, error: "missing_supabase_service_role_key" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path")?.trim();
  if (!path) {
    return NextResponse.json({ ok: false, error: "path مطلوب." }, { status: 400 });
  }
  if (path.includes("..") || path.startsWith("/")) {
    return NextResponse.json({ ok: false, error: "path غير صالح." }, { status: 400 });
  }

  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data, error } = await db.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  if (error || !data?.signedUrl) {
    return NextResponse.json({ ok: false, error: error?.message ?? "تعذر إنشاء رابط الصورة." }, { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl);
}
