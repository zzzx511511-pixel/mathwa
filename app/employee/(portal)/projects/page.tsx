import { EmployeePortalShell } from "@/components/employee/employee-portal-shell";
import { EmployeeSectionHub } from "@/components/employee/employee-section-hub";

export default function EmployeeProjectsRoomPage() {
  return (
    <EmployeePortalShell>
      <EmployeeSectionHub departmentKey="projects" />
    </EmployeePortalShell>
  );
}
