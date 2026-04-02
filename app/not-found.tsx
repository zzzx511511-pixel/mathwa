import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-xl rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-brand-400">الصفحة غير موجودة</h1>
      <p className="mt-2 text-ink-900/80">الصفحة التي طلبتها غير متاحة.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          prefetch={false}
          href="/"
          className="rounded-full bg-brand-500 px-5 py-2.5 text-white hover:bg-brand-400"
        >
          العودة للرئيسية
        </Link>
        <Link
          prefetch={false}
          href="/login"
          className="rounded-full border border-ink-900/10 bg-white px-5 py-2.5 text-ink-900/80 hover:border-gold-400 hover:bg-gold-400/10"
        >
          تسجيل الدخول
        </Link>
      </div>
    </section>
  );
}

