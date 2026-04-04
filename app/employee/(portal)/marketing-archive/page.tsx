import { EmployeePortalShell } from "@/components/employee/employee-portal-shell";
import { EstatesBreadcrumb } from "@/components/employee/estates-breadcrumb";
import { MarketingListingsManager } from "@/components/employee/marketing-listings-manager";

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
          <h2 className="text-2xl font-bold text-brand-400">إدارة العروض المحفوظة</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-900/80">
            العروض التسويقية المحفوظة في جدول <code className="text-xs">listings</code>. زر{" "}
            <strong>حذف نهائي</strong> يزيل السجل من قاعدة البيانات ويختفي العرض عن الموقع العام.
          </p>
        </header>
        <MarketingListingsManager />
      </div>
    </EmployeePortalShell>
  );
}
