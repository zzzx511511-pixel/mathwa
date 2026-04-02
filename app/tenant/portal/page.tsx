import { PortalShell } from "@/components/layout/portal-shell";

export default function TenantPortalPage() {
  return (
    <PortalShell
      title="بوابة المستأجر"
      nav={[
        { href: "/tenant/portal", label: "الرئيسية" },
        { href: "/tenant/contracts", label: "العقود" },
        { href: "/tenant/payments", label: "الدفعات" },
        { href: "/tenant/maintenance", label: "الصيانة" },
        { href: "/tenant/documents", label: "المستندات" }
      ]}
    >
      <section className="rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-2xl font-bold text-brand-400">بوابة المستأجر</h2>
        <p className="text-ink-900/80">
          بداية واجهة المستأجر للعقود والدفعات وطلبات الصيانة، وسيتم ربطها بـ Auth و RLS.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <InfoCard title="العقود" items={["عرض العقود", "حالة العقد"]} />
          <InfoCard title="الدفعات" items={["سجل المدفوعات", "المبالغ المستحقة"]} />
          <InfoCard title="الصيانة" items={["رفع طلب صيانة", "متابعة الحالة"]} />
          <InfoCard
            title="مستندات"
            items={["مرفقات المستأجر", "سياسات الاستخدام"]}
          />
        </div>
      </section>
    </PortalShell>
  );
}

function InfoCard({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="rounded-2xl border border-ink-900/10 bg-brand-100 p-4">
      <h4 className="text-base font-semibold text-brand-400">{title}</h4>
      <ul className="mt-2 list-disc pr-5 text-sm text-ink-900/80">
        {items.map((it) => (
          <li key={it}>{it}</li>
        ))}
      </ul>
    </article>
  );
}
