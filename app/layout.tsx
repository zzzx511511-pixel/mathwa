import type { Metadata, Viewport } from "next";
import "./globals.css";
import { MainShell } from "@/components/layout/main-shell";

export const metadata: Metadata = {
  title: "سلسبيل – اكتشف أفضل الأماكن",
  description: "سلسبيل – منصة اكتشاف الأماكن: كافيهات ومطاعم وعيادات وصالونات ومجمعات في مدن المملكة"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html dir="rtl" lang="ar">
      <body
        className="min-h-screen antialiased"
        style={{
          backgroundColor: "#F0FDFA",
          color: "#0F172A",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
        }}
      >
        <MainShell>{children}</MainShell>
      </body>
    </html>
  );
}
