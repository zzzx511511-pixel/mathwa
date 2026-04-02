import { EmployeePortalShell } from "@/components/employee/employee-portal-shell";
import { EmployeeRoomCard } from "@/components/employee/employee-room-card";
import { EmployeeSectionHub } from "@/components/employee/employee-section-hub";

export default function EmployeeEServicesRoomPage() {
  return (
    <EmployeePortalShell>
      <EmployeeSectionHub departmentKey="e_services">
        <div className="grid gap-4 md:grid-cols-2">
          <EmployeeRoomCard href="/employee/service-content" title="تفاصيل الخدمات">
            تعديل نصوص الخدمات والمزايا الظاهرة للعملاء على الموقع العام — يعمل الآن؛ يمكن توسيعه لاحقاً من
            نفس قسم المحتوى المركزي.
          </EmployeeRoomCard>
        </div>
      </EmployeeSectionHub>
    </EmployeePortalShell>
  );
}
