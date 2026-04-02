import { requireAuth } from "@/lib/auth/require-auth";
import { getUserRole } from "@/lib/auth/get-user-role";
import { requireRecordExists } from "@/lib/auth/require-record-exists";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function OwnerLayout({
  children
}: {
  children: ReactNode;
}) {
  const userId = await requireAuth();

  const role = await getUserRole();
  if (role === "client" || role === "super_admin" || role === "manager") {
    await requireRecordExists({
      table: "owners",
      userIdColumn: "user_id",
      redirectTo: "/unauthorized",
      userId
    });
    return <>{children}</>;
  }

  // For any other role, deny unless owners record exists.
  await requireRecordExists({
    table: "owners",
    userIdColumn: "user_id",
    redirectTo: "/unauthorized",
    userId
  });
  return <>{children}</>;
}

