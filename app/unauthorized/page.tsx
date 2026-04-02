import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <section className="mx-auto max-w-xl rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-brand-400">غير مصرح</h1>
      <p className="mt-2 text-ink-900/80">
        ليس لديك صلاحية للوصول إلى هذه الصفحة.
      </p>
      <div className="mt-6">
        <Link
          href="/login"
          className="rounded-full bg-brand-500 px-5 py-2.5 text-white hover:bg-brand-400"
        >
          العودة لتسجيل الدخول
        </Link>
      </div>
    </section>
  );
}

