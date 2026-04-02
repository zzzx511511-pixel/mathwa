import Link from "next/link";
import type { Route } from "next";
import { cookies } from "next/headers";
import { isPreviewMode } from "@/lib/demo/is-preview-mode";

export const dynamic = "force-dynamic";

type LinkItem = { href: string; label: string; hint?: string };

const sections: Array<{ title: string; items: LinkItem[] }> = [
  {
    title: "الموقع العام",
    items: [
      { href: "/", label: "الرئيسية", hint: "Landing + CTA" },
      { href: "/login", label: "تسجيل الدخول", hint: "نموذج الدخول" },
      { href: "/auth/redirect", label: "توجيه بعد الدخول", hint: "حسب الدور/البيانات" }
    ]
  },
  {
    title: "بوابة الموظف",
    items: [
      { href: "/employee/login", label: "دخول الموظفين" },
      { href: "/employee/dashboard", label: "لوحة الموظفين" },
      { href: "/employee/estates", label: "غرفة إدارة الأملاك" },
      { href: "/employee/finance", label: "غرفة المالية" },
      { href: "/employee/projects", label: "غرفة إدارة المشاريع" },
      { href: "/employee/marketing", label: "غرفة التسويق" },
      { href: "/employee/e-services", label: "غرفة الخدمات الإلكترونية" },
      { href: "/employee/properties", label: "قائمة العقارات" },
      { href: "/employee/properties/prop_1", label: "تفاصيل عقار (مثال)" },
      { href: "/employee/maintenance", label: "طلبات الصيانة" },
      { href: "/employee/maintenance/mnt_1", label: "تفاصيل صيانة (مثال)" }
    ]
  },
  {
    title: "بوابة المستأجر",
    items: [
      { href: "/tenant/portal", label: "بوابة المستأجر" },
      { href: "/tenant/contracts", label: "العقود" },
      { href: "/tenant/contracts/con_1", label: "تفاصيل عقد (مثال)" },
      { href: "/tenant/payments", label: "المدفوعات/الفواتير" },
      { href: "/tenant/payments/inv_1", label: "تفاصيل فاتورة (مثال)" },
      { href: "/tenant/maintenance", label: "الصيانة" },
      { href: "/tenant/maintenance/mnt_1", label: "تفاصيل صيانة (مثال)" },
      { href: "/tenant/documents", label: "المستندات" }
    ]
  },
  {
    title: "بوابة المالك",
    items: [
      { href: "/owner/portal", label: "بوابة المالك" },
      { href: "/owner/properties", label: "عقاراتي" },
      { href: "/owner/properties/prop_1", label: "تفاصيل عقار (مثال)" },
      { href: "/owner/owner-transfers", label: "التحويلات" },
      { href: "/owner/owner-transfers/tr_1", label: "تفاصيل تحويل (مثال)" }
    ]
  },
  {
    title: "القسم المالي",
    items: [
      { href: "/finance/dashboard", label: "المالية - الرئيسية" },
      { href: "/finance/ledger", label: "سجل القيود" },
      { href: "/finance/ledger/sch_1", label: "تفاصيل قيد (مثال)" },
      { href: "/finance/invoices", label: "فواتير" },
      { href: "/finance/invoices/inv_1", label: "تفاصيل فاتورة (مثال)" },
      { href: "/finance/reports", label: "تقارير" }
    ]
  }
];

function DemoPill({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-ink-900/10 bg-white px-3 py-1 text-xs font-medium text-ink-900/70">
      {text}
    </span>
  );
}

export default function DemoHubPage() {
  const demoMode = isPreviewMode();
  const roleCookie = cookies().get("demo_role")?.value;
  const demoRole = roleCookie ?? process.env.DEMO_ROLE ?? "employee";
  const roleOptions = [
    { id: "visitor", label: "زائر (واجهة عامة)" },
    { id: "client", label: "عميل" },
    { id: "tenant", label: "مستأجر" },
    { id: "owner", label: "مالك" },
    { id: "employee", label: "موظف" },
    { id: "collector", label: "مالية/تحصيل" }
  ];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-gold-400/70 bg-white p-6 shadow-sm">
        <div className="absolute inset-0 -z-10 bg-gradient-to-l from-brand-50 via-white to-gold-400/10" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-brand-400">نموذج مثوى (روابط كاملة)</h2>
          <div className="flex flex-wrap gap-2">
            <DemoPill text={`Demo Mode: ${demoMode ? "ON" : "OFF"}`} />
            <DemoPill text={`Role: ${demoRole}`} />
          </div>
        </div>
        <p className="mt-3 text-sm text-ink-900/80">
          هذه صفحة “تجميع روابط” لتقييم كل الشاشات بسرعة. في وضع Demo ستظهر بيانات
          تجريبية، وفي الوضع الحقيقي ستعتمد على Supabase.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {roleOptions.map((role) => (
            <Link
              key={role.id}
              href={`/demo/role/${role.id}` as Route}
              prefetch={false}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                demoRole === role.id
                  ? "bg-brand-500 text-white"
                  : "border border-ink-900/15 bg-white text-ink-900/80 hover:border-gold-400 hover:bg-gold-400/10"
              }`}
            >
              {role.label}
            </Link>
          ))}
        </div>
        {demoMode ? (
          <p className="mt-4 text-sm text-ink-900/85">
            <Link
              href={"/api/preview/employee-session?next=/employee/estates" as Route}
              prefetch={false}
              className="font-bold text-brand-600 underline decoration-2 underline-offset-2 hover:text-brand-500"
            >
              دخول مباشر — غرفة إدارة الأملاك (بدون رمز، وضع المعاينة فقط)
            </Link>
          </p>
        ) : null}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <section
            key={section.title}
            className="rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm"
          >
            <h3 className="text-lg font-bold text-ink-900">{section.title}</h3>
            <div className="mt-4 grid gap-2">
              {section.items.map((it) => (
                <Link
                  key={it.href}
                  href={it.href as Route}
                  prefetch={false}
                  className="flex items-center justify-between gap-3 rounded-xl border border-ink-900/10 bg-brand-100 px-4 py-3 text-sm font-medium text-ink-900 hover:border-gold-400 hover:bg-gold-400/10"
                >
                  <span>{it.label}</span>
                  <span className="text-xs font-normal text-ink-900/60">
                    {it.hint ?? it.href}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

