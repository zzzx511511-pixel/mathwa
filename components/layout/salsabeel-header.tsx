"use client";

import Link from "next/link";
import { useState } from "react";
import { LogoDrop } from "@/components/salsabeel/logo";

const NAV_LINKS = [
  { href: "/#categories", label: "التصنيفات" },
  { href: "/#how",        label: "كيف يعمل" },
  { href: "/#regions",    label: "المناطق" },
];

export function SalsabeelHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 border-b border-white/10"
      style={{
        background: "rgba(8, 47, 73, 0.97)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-5">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <LogoDrop size="sm" />
          <span
            className="text-xl font-black tracking-wide text-white"
            style={{ fontFamily: "Tajawal, sans-serif" }}
          >
            سل<span style={{ color: "#38bdf8" }}>س</span>بيل
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-white/70 transition hover:text-sal-400"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/#contact"
            className="rounded-2xl px-5 py-2 text-sm font-bold text-white shadow"
            style={{
              background: "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 55%, #0369a1 100%)",
              boxShadow: "0 4px 14px rgba(56,189,248,0.35)",
            }}
          >
            تواصل معنا
          </Link>
        </nav>

        {/* Admin + Mobile toggle */}
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="hidden items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20 transition md:flex"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            لوحة التحكم
          </Link>

          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg p-2 text-white/70 hover:bg-white/10 md:hidden"
            aria-label="القائمة"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              {open
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="border-t border-white/10 px-5 pb-4 md:hidden"
          style={{ background: "rgba(8,47,73,0.98)" }}
        >
          <div className="flex flex-col gap-1 pt-3">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/#contact"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-2xl py-3 text-center text-sm font-bold text-white shadow"
              style={{ background: "linear-gradient(135deg,#38bdf8,#0ea5e9,#0369a1)" }}
            >
              تواصل معنا
            </Link>
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-xl border border-white/20 bg-white/10 py-2.5 text-center text-sm font-semibold text-white"
            >
              لوحة التحكم
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
