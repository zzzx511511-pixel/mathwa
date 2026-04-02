import { PortalShell } from "@/components/layout/portal-shell";

export default function OwnerPortalPage() {
  return (
    <PortalShell
      title="بوابة المالك"
      nav={[
        { href: "/owner/portal", label: "الرئيسية" },
        { href: "/owner/properties", label: "العقارات" },
        { href: "/owner/owner-transfers", label: "تحويلات الملكية" }
      ]}
    >
      <div className="space-y-6">
        <section className="rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-2xl font-bold text-brand-400">بوابة المالك</h2>
          <p className="text-ink-900/80">
            متطلبات `prd v2` تدعم عرض “الملفات/الهوية” و“تحويلات الملكية” مع حالات (pending / transferred / cancelled).
          </p>
        </section>

        <section className="rounded-2xl border border-ink-900/10 bg-brand-100 p-6">
          <h3 className="text-xl font-bold text-ink-900">بيانات المالك (owners)</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <InfoCard
              title="`owner_type`"
              items={["individual / company_owned", "يحدد نوع المالك (فرد / شركة)"]}
            />
            <InfoCard
              title="الربط بالمستخدم"
              items={["`user_id` (auth user)", "مستخدم يملك سجل المالك"]}
            />
            <InfoCard
              title="الوثائق"
              items={["`ownership_docs`", "مرفقات/ملفات الهوية أو الملكية"]}
            />
            <InfoCard
              title="صافي المبالغ"
              items={[
                "`owner_net_amount`",
                "محسوبة لاحقًا ضمن منطق التحويلات"
              ]}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-ink-900/10 bg-white p-6">
          <h3 className="text-xl font-bold text-ink-900">تحويلات الملكية (owner_transfers)</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <InfoCard
              title="المبالغ"
              items={[
                "`commission_deducted` (خصم العمولة)",
                "`net_amount_transferred` (الصافي)"
              ]}
            />
            <InfoCard
              title="التواريخ والربط"
              items={["`transfer_date`", "`property_id` و`owner_id`"]}
            />
            <InfoCard
              title="الحالة"
              items={[
                "pending / transferred / cancelled",
                "تتحكم في ظهور السجلات"
              ]}
            />
            <InfoCard
              title="ملاحظة تنفيذية"
              items={[
                "سنربط RLS بحيث يظهر لكل مالك سجلاته فقط",
                "اعتمادًا على auth.uid()"
              ]}
            />
          </div>
        </section>
      </div>
    </PortalShell>
  );
}

function InfoCard({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="rounded-2xl border border-ink-900/10 bg-white p-4">
      <h4 className="text-base font-semibold text-brand-400">{title}</h4>
      <ul className="mt-2 list-disc pr-5 text-sm text-ink-900/80">
        {items.map((it) => (
          <li key={it}>{it}</li>
        ))}
      </ul>
    </article>
  );
}
