import { getSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { codeSessionCookieName, parseCodeSessionToken } from "@/lib/auth/code-session-cookie";

export async function getSessionUserId(): Promise<string | null> {
  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { session }
    } = await supabase.auth.getSession();
    if (session?.user?.id) return session.user.id;
  } catch {
    // fallback below
  }

  try {
    const token = cookies().get(codeSessionCookieName())?.value;
    if (!token) return null;
    return parseCodeSessionToken(token)?.userId ?? null;
  } catch {
    return null;
  }
}

