import { EmployeePortalShell } from "@/components/employee/employee-portal-shell";
import { EmployeeRoomCard } from "@/components/employee/employee-room-card";
import { EmployeeSectionHub } from "@/components/employee/employee-section-hub";

export default function EmployeeMarketingRoomPage() {
  return (
    <EmployeePortalShell>
      <EmployeeSectionHub departmentKey="marketing">
        <div className="grid gap-4 md:grid-cols-2">
          <EmployeeRoomCard href="/employee/marketing-offers" title="إضافة العروض">
            نموذج كامل: مساحة، طريقة الدفع، مميزات، إحداثيات ومعاينة خريطة، مستوى خطورة للصناعي، معرض صور
            (روابط حتى 8)، فيديو اختياري، ووصف.
          </EmployeeRoomCard>
          <EmployeeRoomCard href="/employee/marketing-leads" title="العملاء المحتملون (Leads)">
            تسجيل الطلبات والمصدر والحالة — تخزين معاينة محلي حتى تفعيل المطابقة التلقائية وواتساب.
          </EmployeeRoomCard>
          <EmployeeRoomCard href="/employee/marketing-archive" title="أرشيف العروض">
            عروض مباعة / موقوفة / طلب حذف — واجهة جاهزة لربط قاعدة البيانات وإعادة التفعيل.
          </EmployeeRoomCard>
          <EmployeeRoomCard href="/offers" title="معاينة صفحة العروض العامة">
            كما يراها الزوار على الموقع (قائمة العروض الشاغرة من قاعدة البيانات عند التفعيل).
          </EmployeeRoomCard>
        </div>
      </EmployeeSectionHub>
    </EmployeePortalShell>
  );
}
