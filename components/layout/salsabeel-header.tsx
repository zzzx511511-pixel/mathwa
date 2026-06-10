"use client";

import Link from "next/link";
import { useState } from "react";
import { CATEGORIES } from "@/lib/salsabeel/categories";

export function SalsabeelHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-sal-800 bg-sal-900 text-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-500 text-sal-900 shadow">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
            </svg>
          </div>
          <div className="leading-tight">
            <span className="block text-lg font-extrabold tracking-tight">سلسبيل</span>
            <span className="block text-[10px] text-sal-300 font-medium">اكتشف أفضل الأماكن</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/" className="rounded-lg px-3 py-2 text-sm font-semibold text-white/90 hover:bg-sal-800 hover:text-white transition">
            الرئيسية
          </Link>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-white/80 hover:bg-sal-800 hover:text-white transition"
            >
              {cat.icon} {cat.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="hidden md:inline-flex items-center gap-1.5 rounded-xl bg-gold-500 px-4 py-2 text-sm font-bold text-sal-900 hover:bg-gold-400 transition shadow"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            لوحة التحكم
          </Link>

          {/* Mobile menu button */}
          <button
            className="rounded-lg p-2 text-white/80 hover:bg-sal-800 md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="القائمة"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-sal-800 bg-sal-900 px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-1 pt-2">
            <Link href="/" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold text-white/90 hover:bg-sal-800">الرئيسية</Link>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-white/80 hover:bg-sal-800"
              >
                {cat.icon} {cat.label}
              </Link>
            ))}
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="mt-2 rounded-xl bg-gold-500 px-4 py-2 text-center text-sm font-bold text-sal-900"
            >
              لوحة التحكم
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
