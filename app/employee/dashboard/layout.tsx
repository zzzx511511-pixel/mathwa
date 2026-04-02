import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth/get-session-user-id";
import { requireEmployeePortalSession } from "@/lib/auth/require-employee-portal-session";

export const dynamic = "force-dynamic";

export default async function EmployeeDashboardLayout({ children }: { children: ReactNode }) {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/");
  }
  await requireEmployeePortalSession();
  return <>{children}</>;
}
