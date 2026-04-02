import { requireAuth } from "@/lib/auth/require-auth";
import { getUserRole } from "@/lib/auth/get-user-role";
import { requireRecordExists } from "@/lib/auth/require-record-exists";
import { isInternalPreviewOrPortalOpen } from "@/lib/auth/is-internal-preview-or-portal-open";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function FinanceLayout({
  children
}: {
  children: ReactNode;
}) {
  if (isInternalPreviewOrPortalOpen()) {
    return <>{children}</>;
  }

  const userId = await requireAuth();

  const role = await getUserRole();
  if (role === "collector" || role === "manager" || role === "super_admin") {
    return <>{children}</>;
  }

  // Record-based fallback:
  // PRD v1: finance/collection uses `collection_schedule.collector_id`.
  await requireRecordExists({
    table: "collection_schedule",
    userIdColumn: "collector_id",
    redirectTo: "/unauthorized",
    userId
  });

  return <>{children}</>;
}

