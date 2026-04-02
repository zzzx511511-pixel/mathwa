import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });

  const body = (await req.json().catch(() => ({}))) as {
    email?: unknown;
    password?: unknown;
    emailRedirectTo?: unknown;
  };
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const emailRedirectTo = String(body.emailRedirectTo ?? "").trim();
  if (!email || !password) {
    return NextResponse.json({ error: "invalid_input", message: "البريد وكلمة المرور مطلوبان." }, { status: 400 });
  }

  const supabase = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: emailRedirectTo || undefined
    }
  });
  if (error) return NextResponse.json({ error: "signup_failed", message: error.message }, { status: 400 });

  // نضمن إرسال رسالة التفعيل حتى لو الحساب موجود مسبقاً وغير مؤكَّد.
  if (!data.session) {
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: emailRedirectTo || undefined }
    });
    if (resendError) {
      return NextResponse.json({ error: "resend_failed", message: resendError.message }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true });
}
