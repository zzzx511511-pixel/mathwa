import { NextRequest, NextResponse } from "next/server";
import { setAdminCookie, clearAdminCookie, isAdminAuthed } from "@/lib/salsabeel/admin-auth";

const SECRET = process.env.ADMIN_SECRET ?? "";

export async function POST(req: NextRequest) {
  if (!SECRET) {
    // No secret configured → auth disabled in this environment
    return NextResponse.json({ ok: true });
  }
  let body: { password?: string; action?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 }); }

  if (body.action === "logout") {
    const res = NextResponse.json({ ok: true });
    clearAdminCookie(res);
    return res;
  }

  if (body.password !== SECRET) {
    return NextResponse.json({ error: "كلمة المرور غير صحيحة" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  setAdminCookie(res);
  return res;
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ authed: !SECRET || isAdminAuthed(req) });
}
