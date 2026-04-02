"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { EmployeePortalNavGroup, EmployeePortalNavItem } from "@/lib/employee/employee-portal-nav";

function isCollapsible(item: EmployeePortalNavItem): item is Extract<EmployeePortalNavItem, { type: "collapsible" }> {
  return (item as any)?.type === "collapsible";
}

export function PortalSidebarNav({ groups }: { groups: EmployeePortalNavGroup[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const normalized = useMemo(() => {
    const mapped = groups.map((g) => ({
      heading: g.heading,
      items: g.items.map((it) => {
        if (isCollapsible(it)) return it;
        return { type: "link" as const, href: (it as any).href, label: (it as any).label };
      })
    }));

    // Ensure "الرئيسية" is always the first item in employee portal sidebar.
    if (mapped.length > 0) {
      const firstGroup = mapped[0];
      const hasHome = firstGroup.items.some(
        (it) => !isCollapsible(it as any) && (it as any).href === "/"
      );
      if (!hasHome) {
        firstGroup.items = [
          { type: "link" as const, href: "/", label: "الرئيسية" },
          ...firstGroup.items
        ];
      } else {
        const home = firstGroup.items.find(
          (it) => !isCollapsible(it as any) && (it as any).href === "/"
        ) as any;
        firstGroup.items = [
          home,
          ...firstGroup.items.filter(
            (it) => isCollapsible(it as any) || (it as any).href !== "/"
          )
        ];
      }
    }

    return mapped;
  }, [groups]);

  return (
    <div className="flex flex-col gap-4">
      {normalized.map((group, gi) => (
        <div key={`${group.heading}-${gi}`}>
          {group.heading ? (
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-900/45">{group.heading}</p>
          ) : null}

          <nav className="flex flex-col gap-2">
            {group.items.map((item) => {
              if (isCollapsible(item)) {
                const key = `collapsible:${item.label}`;
                const isOpen = open[key] ?? false;
                return (
                  <div key={key} className="rounded-xl border border-ink-900/10 bg-white shadow-sm">
                    <button
                      type="button"
                      onClick={() => setOpen((s) => ({ ...s, [key]: !isOpen }))}
                      className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm font-medium text-ink-900/85 hover:bg-gold-400/10"
                      aria-expanded={isOpen}
                    >
                      <span>{item.label}</span>
                      <span className="text-base leading-none text-ink-900/60" aria-hidden>
                        {isOpen ? "▲" : "▼"}
                      </span>
                    </button>
                    {isOpen ? (
                      <div className="border-t border-ink-900/10 p-2">
                        <div className="flex flex-col gap-1">
                          {item.items.map((sub) => (
                            <Link
                              key={`${key}:${sub.href}`}
                              href={sub.href}
                              prefetch={false}
                              className="rounded-lg px-3 py-2 text-sm text-ink-900/80 hover:bg-brand-100"
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              }

              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className="rounded-xl border border-ink-900/10 bg-white px-3 py-2 text-sm font-medium text-ink-900/85 shadow-sm hover:border-gold-400 hover:bg-gold-400/10"
                  prefetch={false}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
    </div>
  );
}

