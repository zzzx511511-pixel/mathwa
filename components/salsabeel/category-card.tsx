import Link from "next/link";
import type { CategoryMeta } from "@/lib/salsabeel/categories";

export function CategoryCard({ cat }: { cat: CategoryMeta }) {
  return (
    <Link
      href={`/category/${cat.slug}`}
      className="group relative flex flex-col items-center gap-3 rounded-2xl border border-transparent p-5 text-center transition hover:border-sal-200 hover:shadow-md hover:-translate-y-0.5"
      style={{ background: cat.bg }}
    >
      {cat.badge && (
        <span
          className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
          style={{ background: cat.color }}
        >
          {cat.badge}
        </span>
      )}
      <span className="text-4xl">{cat.icon}</span>
      <div>
        <p className="text-base font-extrabold" style={{ color: cat.color }}>
          {cat.label}
        </p>
        {cat.count > 0 && (
          <p className="mt-0.5 text-xs font-medium opacity-70" style={{ color: cat.color }}>
            +{cat.count} مكان
          </p>
        )}
      </div>
      <svg
        className="h-4 w-4 opacity-50 transition group-hover:opacity-100 group-hover:translate-x-[-3px]"
        style={{ color: cat.color }}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
      </svg>
    </Link>
  );
}
