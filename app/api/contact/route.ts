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
    .replace(/<[^>]*>/g, "")
    .replace(/[^\p{L}\p{N}\p{P}\p{Z}\p{Emoji}]/gu, "")
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

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "البريد الإلكتروني غير صالح." }, { status: 400 });
  }

  let attempted = 0;
  let succeeded = 0;
  let lastError = "";

  // 1. Save to Supabase (optional)
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && supabaseKey) {
    attempted++;
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
      if (res.ok) {
        succeeded++;
      } else {
        lastError = `supabase:${res.status}`;
      }
    } catch (e) {
      lastError = `supabase:network`;
      console.error("Supabase contact error:", e);
    }
  }

  // 2. Send via Web3Forms (optional — requires WEB3FORMS_KEY)
  const web3key = process.env.WEB3FORMS_KEY;
  if (web3key) {
    attempted++;
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
          from_name: "سلسبيل",
        }),
      });
      // Web3Forms returns { success: true/false } — check both HTTP status and body
      const data = await res.json() as { success?: boolean; message?: string };
      if (res.ok && data.success) {
        succeeded++;
      } else {
        lastError = `web3forms:${data.message ?? res.status}`;
        console.error("Web3Forms error:", data);
      }
    } catch (e) {
      lastError = "web3forms:network";
      console.error("Web3Forms network error:", e);
    }
  }

  // No integrations configured — return success in dev so the form is usable
  if (attempted === 0) {
    return NextResponse.json({ ok: true });
  }

  if (succeeded === 0) {
    console.error("All contact integrations failed. Last error:", lastError);
    return NextResponse.json(
      { error: "حدث خطأ أثناء الإرسال، يرجى المحاولة لاحقاً." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
