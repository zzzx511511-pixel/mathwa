import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth/get-session-user-id";

export type RequireAuthOptions = {
  /** افتراضي: /login — استخدم /employee/login لبوابة الموظفين */
  redirectTo?: string;
};

export async function requireAuth(options?: RequireAuthOptions): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId) redirect(options?.redirectTo ?? "/login");
  return userId;
}

