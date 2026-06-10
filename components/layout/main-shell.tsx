import { ReactNode } from "react";
import { SalsabeelHeader } from "./salsabeel-header";

export function MainShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-sal-50">
      <SalsabeelHeader />
      <main className="mx-auto w-full max-w-screen-xl px-4 py-8">{children}</main>
      <footer className="mt-12 border-t border-sal-800 bg-sal-900 px-4 py-8 text-center text-sm text-white/60">
        <p className="font-bold text-white text-base">سلسبيل</p>
        <p className="mt-1">اكتشف أفضل الأماكن حولك • جميع الحقوق محفوظة © 2025</p>
      </footer>
    </div>
  );
}
