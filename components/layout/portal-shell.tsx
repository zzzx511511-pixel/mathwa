import { ReactNode } from "react";
import type { EmployeePortalNavGroup } from "@/lib/employee/employee-portal-nav";
import { PortalSidebarNav } from "@/components/layout/portal-sidebar-nav";

export type PortalNavItem = {
  href: string;
  label: string;
};

export type PortalNavGroup = {
  heading: string;
  items: PortalNavItem[];
};

type PortalShellProps = {
  title: string;
  /** قائمة مسطّحة (بدون عناوين مجموعات) — للبوابات الأخرى كما كانت سابقًا */
  nav?: PortalNavItem[];
  /** مجموعات بعناوين — مثل غرف أقسام الموظفين */
  navGroups?: PortalNavGroup[] | EmployeePortalNavGroup[];
  children: ReactNode;
};

export function PortalShell({ title, nav, navGroups, children }: PortalShellProps) {
  const groups: any[] = navGroups ?? (nav?.length ? [{ heading: "", items: nav }] : []);
  if (!groups.length) {
    throw new Error("PortalShell: مرّر `nav` أو `navGroups`.");
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="self-start rounded-2xl border border-gold-400/50 bg-gradient-to-b from-brand-50 to-white p-4 shadow-sm lg:sticky lg:top-24 lg:max-h-[calc(100vh-6.5rem)] lg:overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-lg font-extrabold text-brand-400">{title}</h2>
          <p className="mt-1 text-sm text-ink-900/70">تنقّل داخل البوابة حسب القسم</p>
        </div>

        <PortalSidebarNav groups={groups as EmployeePortalNavGroup[]} />
      </aside>

      <section className="min-w-0">{children}</section>
    </div>
  );
}

