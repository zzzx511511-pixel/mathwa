import type { Metadata } from "next";
import Link from "next/link";
import { EmployeeDashboardContent } from "@/components/employee/employee-dashboard-content";
import { EmployeePreviewHero } from "@/components/employee/employee-preview-hero";
import { EmployeePortalShell } from "@/components/employee/employee-portal-shell";
import { isPreviewMode } from "@/lib/demo/is-preview-mode";

export const metadata: Metadata = {
  title: "معاينة لوحة الموظفين | مثوى",
  description: "معاينة واجهة بوابة الموظفين بدون تسجيل دخول.",
  robots: { index: false, follow: false }
};

export default function EmployeePreviewPage() {
  const quickEstates = isPreviewMode() ? "/api/preview/employee-session?next=/employee/estates" : null;

  return (
    <div className="space-y-6">
      <EmployeePreviewHero quickEstatesHref={quickEstates} />

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs text-ink-900/85 sm:text-sm">
        <span>
          <span className="font-bold text-amber-900">تنبيه:</span>
          {quickEstates ? (
            <>
              {" "}
              مع <strong>وضع المعاينة</strong> استخدم الزر أعلاه «دخول إدارة الأملاك» للدخول مباشرة وتعديل الواجهة.
              أما بدون معاينة فالروابط تحتاج{" "}
              <Link className="font-semibold text-brand-500 underline" href="/login">
                تسجيل الدخول
              </Link>{" "}
              أو <Link className="font-semibold text-brand-500 underline" href="/employee/login">دخول الموظفين</Link>.
            </>
          ) : (
            <>
              {" "}
              الروابط في القائمة الجانبية تفتح الصفحات الحقيقية وتتطلب{" "}
              <Link className="font-semibold text-brand-500 underline" href="/login">
                تسجيل الدخول
              </Link>
              .
            </>
          )}
        </span>
      </div>

      <EmployeePortalShell>
        <EmployeeDashboardContent />
      </EmployeePortalShell>
    </div>
  );
}
