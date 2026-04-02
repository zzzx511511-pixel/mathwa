import type { Metadata, Viewport } from "next";
import "./globals.css";
import { MainShell } from "@/components/layout/main-shell";

export const metadata: Metadata = {
  title: "مثوى العقارية",
  description: "نظام إدارة العقارات الشامل لشركة مثوى العقارية"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html dir="rtl" lang="ar">
      <body
        className="min-h-screen bg-brand-100 text-ink-900 antialiased"
        style={{
          backgroundColor: "#F0F7F0",
          color: "#2C1F14",
          fontFamily: "ui-sans-serif, system-ui, sans-serif"
        }}
      >
        <MainShell>{children}</MainShell>
      </body>
    </html>
  );
}
