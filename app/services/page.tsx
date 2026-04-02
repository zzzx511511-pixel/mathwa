import { BackButton } from "@/components/layout/back-button";

type ServiceItem = {
  title: string;
  points: string[];
  applyHref: string;
};

const services: ServiceItem[] = [
  {
    title: "إدارة الأملاك",
    points: [
      "إدارة تشغيل العقار ومتابعة التحصيل بشكل منظم.",
      "إدارة المستأجرين والعقود والصيانة الدورية.",
      "تقارير تشغيلية ومالية واضحة للمالك."
    ],
    applyHref: "/login?mode=signup&role=owner&returnTo=%2Fservices"
  },
  {
    title: "إدارة المشاريع",
    points: [
      "تخطيط وتنفيذ ومتابعة المشاريع العقارية.",
      "رفع الكفاءة وتقليل الهدر وتحسين الجداول الزمنية.",
      "مؤشرات أداء وتقارير دورية لصاحب المشروع."
    ],
    applyHref: "/login?mode=signup&role=client&returnTo=%2Fservices"
  },
  {
    title: "المقاولات",
    points: [
      "تنفيذ أعمال البناء والتأهيل حسب نطاق العمل.",
      "إشراف هندسي وضبط جودة في جميع مراحل التنفيذ.",
      "حلول مقاولات مرنة للأفراد والشركات."
    ],
    applyHref: "/login?mode=signup&role=client&returnTo=%2Fservices"
  },
  {
    title: "الخدمات الإلكترونية العقارية",
    points: [
      "رفع ومتابعة الطلبات إلكترونيًا.",
      "لوحات متابعة وتقارير رقمية محدثة.",
      "تجربة تشغيل سريعة وواضحة للعميل."
    ],
    applyHref: "/login?mode=signup&role=client&returnTo=%2Fservices"
  },
  {
    title: "التسويق للمنتجات",
    points: [
      "خدمة تسويق مخصصة لمن يريد تسويق منتجه أو مشروعه.",
      "إعداد خطة تسويقية مناسبة للفئة المستهدفة.",
      "متابعة الأداء والتحسين لتحقيق نتائج أفضل."
    ],
    applyHref: "/login?mode=signup&role=client&returnTo=%2Fservices"
  }
];

export default function ServicesPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gold-400/25 bg-[#efe8dc] p-8">
        <h1 className="text-3xl font-extrabold text-ink-900">خدمات مثوى</h1>
        <p className="mt-2 text-sm text-ink-900/75">
          هذه صفحة مستقلة للخدمات. إذا رغبت بطلب أي خدمة سيتم تحويلك لإنشاء حساب حتى يتم حفظ الطلب ومتابعته.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <BackButton fallbackHref="/" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {services.map((service) => (
          <article key={service.title} className="rounded-2xl border border-ink-900/10 bg-white p-6">
            <h2 className="text-2xl font-bold text-ink-900">{service.title}</h2>
            <ul className="mt-3 list-disc space-y-1 pr-5 text-sm text-ink-900/80">
              {service.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <a
              href={service.applyHref}
              className="mt-4 inline-block rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-400"
            >
              طلب الخدمة
            </a>
          </article>
        ))}
      </section>
    </div>
  );
}
