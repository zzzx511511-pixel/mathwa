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

        {/* Mobile toggle */}
        <div className="flex items-center gap-2">
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
          </div>
        </div>
      )}
    </header>
  );
}
