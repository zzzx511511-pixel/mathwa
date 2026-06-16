import { NextRequest, NextResponse } from "next/server";

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: NextRequest) {
  try {
    const { place_id } = await req.json();
    if (!place_id || !SUPA_URL || !SUPA_KEY) return NextResponse.json({ ok: false });
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
