"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto max-w-xl rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-brand-400">حدث خطأ</h1>
      <p className="mt-2 text-ink-900/80">
        حصلت مشكلة غير متوقعة. يمكنك إعادة المحاولة أو العودة للصفحة الرئيسية.
      </p>

      <div className="mt-4 rounded-xl border border-ink-900/10 bg-brand-100 p-4 text-xs text-ink-900/70">
        {error.message}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={() => reset()}
          className="rounded-full bg-brand-500 px-5 py-2.5 text-white hover:bg-brand-400"
          type="button"
        >
          إعادة المحاولة
        </button>
        <Link
          prefetch={false}
          href="/"
          className="rounded-full border border-ink-900/10 bg-white px-5 py-2.5 text-ink-900/80 hover:border-gold-400 hover:bg-gold-400/10"
        >
          العودة للرئيسية
        </Link>
      </div>
    </section>
  );
}

