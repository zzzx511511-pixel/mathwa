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

export function MainShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "#f0f9ff" }}>
      <SalsabeelHeader />
      <main className="w-full">{children}</main>

      <footer style={{ background: "#082f49", padding: "60px 40px 40px" }}>
        <div className="mx-auto max-w-screen-xl text-center">
          {/* Logo */}
          <div className="mb-4 flex items-center justify-center gap-3">
            <LogoDrop size="sm" />
            <span
              className="text-xl font-black text-white"
              style={{ fontFamily: "Tajawal, sans-serif" }}
            >
              سل<span style={{ color: "#38bdf8" }}>س</span>بيل
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

          <p className="text-xs text-white/25">
            © 2025 سلسبيل — جميع الحقوق محفوظة
          </p>
        </div>
      </footer>
    </div>
  );
}
