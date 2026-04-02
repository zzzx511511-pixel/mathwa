import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "invoices";

function escapeHtmlAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/**
 * ?path=employee/xxx.jpg — يعرض الصورة (format=html) أو يعيد التوجيه للرابط الموقّع
 */
export async function GET(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ ok: false, error: "missing_supabase_service_role_key" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path")?.trim();
  const asHtml = searchParams.get("format") === "html";

  if (!path) {
    return NextResponse.json({ ok: false, error: "path مطلوب." }, { status: 400 });
  }
  if (path.includes("..") || path.startsWith("/")) {
    return NextResponse.json({ ok: false, error: "path غير صالح." }, { status: 400 });
  }

  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: signed, error: signErr } = await db.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  let imageUrl: string | null = signed?.signedUrl ?? null;

  if (!imageUrl) {
    const { data: pub } = db.storage.from(BUCKET).getPublicUrl(path);
    imageUrl = pub?.publicUrl ?? null;
  }

  if (!imageUrl) {
    return NextResponse.json(
      { ok: false, error: signErr?.message ?? "تعذر إنشاء رابط الصورة." },
      { status: 500 }
    );
  }

  if (asHtml) {
    const safe = escapeHtmlAttr(imageUrl);
    const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>صورة الفاتورة</title></head><body style="margin:0;background:#0f172a;display:flex;justify-content:center;align-items:center;min-height:100vh"><img src="${safe}" alt="فاتورة الصيانة" style="max-width:100%;max-height:100vh;object-fit:contain"/></body></html>`;
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, max-age=60" }
    });
  }

  return NextResponse.redirect(imageUrl);
}
