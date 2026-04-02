import type { ReactNode } from "react";
import { requireDepartmentAccess } from "@/lib/employee/require-department-access";

export default async function FinanceDeptLayout({ children }: { children: ReactNode }) {
  await requireDepartmentAccess("finance");
  return <>{children}</>;
}
