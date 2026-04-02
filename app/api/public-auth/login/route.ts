import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { normalizeUsername } from "@/lib/auth/credentials";

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !serviceKey) return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });

  const body = (await req.json().catch(() => ({}))) as { username?: unknown; password?: unknown };
  const username = normalizeUsername(body.username);
  const password = String(body.password ?? "");
  if (!username || !password) {
    return NextResponse.json({ error: "invalid_input", message: "اسم المستخدم وكلمة المرور مطلوبان." }, { status: 400 });
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin
    .from("users")
    .select("id, role, email, is_active")
    .eq("username", username)
    .in("role", ["owner", "client"])
    .maybeSingle();
  if (error) return NextResponse.json({ error: "database_error", message: error.message }, { status: 500 });
  if (!data?.id) {
    return NextResponse.json({ error: "invalid_credentials", message: "بيانات الدخول غير صحيحة." }, { status: 401 });
  }
  if (data.is_active === false) {
    return NextResponse.json({ error: "account_disabled", message: "الحساب موقوف." }, { status: 403 });
  }

  let email = String(data.email ?? "").trim();
  if (!email) {
    const { data: authUser } = await admin.auth.admin.getUserById(String(data.id));
    email = String(authUser?.user?.email ?? "").trim();
  }
  if (!email) {
    return NextResponse.json(
      { error: "profile_incomplete", message: "الحساب غير مكتمل. أكمل بيانات التسجيل أولاً." },
      { status: 400 }
    );
  }

  let res = NextResponse.json({ ok: true, redirectTo: data.role === "owner" ? "/owner/properties" : "/client/contracts" });
  const cookieStore = cookies();
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options);
        });
      }
    }
  });
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    return NextResponse.json({ error: "invalid_credentials", message: "بيانات الدخول غير صحيحة." }, { status: 401 });
  }

  return res;
}
