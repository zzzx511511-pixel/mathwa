import type { ReactNode } from "react";
import { requireEmployeePortalSession } from "@/lib/auth/require-employee-portal-session";

export const dynamic = "force-dynamic";

export default async function EmployeePortalLayout({
  children
}: {
  children: ReactNode;
}) {
  await requireEmployeePortalSession();
  return <>{children}</>;
}
