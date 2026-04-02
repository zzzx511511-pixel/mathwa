import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { codeSessionCookieName } from "@/lib/auth/code-session-cookie";

export async function POST() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const response = NextResponse.json({ ok: true });

  if (url && anon) {
    const cookieStore = cookies();
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        }
      }
    });
    await supabase.auth.signOut();
  }

  response.cookies.set("demo_role", "", { path: "/", maxAge: 0, sameSite: "lax" });
  response.cookies.set(codeSessionCookieName(), "", { path: "/", maxAge: 0, sameSite: "lax", httpOnly: true });
  return response;
}
