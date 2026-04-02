import { EmployeePortalShell } from "@/components/employee/employee-portal-shell";
import { EstatesBreadcrumb } from "@/components/employee/estates-breadcrumb";
import { FinanceJournalDraftForm } from "@/components/employee/finance-journal-draft-form";

export default function EmployeeFinanceJournalPage() {
  return (
    <EmployeePortalShell>
      <div className="space-y-4">
        <EstatesBreadcrumb
          items={[{ label: "المالية", href: "/employee/finance" }, { label: "مسودة قيد" }]}
        />
        <header className="rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-brand-400">مسودة قيد / مذكرة مالية</h2>
          <p className="mt-2 text-sm text-ink-900/75">
            للاستخدام أثناء التطوير؛ القيد الدفتر الكامل والاعتماد يبانان بعد ربط نظام المحاسبة وقوائم الحسابات.
          </p>
        </header>
        <FinanceJournalDraftForm />
      </div>
    </EmployeePortalShell>
  );
}
