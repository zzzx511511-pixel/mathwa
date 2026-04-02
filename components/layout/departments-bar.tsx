import Link from "next/link";
import type { Route } from "next";

export type DepartmentsBarLink = {
  href: string;
  label: string;
};

export function DepartmentsBar({
  links,
  prefixLinks
}: {
  links: DepartmentsBarLink[];
  prefixLinks?: DepartmentsBarLink[];
}) {
  const merged = [...(prefixLinks ?? []), ...(links ?? [])];
  if (!merged.length) return null;

  return (
    <div className="sticky top-[3.25rem] z-40 border-b border-gold-400/25 bg-[#f5f3ef]/90 backdrop-blur supports-[backdrop-filter]:bg-[#f5f3ef]/75">
      <div className="mx-auto flex max-w-screen-2xl items-center gap-2 px-3 py-2 sm:px-4">
        <nav
          className="flex flex-nowrap gap-2 overflow-x-auto [-webkit-overflow-scrolling:touch]"
          aria-label="أقسام الموظفين"
        >
          {merged.map((item) => (
            <Link
              key={item.href}
              href={item.href as Route}
              prefetch={false}
              className="shrink-0 rounded-full border border-gold-400/30 bg-white px-3 py-1.5 text-xs font-semibold text-ink-900/90 shadow-sm hover:border-gold-400 hover:bg-gold-400/10 sm:text-sm"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

