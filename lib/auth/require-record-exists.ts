import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth/get-session-user-id";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function requireRecordExists(params: {
  table: string;
  /**
   * Column that links the record to auth user.
   * In PRD v2 we saw:
   * - owners.user_id
   */
  userIdColumn: string;
  redirectTo?: string;
  userId?: string;
}) {
  const redirectTo = params.redirectTo ?? "/unauthorized";
  const userId = params.userId ?? (await getSessionUserId());
  if (!userId) redirect(redirectTo);

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch {
    redirect(redirectTo);
  }

  const { data, error } = await supabase
    .from(params.table)
    .select("id")
    .eq(params.userIdColumn, userId)
    .maybeSingle();

  if (error || !data) redirect(redirectTo);
}

