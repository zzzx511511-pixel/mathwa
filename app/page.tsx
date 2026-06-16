import Link from "next/link";
import { CATEGORIES } from "@/lib/salsabeel/categories";
import { getRegionCounts } from "@/lib/salsabeel/data";
import { ContactForm } from "@/components/salsabeel/contact-form";
import { LogoDrop } from "@/components/salsabeel/logo";
import { HomeSearch } from "@/components/salsabeel/home-search";

export const dynamic = "force-static";

/* ── Category descriptions ─── */
const CAT_DESC: Record<string, string> = {
  cafes:       "كوفيهات ومطاعم هجينة — specialty coffee وبرنش وغداء وعشاء في مكان واحد",
  restaurants: "مطاعم وكوفيهات متكاملة — من الراقي إلى الشعبي ومن الفطور حتى العشاء",
  clinics:     "اختر عيادتك بثقة بناءً على تقييمات حقيقية ونسب قبول موثوقة",
  salons:      "أفضل الصالونات النسائية في الرياض بأسعار معقولة وخدمة ممتازة",
  malls:       "مجمعات تسوق وترفيه متكاملة تجمع أبرز الماركات والمطاعم والسينما",
};

const CAT_SUB: Record<string, string> = {
  cafes:       "كوفيهات · برنش · مطاعم هجينة",
  restaurants: "مطاعم · كوفيهات · برنش",
  clinics:     "أسنان • تجميل • علاج طبيعي",
  salons:      "صالونات نسائية",
  malls:       "تسوق وترفيه",
};

const STEPS = [
  { n: "١", title: "بحث شامل",     desc: "نجمع التقييمات من عدة مصادر لكل مكان ونحللها بدقة" },
  { n: "٢", title: "تقييم موثوق",  desc: "نجمع النجمات ونسبة القبول والرفض ورأي الناس في جملة واحدة" },
  { n: "٣", title: "تحديث مستمر", desc: "نتابع الأكثر زيارة خلال 28 يوماً لنعطيك الأحدث دائماً" },
  { n: "٤", title: "توسع مستمر",  desc: "سلسبيل في نمو دائم — نضيف تصنيفات ومناطق جديدة باستمرار" },
];

const GRAD      = "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 55%, #0369a1 100%)";
const GRAD_DEEP = "linear-gradient(160deg, #082f49 0%, #0369a1 60%, #0ea5e9 100%)";
const GLOW      = "rgba(56,189,248,0.35)";

export default function HomePage() {
  return (
    <>
      {/* ══════════════════════════════════ HERO ══ */}
      <section
        id="hero"
        className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-5 py-32 text-center"
        style={{ background: GRAD_DEEP }}
      >
        {/* Floating decorative orbs */}
        <div
          aria-hidden
          className="anim-float pointer-events-none absolute -left-24 -top-24 h-[480px] w-[480px] rounded-full"
          style={{ background: "rgba(56,189,248,0.07)" }}
        />
        <div
          aria-hidden
          className="anim-float-slow pointer-events-none absolute -bottom-32 -right-20 h-[560px] w-[560px] rounded-full"
          style={{ background: "rgba(56,189,248,0.05)" }}
        />

        <div className="relative z-10 flex max-w-2xl flex-col items-center gap-5">
          {/* Badge */}
          <div
            className="anim-fade-up inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-bold tracking-wide"
            style={{
              background: "rgba(56,189,248,0.12)",
              borderColor: "rgba(56,189,248,0.3)",
              color: "#38bdf8",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-sal-400" />
            تقييمات الرياض الأولى ✦
          </div>

          {/* Logo icon */}
          <div className="anim-fade-up-d1">
            <LogoDrop size="lg" />
          </div>

          {/* Title */}
          <h1
            className="anim-fade-up-d1 text-6xl font-black leading-tight text-white md:text-8xl"
            style={{ fontFamily: "Tajawal, sans-serif" }}
          >
            اختر بثقة
            <br />
            <span style={{ color: "#38bdf8" }}>قيّم بصدق</span>
          </h1>

          <p className="anim-fade-up-d2 max-w-xl text-lg leading-relaxed text-white/60">
            سلسبيل — دليلك الأمين لأفضل الكافيهات والمطاعم (بما فيها المنشآت الهجينة الجامعة بين الاثنين) والعيادات والصالونات في الرياض. تقييمات حقيقية ومعلومات موثوقة.
          </p>

          <div className="anim-fade-up-d3 w-full flex justify-center">
            <HomeSearch />
          </div>

          <div className="anim-fade-up-d3 flex flex-wrap justify-center gap-4">
            <Link
              href="/places"
              className="inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-base font-black text-white shadow-lg transition hover:-translate-y-0.5"
              style={{ background: GRAD, boxShadow: `0 8px 30px ${GLOW}` }}
            >
              🔍 استكشف الأماكن
            </Link>
            <Link
              href="#contact"
              className="rounded-2xl border px-8 py-4 text-base font-bold text-white transition hover:bg-white/15"
              style={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.2)" }}
            >
              تواصل معنا
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════ STATS ══ */}
      <div
        className="flex flex-wrap justify-center gap-14 px-10 py-14"
        style={{ background: "#fff", borderBottom: "1px solid #e0f2fe" }}
      >
        {[
          { num: "5",  label: "تصنيفات رئيسية" },
          { num: "5",  label: "مناطق في الرياض" },
          { num: "✦",  label: "تقييمات موثوقة ودقيقة" },
          { num: "∞",  label: "توسع مستمر في التغطية" },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-5xl font-black leading-none" style={{ color: "#0ea5e9" }}>
              {s.num}
            </p>
            <p className="mt-2 text-sm font-medium text-ink-600">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════ CATEGORIES ══ */}
      <section id="categories" className="scroll-mt-20 px-5 py-24">
        <div className="mx-auto max-w-screen-xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest" style={{ color: "#0ea5e9" }}>
            التصنيفات
          </p>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-4xl font-black text-ink-900">كل ما تحتاجه في مكان واحد</h2>
              <p className="mt-2 max-w-xl text-base leading-relaxed text-ink-600">
                سلسبيل يغطي أهم تصنيفات الخدمات في الرياض بتقييمات دقيقة ومعلومات موثوقة.
              </p>
            </div>
            <Link
              href="/places"
              className="inline-flex shrink-0 items-center gap-2 rounded-2xl px-6 py-3 text-sm font-black text-white shadow transition hover:-translate-y-0.5"
              style={{ background: GRAD, boxShadow: `0 8px 24px ${GLOW}` }}
            >
              🔍 استكشف الأماكن
            </Link>
          </div>

          <p className="mb-10 text-sm font-medium text-ink-400">
            منصة سلسبيل (نسخة تجريبية Beta) — دليل خدمي تجريبي لمدينة الرياض.
          </p>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="group relative overflow-hidden rounded-3xl border p-8 transition hover:-translate-y-1 hover:shadow-xl"
                style={{ background: "#fff", borderColor: "#e0f2fe" }}
              >
                {/* Corner gradient accent */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute right-0 top-0 h-20 w-20 rounded-bl-[80px]"
                  style={{ background: GRAD, opacity: 0.07 }}
                />
                {cat.badge && (
                  <span
                    className="mb-3 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white"
                    style={{ background: cat.color }}
                  >
                    {cat.badge}
                  </span>
                )}
                <span className="mb-4 block text-5xl">{cat.icon}</span>
                <p className="text-xl font-black text-ink-900">{cat.label}</p>
                <p className="mt-1 text-sm font-bold" style={{ color: "#0ea5e9" }}>
                  {CAT_SUB[cat.slug] ?? (cat.count > 0 ? `+${cat.count}` : "")}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-ink-600">
                  {CAT_DESC[cat.slug]}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════ HOW IT WORKS ══ */}
      <section id="how" className="scroll-mt-20 px-5 py-24" style={{ background: GRAD_DEEP }}>
        <div className="mx-auto max-w-screen-xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest" style={{ color: "#38bdf8" }}>
            كيف يعمل
          </p>
          <h2 className="mb-3 text-4xl font-black text-white">بحث شامل ونتائج موثوقة</h2>
          <p className="mb-14 max-w-xl text-base leading-relaxed text-white/55">
            فريق سلسبيل يجمع ويحلل آلاف التقييمات من مصادر متعددة ليقدم لك خلاصة موثوقة ودقيقة.
          </p>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <div
                key={step.n}
                className="rounded-2xl p-7"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(56,189,248,0.2)" }}
              >
                <div
                  className="mb-5 flex h-11 w-11 items-center justify-center rounded-full text-lg font-black text-white"
                  style={{ background: GRAD, boxShadow: `0 4px 16px ${GLOW}` }}
                >
                  {step.n}
                </div>
                <p className="mb-2 text-lg font-black text-white">{step.title}</p>
                <p className="text-sm leading-relaxed text-white/50">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════ REGIONS ══ */}
      <section id="regions" className="scroll-mt-20 px-5 py-24" style={{ background: "#fff" }}>
        <div className="mx-auto max-w-screen-xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest" style={{ color: "#0ea5e9" }}>
            التغطية الجغرافية
          </p>
          <h2 className="mb-3 text-4xl font-black text-ink-900">الرياض كاملة بين يديك</h2>
          <p className="mb-12 max-w-xl text-base leading-relaxed text-ink-600">
            نغطي جميع مناطق الرياض — اختر التصنيف الذي يناسبك ثم فلتر بالمنطقة من داخله.
          </p>

          {/* Region coverage grid (informational) */}
          {(() => {
            const counts = getRegionCounts();
            const REGION_TILES = [
              { value: "شمال", label: "شمال الرياض", icon: "⬆️" },
              { value: "جنوب", label: "جنوب الرياض", icon: "⬇️" },
              { value: "شرق",  label: "شرق الرياض",  icon: "➡️" },
              { value: "غرب",  label: "غرب الرياض",  icon: "⬅️" },
              { value: "وسط",  label: "وسط الرياض",  icon: "🎯" },
            ];
            return (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {REGION_TILES.map((r) => (
                  <div
                    key={r.value}
                    className="flex flex-col items-center gap-2 rounded-2xl border-2 px-4 py-5 text-center"
                    style={{ background: "#f0f9ff", borderColor: "#e0f2fe" }}
                  >
                    <span className="text-2xl">{r.icon}</span>
                    <p className="text-sm font-bold" style={{ color: "#0c4a6e" }}>{r.label}</p>
                    <p className="text-xs font-semibold" style={{ color: "#0ea5e9" }}>
                      {counts[r.value] ?? 0}+ مكان
                    </p>
                  </div>
                ))}
              </div>
            );
          })()}

          <p className="mt-6 text-center text-sm text-ink-500">
            لتصفية الأماكن بالمنطقة —{" "}
            <a href="#categories" className="font-semibold underline" style={{ color: "#0ea5e9" }}>
              اختر تصنيفاً أولاً ↑
            </a>
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════ CONTACT ══ */}
      <section id="contact" className="scroll-mt-20 px-5 py-24" style={{ background: "#f0f9ff" }}>
        <div className="mx-auto grid max-w-screen-xl gap-16 lg:grid-cols-2 lg:items-center">
          {/* Info */}
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-widest" style={{ color: "#0ea5e9" }}>
              تواصل معنا
            </p>
            <h2 className="mb-4 text-4xl font-black leading-tight text-ink-900">
              هل أنت مؤسسة أو فرد؟
              <br />
              نسعد بتواصلك
            </h2>
            <p className="mb-8 max-w-sm text-base leading-relaxed text-ink-600">
              آراؤك واقتراحاتك تسعدنا — سواء كنت تريد إضافة مكان أو لديك فكرة تطوير أو تريد الإعلان.
            </p>

            {[
              { icon: "📧", label: "البريد الإلكتروني", value: "salsabelapp@gmail.com" },
              { icon: "📍", label: "التغطية",           value: "الرياض — المملكة العربية السعودية" },
              { icon: "⚡", label: "وقت الرد",          value: "خلال 24 ساعة" },
            ].map((item) => (
              <div key={item.label} className="mb-6 flex items-start gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl"
                  style={{ background: GRAD, boxShadow: `0 4px 14px ${GLOW}` }}
                >
                  {item.icon}
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink-600">{item.label}</p>
                  <p className="mt-0.5 text-base font-bold text-ink-900">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div>
            <div className="mb-5 rounded-2xl border border-sal-100 bg-white px-5 py-4">
              <p className="text-sm leading-relaxed text-ink-600">
                جميع البيانات والتقييمات مجمعة من مصادر عامة ومتاحة للعموم. المنصة لا تتبنى الآراء الواردة، ولأصحاب المنشآت كامل الحق في طلب التعديل أو الحذف عبر وسائل التواصل بالأسفل.
              </p>
            </div>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
