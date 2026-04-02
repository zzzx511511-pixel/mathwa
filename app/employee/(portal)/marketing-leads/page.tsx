import { EmployeePortalShell } from "@/components/employee/employee-portal-shell";
import { EstatesBreadcrumb } from "@/components/employee/estates-breadcrumb";
import { MarketingLeadsPanel } from "@/components/employee/marketing-leads-panel";

export default function MarketingLeadsPage() {
  return (
    <EmployeePortalShell>
      <div className="space-y-4">
        <EstatesBreadcrumb
          items={[
            { label: "التسويق", href: "/employee/marketing" },
            { label: "العملاء المحتملون" }
          ]}
        />
        <header className="rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-brand-400">العملاء المحتملون (Leads)</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-900/80">
            مطابقة المستند v2: بعد ربط قاعدة البيانات يُشغَّل محرك المطابقة عند إضافة listing (نوع + ميزانية
            + مدينة)، مع زر إرسال عبر واتساب من كل مطابقة.
          </p>
        </header>
        <MarketingLeadsPanel />
      </div>
    </EmployeePortalShell>
  );
}
