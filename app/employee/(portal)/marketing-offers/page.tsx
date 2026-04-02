import { EmployeePortalShell } from "@/components/employee/employee-portal-shell";
import { EstatesBreadcrumb } from "@/components/employee/estates-breadcrumb";
import { MarketingOfferCreateForm } from "@/components/employee/marketing-offer-create-form";

export default function EmployeeMarketingOffersPage() {
  return (
    <EmployeePortalShell>
      <div className="space-y-4">
        <EstatesBreadcrumb
          items={[
            { label: "التسويق", href: "/employee/marketing" },
            { label: "إضافة عرض" }
          ]}
        />
        <header className="rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-brand-400">إضافة عرض جديد</h2>
          <p className="mt-2 text-sm text-ink-900/75">
            بيانات العرض تظهر للزوار بعد ربط الحفظ بقاعدة البيانات؛ في وضع المعاينة يُقبل الحفظ دون تخزين
            حقيقي.
          </p>
        </header>
        <MarketingOfferCreateForm />
      </div>
    </EmployeePortalShell>
  );
}
