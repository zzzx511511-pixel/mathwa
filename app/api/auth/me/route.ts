import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/get-session-user-id";
import { getUserRole } from "@/lib/auth/get-user-role";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const role = await getUserRole();
  let profile: Record<string, unknown> | null = null;
  try {
    const supabase = getSupabaseServerClient();
    const { data } = await supabase.from("users").select("full_name, phone, email").eq("id", userId).maybeSingle();
    profile = data as Record<string, unknown> | null;
  } catch {
    /* جدول users غير متاح في وضع المعاينة أو بدون صلاحية */
  }

  return NextResponse.json({
    authenticated: true,
    userId,
    role,
    profile
  });
}
