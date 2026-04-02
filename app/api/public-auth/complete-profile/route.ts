import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { normalizeUsername } from "@/lib/auth/credentials";

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon) return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });

  const cookieStore = cookies();
  const res = NextResponse.json({ ok: true });
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

  let user =
    (
      await supabase.auth.getUser()
    ).data.user ?? null;

  // fallback: دعم التوكن القادم من رابط التأكيد مباشرة.
  if (!user?.id) {
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";
    if (token) {
      const tokenClient = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
      const { data } = await tokenClient.auth.getUser(token);
      user = data.user ?? null;
    }
  }
  if (!user?.id || !user?.email) {
    return NextResponse.json({ error: "unauthorized", message: "أكّد بريدك ثم أعد فتح رابط التأكيد." }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { username?: unknown; role?: unknown };
  const username = normalizeUsername(body.username);
  const role = String(body.role ?? "");
  if (!username || !["owner", "client"].includes(role)) {
    return NextResponse.json({ error: "invalid_input", message: "تحقق من اسم المستخدم ونوع الحساب." }, { status: 400 });
  }

  const writeClient = serviceKey
    ? createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : supabase;
  const payload = {
    id: user.id,
    email: user.email,
    full_name: user.email.split("@")[0],
    username,
    role,
    is_active: true
  };

  const { error } = await writeClient.from("users").upsert(
    payload,
    { onConflict: "id" }
  );
  if (error && !serviceKey) {
    // fallback with anon + RLS: try update existing row first.
    const { error: updateError } = await supabase.from("users").update(payload).eq("id", user.id);
    if (!updateError) {
      return NextResponse.json({
        ok: true,
        redirectTo: role === "owner" ? "/owner/properties" : "/client/contracts"
      });
    }
  }

  if (error) {
    return NextResponse.json({ error: "database_error", message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    redirectTo: role === "owner" ? "/owner/properties" : "/client/contracts"
  });
}
