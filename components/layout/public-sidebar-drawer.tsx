"use client";

import { useState } from "react";

type SidebarLink = {
  href: string;
  label: string;
};

type PublicSidebarDrawerProps = {
  links: SidebarLink[];
};

export function PublicSidebarDrawer({ links }: PublicSidebarDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed right-4 top-28 z-[70]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-xl border border-gold-400/50 bg-[#2f160f] px-3 py-2 text-sm font-bold text-gold-500 shadow-md hover:bg-[#3a1d13] active:scale-[0.99]"
          aria-label="فتح القائمة الجانبية"
        >
          ⋯ الأقسام
        </button>
      </div>

      {open ? (
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[80] bg-black/40"
          aria-label="إغلاق القائمة الجانبية"
        />
      ) : null}

      <aside
        className={`fixed right-0 top-0 z-[90] h-full w-72 transform border-l border-gold-400/30 bg-[#2f160f] p-4 text-white shadow-2xl transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-extrabold">الأقسام</h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-white/20 px-2 py-1 text-xs hover:bg-white/10"
          >
            إغلاق
          </button>
        </div>
        <nav className="space-y-2">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </aside>
    </>
  );
}
