import type { Metadata, Viewport } from "next";
import "./globals.css";
import { MainShell } from "@/components/layout/main-shell";

export const metadata: Metadata = {
  title: "سلسبيل — اختر بثقة، قيّم بصدق",
  description:
    "سلسبيل — دليلك الأمين لأفضل الكافيهات والمطاعم والعيادات والصالونات والمجمعات في الرياض",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html dir="rtl" lang="ar">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body style={{ fontFamily: "'Tajawal', ui-sans-serif, system-ui, sans-serif" }}>
        <MainShell>{children}</MainShell>
      </body>
    </html>
  );
}
