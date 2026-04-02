import type { ReactNode } from "react";
import { requireDepartmentAccess } from "@/lib/employee/require-department-access";

export default async function ProjectsDeptLayout({ children }: { children: ReactNode }) {
  await requireDepartmentAccess("projects");
  return <>{children}</>;
}
