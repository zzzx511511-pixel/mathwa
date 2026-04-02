import type { ReactNode } from "react";
import { PortalShell } from "@/components/layout/portal-shell";
import { employeePortalNavGroups } from "@/lib/employee/employee-portal-nav";

export function EmployeePortalShell({ children }: { children: ReactNode }) {
  return (
    <PortalShell title="لوحة الموظفين" navGroups={employeePortalNavGroups}>
      {children}
    </PortalShell>
  );
}
