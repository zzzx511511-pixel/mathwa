import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { normalizeAccessCode } from "@/lib/auth/credentials";
import { codeSessionCookieName, createCodeSessionToken } from "@/lib/auth/code-session-cookie";

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });

  const body = (await req.json().catch(() => ({}))) as { fullName?: unknown; code?: unknown };
  const fullName = String(body.fullName ?? "").trim();
  const code = normalizeAccessCode(body.code);

  if (!fullName || code.length !== 6) {
    return NextResponse.json({ error: "invalid_input", message: "الاسم والرمز (6 أرقام) مطلوبان." }, { status: 400 });
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const id = randomUUID();

  const { error } = await admin.from("users").insert({
    id,
    full_name: fullName,
    role: "employee",
    access_code: code,
    is_active: true,
    failed_attempts: 0,
    locked_until: null
  });
  if (error) {
    return NextResponse.json({ error: "database_error", message: error.message }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true, redirectTo: "/employee/dashboard" });
  res.cookies.set(codeSessionCookieName(), createCodeSessionToken(id, "employee"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
  return res;
}
