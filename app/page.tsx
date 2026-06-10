import Link from "next/link";
import { CATEGORIES } from "@/lib/salsabeel/categories";
import { getTopRated, getMostVisited } from "@/lib/salsabeel/data";
import { PlaceCard } from "@/components/salsabeel/place-card";
import { CategoryCard } from "@/components/salsabeel/category-card";

export const dynamic = "force-static";

export default function HomePage() {
  const topRated   = getTopRated(6);
  const mostVisited = getMostVisited(6);

  return (
    <div className="space-y-12">

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sal-900 via-sal-800 to-sal-700 px-6 py-20 text-white lg:px-14">
        {/* decorative circles */}
        <div aria-hidden className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-sal-600/30 blur-3xl" />
        <div aria-hidden className="absolute -bottom-10 -right-10 h-56 w-56 rounded-full bg-gold-500/20 blur-2xl" />

        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm backdrop-blur">
            <span className="h-2 w-2 animate-pulse rounded-full bg-gold-400" />
            اكتشف ما حولك الآن
          </div>

          <h1 className="text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
            سلسبيل
          </h1>
          <p className="mt-3 text-xl font-medium text-sal-200">
            دليلك لأفضل الأماكن في المملكة
          </p>
          <p className="mt-2 text-sm text-white/70">
            كافيهات • مطاعم • عيادات • صالونات • مجمعات
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/category/cafes"
              className="rounded-xl bg-gold-500 px-6 py-3 font-bold text-sal-900 shadow hover:bg-gold-400 transition"
            >
              استكشف الكافيهات
            </Link>
            <Link
              href="/category/restaurants"
              className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 font-semibold backdrop-blur hover:bg-white/20 transition"
            >
              تصفح المطاعم
            </Link>
          </div>

          {/* quick stats */}
          <div className="mt-10 grid grid-cols-3 gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div>
              <p className="text-2xl font-extrabold text-gold-400">+1,200</p>
              <p className="text-xs text-white/60">مكان مسجّل</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gold-400">5</p>
              <p className="text-xs text-white/60">تصنيفات</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gold-400">+50k</p>
              <p className="text-xs text-white/60">زيارة شهرية</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ──────────────────────────────────────────────── */}
      <section>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-ink-900">التصنيفات</h2>
            <p className="text-sm text-ink-600 mt-0.5">اختر التصنيف الذي يناسبك</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {CATEGORIES.map((cat) => (
            <CategoryCard key={cat.slug} cat={cat} />
          ))}
        </div>
      </section>

      {/* ── Top Rated ───────────────────────────────────────────────── */}
      <section>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-ink-900">⭐ الأعلى تقييماً</h2>
            <p className="text-sm text-ink-600 mt-0.5">الأماكن الأكثر إعجاباً من الزوار</p>
          </div>
          <Link href="/places" className="text-sm font-semibold text-sal-600 hover:underline">
            عرض الكل
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topRated.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      </section>

      {/* ── Most Visited ────────────────────────────────────────────── */}
      <section>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-ink-900">🔥 الأكثر زيارة</h2>
            <p className="text-sm text-ink-600 mt-0.5">الوجهات التي لا يفوتها أحد</p>
          </div>
          <Link href="/places" className="text-sm font-semibold text-sal-600 hover:underline">
            عرض الكل
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mostVisited.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────────── */}
      <section className="rounded-3xl bg-gradient-to-l from-sal-700 to-sal-900 p-8 text-center text-white">
        <h3 className="text-2xl font-extrabold">هل لديك مكان تريد إضافته؟</h3>
        <p className="mt-2 text-sal-200 text-sm">
          أضف مكانك في سلسبيل وتواصل مع آلاف الزوار يومياً
        </p>
        <Link
          href="/admin"
          className="mt-5 inline-block rounded-xl bg-gold-500 px-8 py-3 font-bold text-sal-900 hover:bg-gold-400 transition shadow"
        >
          لوحة التحكم
        </Link>
      </section>

    </div>
  );
}
