import { EmployeePortalShell } from "@/components/employee/employee-portal-shell";
import { EstatesBreadcrumb } from "@/components/employee/estates-breadcrumb";

export default function MarketingArchivePage() {
  return (
    <EmployeePortalShell>
      <div className="space-y-4">
        <EstatesBreadcrumb
          items={[
            { label: "التسويق", href: "/employee/marketing" },
            { label: "أرشيف العروض" }
          ]}
        />
        <header className="rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-brand-400">أرشيف العروض</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-900/80">
            حسب المواصفة: العروض ذات الحالة <strong>مباع</strong> أو <strong>موقوف</strong> تُخفى تلقائياً عن
            الموقع العام، وتبقى مرئية للموظفين والمسؤولين هنا. زر <strong>إعادة التفعيل</strong> يعيد
            العرض للحالة النشطة بعد المراجعة. طلب الحذف يمرّ بحالة <strong>قيد اعتماد الحذف</strong> حتى
            موافقة المدير.
          </p>
        </header>
        <section className="rounded-2xl border border-dashed border-ink-900/20 bg-brand-50/50 p-8 text-center">
          <p className="text-sm font-medium text-ink-900/75">
            لا توجد عروض مؤرشفة في وضع المعاينة. بعد ربط جدول العروض وحقول الحالة في Supabase ستُعرض
            القائمة هنا مع تصفية <code className="rounded bg-white/80 px-1">sold | paused | pending_delete</code>.
          </p>
        </section>
      </div>
    </EmployeePortalShell>
  );
}
