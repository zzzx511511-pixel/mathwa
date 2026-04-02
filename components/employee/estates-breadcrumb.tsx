import Link from "next/link";

type Crumb = { label: string; href?: string };

export function EstatesBreadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-ink-900/75" aria-label="مسار التنقل">
      {items.map((c, i) => (
        <span key={`${c.label}-${i}`} className="flex items-center gap-1.5">
          {i > 0 ? <span className="text-ink-900/35">/</span> : null}
          {c.href ? (
            <Link href={c.href} className="font-medium text-brand-500 hover:underline" prefetch={false}>
              {c.label}
            </Link>
          ) : (
            <span className="font-semibold text-ink-900">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
