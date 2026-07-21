import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "شروط الاستخدام — وين",
  description: "شروط استخدام موقع وين",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ background: "#FAF7F2" }}>
      <div
        className="px-5 py-14 text-center"
        style={{ background: "linear-gradient(160deg, #031A17 0%, #0F5C56 60%, #16A394 100%)" }}
      >
        <h1 className="text-4xl font-black text-white">شروط الاستخدام</h1>
        <p className="mt-3 text-white/60 text-sm">آخر تحديث: يوليو 2025</p>
      </div>

      <div className="mx-auto max-w-2xl px-5 py-14 space-y-10" style={{ direction: "rtl" }}>

        <Section title="القبول بالشروط">
          <p>
            باستخدامك لموقع <strong>وين</strong>، فإنك توافق على الشروط والأحكام الواردة في هذه
            الصفحة. إن كنت لا توافق عليها، يُرجى التوقف عن استخدام الموقع.
          </p>
        </Section>

        <Section title="طبيعة المحتوى">
          <p>
            التقييمات والمعلومات والمحتوى المنشور في وين هي <strong>للإرشاد والتوجيه فقط</strong>.
            لا تُعدّ توصية طبية أو قانونية أو مهنية من أي نوع. يُنصح دائمًا بالتحقق المباشر من
            المنشأة قبل اتخاذ أي قرار.
          </p>
        </Section>

        <Section title="دقة المعلومات">
          <p>
            وين <strong>غير مسؤول</strong> عن دقة المعلومات المقدّمة من المنشآت أو المستخدمين،
            بما فيها أوقات العمل، وعناوين الفروع، والأسعار، وأي تفاصيل أخرى. قد تتغير هذه
            المعلومات دون إشعار مسبق.
          </p>
        </Section>

        <Section title="إضافة المنشآت وحذفها">
          <p>
            يحق لفريق وين <strong>إضافة أو تعديل أو حذف</strong> أي منشأة من الموقع في أي وقت
            ودون الحاجة إلى إبداء أسباب، وذلك وفق سياسة تحريرية تضمن جودة المحتوى المقدّم.
          </p>
        </Section>

        <Section title="الاستخدام التجاري">
          <p>
            يُمنع منعًا باتًا استخدام محتوى الموقع — بما فيه النصوص والتقييمات والصور — لأي
            غرض تجاري أو إعادة نشره دون <strong>إذن كتابي مسبق</strong> من فريق وين.
            للتواصل بخصوص ذلك:{" "}
            <a
              href="mailto:salsabelapp@gmail.com"
              className="font-semibold text-sal-500 underline underline-offset-2"
            >
              salsabelapp@gmail.com
            </a>
          </p>
        </Section>

        <Section title="التعديل على الشروط">
          <p>
            نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيُشار إلى تاريخ آخر تحديث في أعلى
            الصفحة. استمرارك في استخدام الموقع بعد التعديل يعني موافقتك على الشروط الجديدة.
          </p>
        </Section>

        <Section title="التواصل">
          <p>
            لأي استفسار يخص هذه الشروط، راسلنا على:{" "}
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
