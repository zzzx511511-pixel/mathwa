import { NextRequest, NextResponse } from "next/server";

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 1 visit per IP per place per 10 minutes — prevents easy count inflation
const visitMap = new Map<string, number>();
const VISIT_WINDOW = 10 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const { place_id } = await req.json();
    if (!place_id || typeof place_id !== "string" || place_id.length > 100) {
      return NextResponse.json({ ok: false });
    }
    if (!SUPA_URL || !SUPA_KEY) return NextResponse.json({ ok: false });

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const key = `${ip}:${place_id}`;
    const now = Date.now();
    if ((visitMap.get(key) ?? 0) + VISIT_WINDOW > now) return NextResponse.json({ ok: true });
    visitMap.set(key, now);
    if (visitMap.size > 2000) visitMap.delete(visitMap.keys().next().value!);
    await fetch(`${SUPA_URL}/rest/v1/place_visits`, {
      method: "POST",
      headers: {
        apikey: SUPA_KEY,
        Authorization: `Bearer ${SUPA_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ place_id }),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
