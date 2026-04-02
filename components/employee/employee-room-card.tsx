import Link from "next/link";
import type { ReactNode } from "react";

export function EmployeeRoomCard({
  href,
  title,
  children
}: {
  href: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-ink-900/10 bg-white p-5 shadow-sm transition hover:border-gold-400/50 hover:bg-gold-400/5"
    >
      <h3 className="text-lg font-bold text-brand-400">{title}</h3>
      <div className="mt-2 text-sm text-ink-900/80">{children}</div>
    </Link>
  );
}

export function EmployeeRoomPlaceholder({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-dashed border-ink-900/20 bg-brand-50/50 p-5">
      <h3 className="text-lg font-bold text-ink-900">{title}</h3>
      <div className="mt-2 text-sm text-ink-900/75">{children}</div>
    </article>
  );
}
