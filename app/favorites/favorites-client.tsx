"use client";

import Link from "next/link";
import type { Route } from "next";
import { useFavorites } from "@/hooks/use-favorites";
import { removeFavorite } from "@/lib/favorites/local-favorites";
import { removeFavoriteFromServer } from "@/lib/favorites/remote-favorites";
import { BackButton } from "@/components/layout/back-button";

export function FavoritesClient() {
  const { list } = useFavorites();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-ink-900/10 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-ink-900">مفضلاتي</h1>
            <p className="mt-1 text-sm text-ink-900/70">
              تُحفظ على الجهاز، وتُزامن مع حسابك بعد تسجيل الدخول عند تطبيق تحديث قاعدة البيانات في Supabase
              (قسم المفضلات في ملف إعداد SQL للمشروع).
            </p>
          </div>
          <BackButton fallbackHref="/offers" />
        </div>
      </section>

      {list.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-ink-900/20 bg-[#f8f3ea] p-10 text-center">
          <p className="text-lg font-semibold text-ink-900">لا توجد عروض في مفضلتك بعد.</p>
          <p className="mt-2 text-sm text-ink-900/70">تصفّح العروض واضغط «إضافة إلى المفضلة» على أي عرض.</p>
          <Link
            href="/offers"
            className="mt-6 inline-block rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-white hover:bg-brand-400"
          >
            تصفّح العروض
          </Link>
        </section>
      ) : (
        <section className="rounded-2xl bg-[#efe8dc] p-6">
          <p className="mb-4 text-sm font-semibold text-ink-900/75">{list.length} عرض محفوظ</p>
          <ul className="grid gap-3 md:grid-cols-2">
            {list.map((item) => (
              <li
                key={item.path}
                className="flex flex-col gap-3 rounded-xl border border-ink-900/10 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Link
                    href={item.path as Route}
                    className="text-lg font-bold text-ink-900 hover:text-brand-500 hover:underline"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-1 text-xs text-ink-900/55">
                    {item.kind === "demo" ? "عرض تجريبي" : "عرض منشور"} ·{" "}
                    <span dir="ltr" className="inline-block">
                      {item.path}
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link
                    href={item.path as Route}
                    className="rounded-lg border border-ink-900/15 bg-[#f8f3ea] px-3 py-2 text-sm font-semibold text-ink-900 hover:border-gold-400/50"
                  >
                    فتح العرض
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      removeFavorite(item.path);
                      void removeFavoriteFromServer(item.path);
                    }}
                    className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    حذف
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
