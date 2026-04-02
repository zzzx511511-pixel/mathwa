import { requireAuth } from "@/lib/auth/require-auth";
import { getUserRole } from "@/lib/auth/get-user-role";
import { requireRecordExists } from "@/lib/auth/require-record-exists";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function TenantLayout({
  children
}: {
  children: ReactNode;
}) {
  const userId = await requireAuth();

  const role = await getUserRole();
  if (role === "client" || role === "super_admin" || role === "manager") {
    return <>{children}</>;
  }

  // Record-based fallback:
  // PRD v1: contracts have `client_id` linked to auth.uid().
  await requireRecordExists({
    table: "contracts",
    userIdColumn: "client_id",
    redirectTo: "/unauthorized",
    userId
  });

  return <>{children}</>;
}

