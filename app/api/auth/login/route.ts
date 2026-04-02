import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { isValidAccessCode, normalizeAccessCodeInput } from "@/lib/auth/access-code";
import { redirectUrlForAccessCodeRole } from "@/lib/auth/access-code-redirect";
import { isPreviewMode } from "@/lib/demo/is-preview-mode";
import { codeSessionCookieName, createCodeSessionToken } from "@/lib/auth/code-session-cookie";

const demoCookieBase = {
  path: "/" as const,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 7
};

export async function POST(req: Request) {
  let body: { code?: unknown; access_code?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const code = normalizeAccessCodeInput(body?.code ?? body?.access_code);
  if (!isValidAccessCode(code)) {
    return NextResponse.json(
      { error: "invalid_format", message: "الرمز يجب أن يكون 6 أرقام بالضبط." },
      { status: 400 }
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (isPreviewMode()) {
    const res = NextResponse.json({
      ok: true,
      redirectTo: redirectUrlForAccessCodeRole(process.env.DEMO_ROLE ?? "super_admin"),
      preview: true
    });
    res.cookies.set("demo_role", process.env.DEMO_ROLE ?? "super_admin", demoCookieBase);
    return res;
  }

  if (!url || !anon) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      {
        error: "missing_service_role",
        message:
          "يلزم SUPABASE_SERVICE_ROLE_KEY للتحقق من الرمز في قاعدة البيانات. راجع docs/supabase-auth-spec-access-code.sql"
      },
      { status: 503 }
    );
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: row, error: qErr } = await admin
    .from("users")
    .select("id, role, access_code, failed_attempts, locked_until, is_active")
    .eq("access_code", code)
    .maybeSingle();

  if (qErr) {
    return NextResponse.json(
      { error: "database_error", message: qErr.message },
      { status: 500 }
    );
  }

  if (!row?.id) {
    return NextResponse.json(
      { error: "invalid_code", message: "الرمز غير صحيح، حاول مرة أخرى." },
      { status: 401 }
    );
  }

  if (!row.is_active) {
    return NextResponse.json(
      { error: "account_disabled", message: "هذا الحساب موقوف. تواصل مع المدير." },
      { status: 403 }
    );
  }

  if (row.locked_until) {
    const until = new Date(row.locked_until as string).getTime();
    if (!Number.isNaN(until) && until > Date.now()) {
      return NextResponse.json(
        {
          error: "account_locked",
          message: "تم تجميد الرمز مؤقتاً بعد عدة محاولات. تواصل مع المدير."
        },
        { status: 423 }
      );
    }
  }

  const response = NextResponse.json({
    ok: true,
    redirectTo: redirectUrlForAccessCodeRole(row.role as string)
  });

  const codeSession = createCodeSessionToken(String(row.id), String(row.role ?? "employee"));
  response.cookies.set(codeSessionCookieName(), codeSession, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });

  await admin
    .from("users")
    .update({
      failed_attempts: 0,
      locked_until: null,
      last_login_at: new Date().toISOString()
    })
    .eq("id", row.id);

  return response;
}
