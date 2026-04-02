import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { hashPassword, normalizeUsername } from "@/lib/auth/credentials";
import { codeSessionCookieName, createCodeSessionToken } from "@/lib/auth/code-session-cookie";

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });

  const body = (await req.json().catch(() => ({}))) as {
    fullName?: unknown;
    username?: unknown;
    password?: unknown;
    role?: unknown;
  };
  const fullName = String(body.fullName ?? "").trim();
  const username = normalizeUsername(body.username);
  const password = String(body.password ?? "");
  const role = String(body.role ?? "");
  if (!fullName || !username || password.length < 4 || !["owner", "client"].includes(role)) {
    return NextResponse.json({ error: "invalid_input", message: "تحقق من البيانات." }, { status: 400 });
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const id = randomUUID();
  const { error } = await admin.from("users").insert({
    id,
    full_name: fullName,
    username,
    password_hash: hashPassword(password),
    role,
    is_active: true
  });
  if (error) return NextResponse.json({ error: "database_error", message: error.message }, { status: 500 });

  const redirectTo = role === "owner" ? "/owner/properties" : "/client/contracts";
  const res = NextResponse.json({ ok: true, redirectTo });
  res.cookies.set(codeSessionCookieName(), createCodeSessionToken(id, role), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
  return res;
}
