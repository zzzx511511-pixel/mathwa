import type { User } from "@supabase/supabase-js";
import { supabaseClient } from "@/lib/supabase/client";

export type PublicAccountRole = "client" | "owner" | "employee" | "collector";

export function normalizePublicRole(raw: unknown): PublicAccountRole {
  if (raw === "client" || raw === "owner" || raw === "employee" || raw === "collector") {
    return raw;
  }
  return "client";
}

export function roleFromAuthUser(user: User): PublicAccountRole {
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const app = user.app_metadata as Record<string, unknown> | undefined;
  return normalizePublicRole(meta?.role ?? app?.role);
}

/**
 * يحدّث صف `public.users` للمستخدم الحالي.
 * يفضّل استدعاء `sync_user_role` في SQL (SECURITY DEFINER) ثم الرجوع إلى upsert إن لم تُنفَّذ الدالة بعد.
 */
export async function syncPublicUserRole(
  userId: string,
  role: PublicAccountRole
): Promise<{ ok: boolean; message?: string }> {
  const { error: rpcError } = await supabaseClient.rpc("sync_user_role", {
    p_role: role
  });
  if (!rpcError) {
    return { ok: true };
  }

  const { error } = await supabaseClient.from("users").upsert(
    { id: userId, role },
    { onConflict: "id" }
  );
  if (error) {
    return {
      ok: false,
      message: `${rpcError.message} — ثم: ${error.message}`
    };
  }
  return { ok: true };
}
