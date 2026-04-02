import { EmployeePortalShell } from "@/components/employee/employee-portal-shell";
import { EmployeeRoomCard } from "@/components/employee/employee-room-card";
import { EstatesBreadcrumb } from "@/components/employee/estates-breadcrumb";
import { EmployeeSectionHub } from "@/components/employee/employee-section-hub";

export default function EmployeeFinanceRoomPage() {
  return (
    <EmployeePortalShell>
      <div className="space-y-6">
        <EstatesBreadcrumb items={[{ label: "المالية" }]} />

        <EmployeeSectionHub departmentKey="finance">
          <p className="rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 text-xs leading-relaxed text-emerald-950/90">
            عند تفعيل <strong>وضع المعاينة</strong> أو <strong>NEXT_PUBLIC_EMPLOYEE_PORTAL_OPEN</strong> يمكن
            الدخول إلى صفحات المالية المستقلة بدون التحقق الكامل من الأدوار (للتطوير فقط).
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <EmployeeRoomCard href="/finance/dashboard" title="لوحة المالية">
              ملخص العمولات وتحويلات الملاك (<span className="font-mono">owner_transfers</span>) مع أرقام
              التجربة.
            </EmployeeRoomCard>
            <EmployeeRoomCard href="/finance/ledger" title="سجل التحصيل">
              جدول <span className="font-mono">collection_schedule</span> — مواعيد ومتابعة التحصيل.
            </EmployeeRoomCard>
            <EmployeeRoomCard href="/finance/invoices" title="الفواتير">
              فواتير العقود والمستحقات من جدول <span className="font-mono">invoices</span>.
            </EmployeeRoomCard>
            <EmployeeRoomCard href="/finance/reports" title="التقارير المالية">
              أعداد مبسطة للفواتير وبنود التحصيل.
            </EmployeeRoomCard>
            <EmployeeRoomCard href="/employee/finance-journal" title="مسودة قيد / مذكرة">
              تسجيل سريع لمذكرة أو مصروف/إيراد (معاينة) إلى حين ربط القيود المحاسبية.
            </EmployeeRoomCard>
          </div>
        </EmployeeSectionHub>
      </div>
    </EmployeePortalShell>
  );
}
