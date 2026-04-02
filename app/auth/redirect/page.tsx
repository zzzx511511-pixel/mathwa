import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth/get-session-user-id";
import { getUserRole } from "@/lib/auth/get-user-role";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function recordExists(
  supabase: any,
  table: string,
  col: string,
  userId: string
): Promise<boolean> {
  try {
    const { data } = await supabase
      .from(table)
      .select("id")
      .eq(col, userId)
      .maybeSingle();
    return Boolean(data?.id);
  } catch {
    return false;
  }
}

export default async function AuthRedirectPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const role = await getUserRole();
  const supabase = getSupabaseServerClient();

  // Role-first routing when possible (مواصفة الوصول: موظف/مدير → إدارة الأملاك أولاً).
  if (role === "collector") redirect("/finance/dashboard");
  if (
    role === "employee" ||
    role === "manager" ||
    role === "super_admin" ||
    role === "admin"
  ) {
    redirect("/employee/dashboard");
  }
  if (role === "owner") redirect("/owner/properties");
  if (role === "client" || role === "tenant") redirect("/client/contracts");

  const hasOwner = await recordExists(supabase, "owners", "user_id", userId);

  // client-first routing.
  if (role === "client" || !role) {
    if (hasOwner) redirect("/owner/properties");
    redirect("/client/contracts");
  }

  // Unknown role: fall back to record existence checks (in parallel).
  const [hasEmployee, hasFinance, hasTenant] = await Promise.all([
    recordExists(
      supabase,
      "contracts",
      "responsible_employee_id",
      userId
    ),
    recordExists(
      supabase,
      "collection_schedule",
      "collector_id",
      userId
    ),
    recordExists(supabase, "contracts", "client_id", userId)
  ]);

  if (hasOwner) redirect("/owner/properties");
  if (hasEmployee) redirect("/employee/dashboard");
  if (hasFinance) redirect("/finance/dashboard");
  if (hasTenant) redirect("/client/contracts");

  redirect("/unauthorized");
}

