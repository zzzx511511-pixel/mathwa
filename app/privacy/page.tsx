import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "سياسة الخصوصية — سلسبيل",
  description: "سياسة الخصوصية الخاصة بموقع سلسبيل",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: "#f0f9ff" }}>
      <div
        className="px-5 py-14 text-center"
        style={{ background: "linear-gradient(160deg, #082f49 0%, #0369a1 60%, #0ea5e9 100%)" }}
      >
        <h1 className="text-4xl font-black text-white">سياسة الخصوصية</h1>
        <p className="mt-3 text-white/60 text-sm">آخر تحديث: يوليو 2025</p>
      </div>

      <div className="mx-auto max-w-2xl px-5 py-14 space-y-10" style={{ direction: "rtl" }}>

        <Section title="مقدمة">
          <p>
            نحن في <strong>سلسبيل</strong> نحرص على حماية خصوصيتك. توضّح هذه السياسة ما نجمعه من
            بيانات، وكيف نستخدمها، وحقوقك كمستخدم.
          </p>
        </Section>

        <Section title="البيانات التي نجمعها">
          <p>لا نجمع بياناتك تلقائيًا عند تصفّح الموقع. البيانات الوحيدة التي نجمعها هي ما تُرسله
            طوعًا عبر <strong>نموذج التواصل</strong>، وتشمل:</p>
          <ul className="mt-3 space-y-1.5 list-disc list-inside text-ink-600">
            <li>الاسم</li>
            <li>البريد الإلكتروني</li>
            <li>نص الرسالة</li>
          </ul>
        </Section>

        <Section title="كيف نستخدم البيانات">
          <p>
            تُستخدم البيانات المُرسلة عبر نموذج التواصل لغرض واحد فقط: الرد على استفساراتك
            ومقترحاتك. لا نستخدمها في أي غرض تسويقي أو إعلاني.
          </p>
        </Section>

        <Section title="مشاركة البيانات مع أطراف ثالثة">
          <p>
            نحن <strong>لا نبيع بياناتك</strong> ولا نشاركها مع أي طرف ثالث لأغراض تجارية.
            قد تُشارك البيانات فقط إذا اقتضى ذلك القانون أو أمر قضائي.
          </p>
        </Section>

        <Section title="أمان البيانات">
          <p>
            بياناتك محفوظة في قاعدة بيانات مشفّرة ومؤمّنة. نحرص على اتباع أفضل الممارسات
            الأمنية لحمايتها من الوصول غير المصرّح به.
          </p>
        </Section>

        <Section title="حقوقك">
          <p>يحق لك في أي وقت:</p>
          <ul className="mt-3 space-y-1.5 list-disc list-inside text-ink-600">
            <li>الاطلاع على البيانات المحفوظة عنك</li>
            <li>طلب تصحيح أي بيانات غير دقيقة</li>
            <li>طلب حذف بياناتك نهائيًا من قاعدة البيانات</li>
          </ul>
          <p className="mt-3">
            لممارسة أي من هذه الحقوق، تواصل معنا عبر:{" "}
            <a
              href="mailto:salsabelapp@gmail.com"
              className="font-semibold text-sal-500 underline underline-offset-2"
            >
              salsabelapp@gmail.com
            </a>
          </p>
        </Section>

        <Section title="التواصل">
          <p>
            لأي استفسار يخص هذه السياسة، راسلنا على:{" "}
            <a
              href="mailto:salsabelapp@gmail.com"
              className="font-semibold text-sal-500 underline underline-offset-2"
            >
              salsabelapp@gmail.com
            </a>
          </p>
        </Section>

        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-sal-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-sal-600"
          >
            ← العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-sal-100 bg-white p-6 space-y-3">
      <h2 className="text-lg font-black text-ink-900">{title}</h2>
      <div className="text-sm leading-relaxed text-ink-700 space-y-2">{children}</div>
    </section>
  );
}
