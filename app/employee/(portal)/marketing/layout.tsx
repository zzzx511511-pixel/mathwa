import type { ReactNode } from "react";
import { requireDepartmentAccess } from "@/lib/employee/require-department-access";

export default async function MarketingDeptLayout({ children }: { children: ReactNode }) {
  await requireDepartmentAccess("marketing");
  return <>{children}</>;
}
