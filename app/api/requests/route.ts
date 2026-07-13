import { NextRequest, NextResponse } from "next/server";
import { createRequest, getPendingRequests } from "@/lib/salsabeel/supabase-requests";
import { isAdminAuthed, unauthorized } from "@/lib/salsabeel/admin-auth";

export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();
  const requests = await getPendingRequests();
  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, place_id, place_name, content } = body;
    if (!type || !content) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }
    const ok = await createRequest({ type, place_id, place_name, content });
    if (!ok) return NextResponse.json({ error: "فشل الحفظ" }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
}
