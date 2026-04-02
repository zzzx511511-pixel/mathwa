import { EmployeePortalShell } from "@/components/employee/employee-portal-shell";
import { EmployeeDashboardContent } from "@/components/employee/employee-dashboard-content";

export default function EmployeeDashboardPage() {
  return (
    <EmployeePortalShell>
      <EmployeeDashboardContent />
    </EmployeePortalShell>
  );
}

