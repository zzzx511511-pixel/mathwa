import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { normalizeAccessCode } from "@/lib/auth/credentials";
import { codeSessionCookieName, createCodeSessionToken } from "@/lib/auth/code-session-cookie";

type UserAccessRow = {
  id: string;
  role: string | null;
  is_active: boolean | null;
  access_code?: unknown;
};

async function findUserByAccessCode(admin: any, code: string): Promise<UserAccessRow | null> {
  const { data: directRows, error: directError } = await admin
    .from("users")
    .select("id, role, is_active, access_code")
    .eq("access_code", code)
    .limit(1);
  if (directError) throw directError;
  if ((directRows ?? []).length > 0) return (directRows![0] as UserAccessRow) ?? null;

  const numericCode = Number(code);
  if (Number.isFinite(numericCode)) {
    const { data: numericRows, error: numericError } = await admin
      .from("users")
      .select("id, role, is_active, access_code")
      .eq("access_code", numericCode)
      .limit(1);
    if (numericError) throw numericError;
    if ((numericRows ?? []).length > 0) return (numericRows![0] as UserAccessRow) ?? null;
  }

  const { data: candidates, error: listError } = await admin
    .from("users")
    .select("id, role, is_active, access_code")
    .not("access_code", "is", null)
    .limit(1000);
  if (listError) throw listError;
  return (
    candidates?.find(
      (r: { access_code?: unknown }) =>
        String(r.access_code ?? "")
          .replace(/\D/g, "")
          .slice(0, 6) === code
    ) as UserAccessRow | undefined
  ) ?? null;
}

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || (!serviceKey && !anon)) {
    return NextResponse.json(
      { error: "server_misconfigured", message: "تهيئة Supabase ناقصة على الخادم." },
      { status: 500 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as { code?: unknown };
  const code = normalizeAccessCode(body.code);
  if (code.length !== 6) {
    return NextResponse.json({ error: "invalid_input", message: "أدخل رمزًا من 6 أرقام." }, { status: 400 });
  }

  const admin = createClient(url, serviceKey ?? anon!, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  let row: UserAccessRow | null = null;
  try {
    row = await findUserByAccessCode(admin, code);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "database_error";
    return NextResponse.json({ error: "database_error", message: msg }, { status: 500 });
  }
  if (!row?.id) return NextResponse.json({ error: "invalid_code", message: "الرمز غير صحيح." }, { status: 401 });
  if (row.is_active === false) {
    return NextResponse.json({ error: "account_disabled", message: "الحساب موقوف." }, { status: 403 });
  }

  const res = NextResponse.json({ ok: true, redirectTo: "/employee/estates" });
  res.cookies.set(codeSessionCookieName(), createCodeSessionToken(String(row.id), String(row.role ?? "employee")), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
  return res;
}
