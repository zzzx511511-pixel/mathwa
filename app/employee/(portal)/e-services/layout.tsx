import type { ReactNode } from "react";
import { requireDepartmentAccess } from "@/lib/employee/require-department-access";

export default async function EServicesDeptLayout({ children }: { children: ReactNode }) {
  await requireDepartmentAccess("e_services");
  return <>{children}</>;
}
