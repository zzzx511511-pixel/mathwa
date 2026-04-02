import { getSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { codeSessionCookieName, parseCodeSessionToken } from "@/lib/auth/code-session-cookie";

export type AppRole =
  | "super_admin"
  | "manager"
  | "employee"
  | "collector"
  | "client"
  | string;

export async function getUserRole(): Promise<AppRole | null> {
  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch {
    return null;
  }

  const {
    data: { session }
  } = await supabase.auth.getSession();

  const userId = session?.user?.id;
  if (!userId) {
    const token = cookies().get(codeSessionCookieName())?.value;
    if (!token) return null;
    const parsed = parseCodeSessionToken(token);
    return (parsed?.role as AppRole | undefined) ?? null;
  }

  // 1) Try metadata first (in case the role is stored in auth JWT/user metadata).
  const userMeta = session.user.user_metadata as Record<string, unknown> | undefined;
  const appMeta = session.user.app_metadata as Record<string, unknown> | undefined;
  const metadataRole = (userMeta?.role ?? appMeta?.role ?? null) as AppRole | null;
  if (metadataRole) return metadataRole as AppRole;

  // 2) Fallback: fetch role from `users` table (as suggested by PRD).
  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) return null;
  return (data?.role as AppRole | undefined) ?? null;
}

