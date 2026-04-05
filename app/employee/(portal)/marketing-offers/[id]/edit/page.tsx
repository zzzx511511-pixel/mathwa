import { EmployeePortalShell } from "@/components/employee/employee-portal-shell";
import { EstatesBreadcrumb } from "@/components/employee/estates-breadcrumb";
import { MarketingOfferCreateForm } from "@/components/employee/marketing-offer-create-form";

export default function EditMarketingOfferPage({ params }: { params: { id: string } }) {
  const id = params.id?.trim() ?? "";
  return (
    <EmployeePortalShell>
      <div className="space-y-4">
        <EstatesBreadcrumb
          items={[
            { label: "التسويق", href: "/employee/marketing" },
            { label: "أرشيف العروض", href: "/employee/marketing-archive" },
            { label: "تعديل عرض" }
          ]}
        />
        <header className="rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-brand-400">تعديل عرض تسويقي</h2>
          <p className="mt-2 text-sm text-ink-900/75">
            تُحدَّث البيانات دون تغيير حالة النشر أو الأرشفة تلقائياً.
          </p>
        </header>
        {id ? <MarketingOfferCreateForm editListingId={id} /> : null}
      </div>
    </EmployeePortalShell>
  );
}
