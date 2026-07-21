import { ReactNode } from "react";
import Link from "next/link";
import { SalsabeelHeader } from "./salsabeel-header";
import { LogoDrop } from "@/components/salsabeel/logo";

const FOOTER_LINKS = [
  { href: "/#categories", label: "التصنيفات" },
  { href: "/#how",        label: "كيف يعمل" },
  { href: "/#regions",    label: "المناطق" },
  { href: "/#contact",    label: "تواصل معنا" },
  { href: "mailto:salsabelapp@gmail.com", label: "salsabelapp@gmail.com" },
];

const LEGAL_LINKS = [
  { href: "/privacy", label: "سياسة الخصوصية" },
  { href: "/terms",   label: "شروط الاستخدام" },
];

export function MainShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "#FAF7F2" }}>
      <SalsabeelHeader />
      <main className="w-full">{children}</main>

      <footer style={{ background: "#031A17", padding: "60px 40px 40px" }}>
        <div className="mx-auto max-w-screen-xl text-center">
          {/* Logo */}
          <div className="mb-4 flex items-center justify-center gap-3">
            <LogoDrop size="sm" />
            <span
              className="text-xl font-black text-white"
              style={{ fontFamily: "Tajawal, sans-serif" }}
            >
              و<span style={{ color: "#16A394" }}>ي</span>ن
            </span>
          </div>

          <p className="mb-8 text-sm text-white/40" style={{ letterSpacing: "2px" }}>
            اختر بثقة • قيّم بصدق
          </p>

          <ul className="mb-8 flex flex-wrap justify-center gap-x-7 gap-y-2">
            {FOOTER_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-sm text-white/50 transition hover:text-sal-400"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-1">
            {LEGAL_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-xs text-white/40 underline underline-offset-2 transition hover:text-sal-400"
              >
                {l.label}
              </Link>
            ))}
          </div>

          <p className="mt-4 text-xs text-white/25">
            © 2025 وين — جميع الحقوق محفوظة
          </p>
        </div>
      </footer>
    </div>
  );
}
