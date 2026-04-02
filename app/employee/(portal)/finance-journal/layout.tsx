import type { ReactNode } from "react";
import { requireDepartmentAccess } from "@/lib/employee/require-department-access";

export default async function FinanceJournalLayout({ children }: { children: ReactNode }) {
  await requireDepartmentAccess("finance");
  return <>{children}</>;
}
