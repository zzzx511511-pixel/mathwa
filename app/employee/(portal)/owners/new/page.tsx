import { EmployeePortalShell } from "@/components/employee/employee-portal-shell";
import { EstatesBreadcrumb } from "@/components/employee/estates-breadcrumb";
import { OwnerCreateForm } from "@/components/employee/owner-create-form";

export const dynamic = "force-dynamic";

export default function NewOwnerPage() {
  return (
    <EmployeePortalShell>
      <EstatesBreadcrumb
        items={[
          { label: "إدارة الأملاك", href: "/employee/estates" },
          { label: "إضافة مالك" }
        ]}
      />

      <div className="space-y-4">
        <header className="rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-gold-600">نموذج</p>
          <h1 className="mt-1 text-2xl font-bold text-brand-400">إضافة مالك</h1>
          <p className="mt-2 text-sm text-ink-900/75">
            أدخل بيانات المالك الأساسية. (في وضع المعاينة يتم الحفظ شكلياً فقط إلى أن نربط قاعدة البيانات.)
          </p>
        </header>
        <OwnerCreateForm />
      </div>
    </EmployeePortalShell>
  );
}

