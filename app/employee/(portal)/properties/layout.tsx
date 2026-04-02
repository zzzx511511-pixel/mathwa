import type { ReactNode } from "react";
import { requireDepartmentAccess } from "@/lib/employee/require-department-access";

export default async function EmployeePropertiesDeptLayout({ children }: { children: ReactNode }) {
  await requireDepartmentAccess("estates");
  return <>{children}</>;
}
