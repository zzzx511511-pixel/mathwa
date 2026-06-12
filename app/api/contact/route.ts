import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiter: 3 requests per 5 minutes per IP
const rateMap = new Map<string, { count: number; resetAt: number }>();
const LIMIT = 3;
const WINDOW_MS = 5 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= LIMIT) return false;
  entry.count++;
  return true;
}

function sanitize(s: string, maxLen: number): string {
  return s
    .trim()
    .replace(/<[^>]*>/g, "")     // strip HTML tags
    .replace(/[^\p{L}\p{N}\p{P}\p{Z}\p{Emoji}]/gu, "") // keep letters, numbers, punctuation, spaces, emoji
    .slice(0, maxLen);
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "تجاوزت عدد المحاولات المسموح بها، حاول لاحقاً." },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 });
  }

  const name    = sanitize(String(body.name    ?? ""), 100);
  const email   = sanitize(String(body.email   ?? ""), 200);
  const type    = sanitize(String(body.type    ?? ""), 100);
  const message = sanitize(String(body.message ?? ""), 2000);

  if (!name || !email || !type || !message) {
    return NextResponse.json({ error: "جميع الحقول مطلوبة." }, { status: 400 });
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "البريد الإلكتروني غير صالح." }, { status: 400 });
  }

  const errors: string[] = [];

  // 1. Save to Supabase (optional — requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
  const supabaseUrl  = process.env.SUPABASE_URL;
  const supabaseKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && supabaseKey) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/contact_messages`, {
        method: "POST",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({ name, email, type, message }),
      });
      if (!res.ok) errors.push("supabase");
    } catch {
      errors.push("supabase");
    }
  }

  // 2. Send via Web3Forms (optional — requires WEB3FORMS_KEY)
  const web3key = process.env.WEB3FORMS_KEY;
  if (web3key) {
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: web3key,
          name,
          email,
          subject: `[سلسبيل] رسالة جديدة: ${type}`,
          message,
        }),
      });
      if (!res.ok) errors.push("web3forms");
    } catch {
      errors.push("web3forms");
    }
  }

  // Succeed as long as at least one destination worked (or if neither is configured)
  if (!supabaseUrl && !web3key) {
    // No integrations configured — still return success so the form works in dev
    return NextResponse.json({ ok: true });
  }

  if (errors.length === 2) {
    // Both failed
    return NextResponse.json(
      { error: "حدث خطأ أثناء الإرسال، يرجى المحاولة لاحقاً." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
