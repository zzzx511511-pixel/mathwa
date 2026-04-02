import Link from "next/link";

const rooms = [
  {
    href: "/employee/estates",
    title: "إدارة الأملاك",
    blurb: "العقارات، الصيانة، ومتابعة الأصول تحت الإدارة."
  },
  {
    href: "/employee/finance",
    title: "المالية",
    blurb: "القيود، الفواتير، والتقارير عبر بوابة المالية."
  },
  {
    href: "/employee/marketing",
    title: "التسويق",
    blurb: "العروض والمحتوى الترويجي."
  },
  {
    href: "/employee/e-services",
    title: "الخدمات الإلكترونية",
    blurb: "محتوى الخدمات الظاهر للعملاء على الموقع."
  }
] as const;

export function EmployeeDashboardContent() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-2xl font-bold text-brand-400">لوحة الموظفين</h2>
        <p className="text-ink-900/80">
          اختر <span className="font-semibold text-ink-900">غرفة القسم</span> من القائمة الجانبية، أو
          ادخل مباشرة من البطاقات أدناه. عند أول دخول لقسم يُطلب منك{" "}
          <span className="font-semibold text-ink-900">رقم تعريف</span> يصدره المسؤول لذلك القسم ويُعطى
          لك خصيصًا.
        </p>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-900/50">
          غرف الأقسام
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => (
            <Link
              key={room.href}
              href={room.href}
              className="group rounded-2xl border border-ink-900/10 bg-gradient-to-br from-white to-brand-50/80 p-5 shadow-sm transition hover:border-gold-400/60 hover:shadow-md"
            >
              <h4 className="text-lg font-bold text-brand-400 group-hover:text-brand-500">
                {room.title}
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-ink-900/75">{room.blurb}</p>
              <p className="mt-3 text-xs font-semibold text-gold-600">دخول الغرفة ←</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
