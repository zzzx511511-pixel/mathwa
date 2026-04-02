"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { UserMenu } from "@/components/auth/UserMenu";
import type { TopNavItem } from "@/lib/site/public-site-config";

type NavLink = { href: string; label: string };

function isOffersDropdown(item: TopNavItem): item is Extract<TopNavItem, { type: "offers" }> {
  return "type" in item && item.type === "offers";
}

type SiteHeaderProps = {
  topNavLinks: TopNavItem[];
  sidebarLinks: NavLink[];
  /** روابط غرف أقسام الموظفين — تظهر في قائمة الثلاث خطوط */
  employeeRoomLinks: NavLink[];
};

export function SiteHeader({ topNavLinks, sidebarLinks, employeeRoomLinks }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const [offersOpen, setOffersOpen] = useState(false);
  const authUiDisabled =
    (process.env.NEXT_PUBLIC_AUTH_UI_DISABLED ?? "").toString().trim().replace(/^['"]|['"]$/g, "") ===
      "true" ||
    (process.env.NEXT_PUBLIC_EMPLOYEE_PORTAL_OPEN ?? "")
      .toString()
      .trim()
      .replace(/^['"]|['"]$/g, "") === "true";

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gold-400/30 bg-[#2f160f]/95 backdrop-blur">
        <div className="mx-auto flex min-h-[3.25rem] max-w-screen-2xl flex-wrap items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-4">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 rounded-lg bg-white/95 px-3 py-1.5"
            onClick={() => setOpen(false)}
          >
            <div className="h-6 w-6 rounded-md bg-[#d4a14f]" />
            <span className="text-sm font-extrabold text-ink-900">مثوى</span>
          </Link>

          <nav
            className="hidden flex-1 flex-wrap justify-center gap-1 text-sm lg:flex xl:gap-2"
            aria-label="التنقل الرئيسي"
          >
            {topNavLinks.map((item) =>
              isOffersDropdown(item) ? (
                <div key={item.href} className="group relative">
                  <Link
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-semibold text-white/90 transition hover:bg-[#d4a14f]/20 hover:text-white xl:px-3"
                    href={item.href as Route}
                    prefetch={false}
                  >
                    {item.label}
                    <span aria-hidden className="text-[0.65rem] text-white/70 transition group-hover:text-white">
                      ▼
                    </span>
                  </Link>
                  <div
                    className="invisible absolute start-0 top-full z-50 mt-1 min-w-[14rem] rounded-lg border border-gold-400/35 bg-[#2a120c] py-1 shadow-xl opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
                    role="menu"
                    aria-label="أنواع العروض"
                  >
                    {item.items.map((sub) => (
                      <Link
                        key={sub.href}
                        role="menuitem"
                        href={sub.href as Route}
                        prefetch={false}
                        className="block px-3 py-2 text-sm font-semibold text-white/90 hover:bg-[#d4a14f]/25 hover:text-white"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  className="rounded-lg px-2.5 py-1.5 font-semibold text-white/90 transition hover:bg-[#d4a14f]/20 hover:text-white xl:px-3"
                  href={item.href as Route}
                  key={item.href}
                  prefetch={false}
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>

          <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-gold-400/70 bg-[#1a0f0a] text-gold-300 shadow-md hover:bg-[#d4a14f]/25 hover:text-white"
              aria-expanded={open}
              aria-controls="mobile-nav-drawer"
              aria-label={open ? "إغلاق القائمة والأقسام" : "فتح القائمة — تصفح الموقع وأقسام العمل"}
              title="القائمة والأقسام ☰"
              onClick={() => setOpen((v) => !v)}
            >
              <span className="sr-only">{open ? "إغلاق" : "قائمة"}</span>
              {open ? (
                <span className="text-xl leading-none" aria-hidden>
                  ×
                </span>
              ) : (
                <span className="flex flex-col gap-1" aria-hidden>
                  <span className="block h-0.5 w-5 rounded bg-current" />
                  <span className="block h-0.5 w-5 rounded bg-current" />
                  <span className="block h-0.5 w-5 rounded bg-current" />
                </span>
              )}
            </button>
            {!authUiDisabled ? (
              <>
                <Link
                  href="/login"
                  className="rounded-lg border border-gold-400/60 px-2 py-1.5 text-[11px] font-semibold text-gold-500 hover:bg-gold-400/10 sm:px-3 sm:text-sm"
                >
                  تسجيل الدخول
                </Link>
                <UserMenu />
              </>
            ) : null}
          </div>
        </div>
      </header>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-[100] bg-black/50"
          aria-label="إغلاق القائمة"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        id="mobile-nav-drawer"
        className={`fixed right-0 top-0 z-[110] h-full w-[min(100%,22rem)] flex-col border-l border-gold-400/40 bg-[#2f160f] shadow-2xl ${
          open ? "flex" : "hidden"
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <p className="text-sm font-extrabold text-white">القائمة والأقسام</p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-white/20 px-2.5 py-1 text-xs text-white hover:bg-white/10"
          >
            إغلاق
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gold-400">القائمة الجانبية</p>
          <nav className="space-y-1">
            <Link
              href="/"
              prefetch={false}
              onClick={() => setOpen(false)}
              className="block rounded-lg border border-gold-400/35 bg-gold-400/10 px-3 py-2.5 text-sm font-bold text-gold-300 hover:bg-gold-400/20"
            >
              الرئيسية
            </Link>

            <div className="rounded-lg border border-white/10 bg-white/5">
              <button
                type="button"
                onClick={() => setOffersOpen((v) => !v)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
                aria-expanded={offersOpen}
              >
                <span>العروض</span>
                <span aria-hidden className="text-sm text-white/75">
                  {offersOpen ? "▼" : "▶"}
                </span>
              </button>
              {offersOpen ? (
                <div className="border-t border-white/10 p-2">
                  <div className="space-y-1">
                    <Link
                      href="/#industrial"
                      prefetch={false}
                      onClick={() => setOpen(false)}
                      className="block rounded-md px-3 py-2 text-sm text-white/90 hover:bg-white/10"
                    >
                      المصانع والمستودعات
                    </Link>
                    <Link
                      href="/#commercial-workers"
                      prefetch={false}
                      onClick={() => setOpen(false)}
                      className="block rounded-md px-3 py-2 text-sm text-white/90 hover:bg-white/10"
                    >
                      التجارية وسكن العمال
                    </Link>
                    <Link
                      href="/#residential"
                      prefetch={false}
                      onClick={() => setOpen(false)}
                      className="block rounded-md px-3 py-2 text-sm text-white/90 hover:bg-white/10"
                    >
                      السكني
                    </Link>
                    <Link
                      href="/#lands"
                      prefetch={false}
                      onClick={() => setOpen(false)}
                      className="block rounded-md px-3 py-2 text-sm text-white/90 hover:bg-white/10"
                    >
                      الأراضي
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>

            <Link
              href="/employee/dashboard"
              prefetch={false}
              onClick={() => setOpen(false)}
              className="block rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white hover:bg-white/12"
            >
              بوابة الموظفين
            </Link>
            {employeeRoomLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href as Route}
                prefetch={false}
                onClick={() => setOpen(false)}
                className="block rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/12"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <p className="mb-2 mt-6 text-xs font-bold uppercase tracking-wide text-gold-500/90">بوابات أخرى</p>
          <nav className="space-y-1">
            <Link
              href="/owner/portal"
              prefetch={false}
              onClick={() => setOpen(false)}
              className="block rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white hover:bg-white/12"
            >
              بوابة الملاك
            </Link>
            <Link
              href="/tenant/portal"
              prefetch={false}
              onClick={() => setOpen(false)}
              className="block rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white hover:bg-white/12"
            >
              بوابة العملاء
            </Link>
            <Link
              href="/finance/dashboard"
              prefetch={false}
              onClick={() => setOpen(false)}
              className="block rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white hover:bg-white/12"
            >
              بوابة المالية
            </Link>
          </nav>
          {!authUiDisabled ? (
            <>
              <p className="mb-2 mt-6 text-xs font-bold uppercase tracking-wide text-gold-500/90">بوابات الدخول</p>
              <nav className="space-y-1">
                {sidebarLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href as Route}
                    prefetch={false}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white hover:bg-white/12"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </>
          ) : null}
        </div>
      </aside>
    </>
  );
}
