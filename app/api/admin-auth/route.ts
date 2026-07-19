import { NextRequest, NextResponse } from "next/server";
import { setAdminCookie, clearAdminCookie, isAdminAuthed } from "@/lib/salsabeel/admin-auth";

const SECRET = process.env.ADMIN_SECRET ?? "";

// 5 attempts per 15 minutes per IP, then locked for the remainder of the window.
const RATE_LIMIT   = 5;
const WINDOW_MS    = 15 * 60 * 1000;
const attempts     = new Map<string, { count: number; resetAt: number }>();

function getIp(req: NextRequest): string {
  // Vercel prepends the real IP as the LAST element in x-forwarded-for.
  const xff = req.headers.get("x-forwarded-for") ?? "";
  const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
  return parts[parts.length - 1] ?? "unknown";
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now  = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    if (attempts.size > 500) attempts.delete(attempts.keys().next().value!);
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }
  entry.count += 1;
  return { allowed: entry.count <= RATE_LIMIT, remaining: Math.max(0, RATE_LIMIT - entry.count) };
}

export async function POST(req: NextRequest) {
  if (!SECRET) {
    return NextResponse.json({ error: "ADMIN_SECRET is not configured" }, { status: 503 });
  }

  let body: { password?: string; action?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 }); }

  if (body.action === "logout") {
    const res = NextResponse.json({ ok: true });
    clearAdminCookie(res);
    return res;
  }

  const ip = getIp(req);
  const { allowed, remaining } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "عدد محاولات كثيرة — انتظر 15 دقيقة" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(WINDOW_MS / 1000)) } }
    );
  }

  if (body.password !== SECRET) {
    return NextResponse.json(
      { error: "كلمة المرور غير صحيحة", remaining },
      { status: 401 }
    );
  }

  // Reset on successful login
  attempts.delete(ip);
  const res = NextResponse.json({ ok: true });
  setAdminCookie(res);
  return res;
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ authed: !!SECRET && isAdminAuthed(req) });
}
