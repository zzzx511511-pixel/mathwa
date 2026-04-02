import Link from "next/link";

type EmployeePreviewHeroProps = {
  /** رابط جاهز (مثلاً API المعاينة) — يظهر زر دخول مباشر لغرفة إدارة الأملاك */
  quickEstatesHref?: string | null;
};

const stats = [
  { label: "عقارات تحت الإدارة", value: "24", hint: "نموذج" },
  { label: "عقود نشطة", value: "18", hint: "نموذج" },
  { label: "طلبات صيانة", value: "7", hint: "مفتوحة" },
  { label: "عروض منشورة", value: "12", hint: "هذا الشهر" }
];

export function EmployeePreviewHero({ quickEstatesHref }: EmployeePreviewHeroProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gold-400/40 bg-gradient-to-br from-[#2f160f] via-[#3d2318] to-[#1a0f0a] shadow-lg">
      <div className="border-b border-white/10 px-5 py-4 sm:px-8 sm:py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gold-400/90">مثوى العقارية</p>
            <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">بوابة الموظفين</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/80">
              معاينة للواجهة الداخلية — القائمة الجانبية والمحتوى كما يظهران بعد تسجيل الدخول بحساب موظف.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickEstatesHref ? (
              <Link
                href={quickEstatesHref}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow hover:bg-emerald-400"
              >
                دخول إدارة الأملاك — بدون رمز
              </Link>
            ) : null}
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-gold-400 px-4 py-2.5 text-sm font-bold text-ink-900 shadow hover:bg-gold-500"
            >
              تسجيل الدخول
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
            >
              الموقع العام
            </Link>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 sm:gap-4 sm:p-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center sm:px-4 sm:py-4"
          >
            <p className="text-2xl font-extrabold tabular-nums text-gold-400 sm:text-3xl">{s.value}</p>
            <p className="mt-1 text-xs font-semibold text-white/95">{s.label}</p>
            <p className="mt-0.5 text-[10px] text-white/50">{s.hint}</p>
          </div>
        ))}
      </div>
      <p className="border-t border-white/10 px-4 py-2 text-center text-[11px] text-white/55 sm:px-6">
        الأرقام للعرض فقط وليست من قاعدة بيانات حية في وضع المعاينة.
      </p>
    </div>
  );
}
