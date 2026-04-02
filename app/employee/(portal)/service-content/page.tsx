import { EmployeePortalShell } from "@/components/employee/employee-portal-shell";

export default function EmployeeServiceContentPage() {
  return (
    <EmployeePortalShell>
      <section className="rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-brand-400">تعديل تفاصيل الخدمات</h2>
        <p className="mt-2 text-sm text-ink-900/75">
          صفحة تشغيلية للموظفين لتحديث نصوص وصف الخدمات ومزايا كل خدمة وروابط التقديم.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <ServiceBlock title="إدارة الأملاك" />
          <ServiceBlock title="إدارة المشاريع" />
          <ServiceBlock title="المقاولات" />
          <ServiceBlock title="الخدمات الإلكترونية" />
          <ServiceBlock title="التسويق للمنتجات" />
        </div>

        <div className="mt-5 rounded-xl border border-gold-400/40 bg-brand-50 p-4 text-sm text-ink-900/75">
          ربط الحفظ في قاعدة البيانات سيكون في الخطوة القادمة بعد اعتماد المحتوى النهائي.
        </div>
      </section>
    </EmployeePortalShell>
  );
}

function ServiceBlock({ title }: { title: string }) {
  return (
    <article className="rounded-xl border border-ink-900/10 bg-[#f8f3ea] p-4">
      <h3 className="text-lg font-bold text-ink-900">{title}</h3>
      <textarea
        className="mt-2 w-full rounded-md border border-ink-900/15 bg-white px-3 py-2 text-ink-900 outline-none focus:border-brand-400"
        rows={4}
        placeholder={`اكتب وصف ${title} هنا...`}
      />
    </article>
  );
}
