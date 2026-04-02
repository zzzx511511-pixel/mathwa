import type { DepartmentKey } from "@/lib/employee/department-keys";

/**
 * حالة القسم في الواجهة:
 * - live: نشط للتطوير/الإنتاج الحالي
 * - planned: مؤجّل — الواجهة والمسارات موجودة كهيكل فقط — عدّل المحتوى من `employee-section-content.ts`
 */
export type DepartmentLifecycle = "live" | "planned";

export type FutureRouteStub = {
  href: string;
  label: string;
  /** عند false تظهر كبطاقة معطّلة / «قريباً» */
  enabled: boolean;
};

export type DepartmentModuleMeta = {
  key: DepartmentKey;
  lifecycle: DepartmentLifecycle;
  /**
   * مسارات يمكن تفعيلها لاحقاً دون تغيير الهيكل العام — انسخ البطاقة وغيّر enabled إلى true
   */
  futureRoutes: FutureRouteStub[];
};

/**
 * المصدر الوحيد لحالة «التفعيل لاحقاً» مقابل «جاهز الآن».
 * عند النشر: غيّر lifecycle إلى "live" وأضف المسارات مع enabled: true حسب الحاجة.
 */
export const departmentModuleRegistry: Record<DepartmentKey, DepartmentModuleMeta> = {
  estates: {
    key: "estates",
    lifecycle: "live",
    futureRoutes: [
      { href: "/employee/owners/new", label: "إضافة مالك", enabled: true },
      { href: "/employee/estates/contracts", label: "سجل العقود التفصيلي", enabled: false },
      { href: "/employee/estates/inventory-reports", label: "تقارير الجرد والمرفقات", enabled: false }
    ]
  },
  finance: {
    key: "finance",
    lifecycle: "live",
    futureRoutes: [
      { href: "/employee/finance-journal", label: "مسودة قيد", enabled: true },
      { href: "/finance/reports", label: "تقارير المالية", enabled: true }
    ]
  },
  marketing: {
    key: "marketing",
    lifecycle: "live",
    futureRoutes: [
      { href: "/employee/marketing-offers", label: "إضافة عرض", enabled: true },
      { href: "/employee/marketing-leads", label: "العملاء المحتملون", enabled: true },
      { href: "/employee/marketing-archive", label: "أرشيف العروض", enabled: true }
    ]
  },
  projects: {
    key: "projects",
    lifecycle: "planned",
    futureRoutes: [
      { href: "/employee/projects/board", label: "لوحة المشاريع والمراحل", enabled: false },
      { href: "/employee/projects/tasks", label: "المهام والاعتمادات", enabled: false },
      { href: "/employee/projects/risks", label: "سجل المخاطر والتكاليف", enabled: false }
    ]
  },
  e_services: {
    key: "e_services",
    lifecycle: "planned",
    futureRoutes: [
      {
        href: "/employee/service-content",
        label: "محتوى الخدمات (الموقع العام)",
        enabled: true
      },
      { href: "/employee/e-services/forms", label: "نماذج الطلبات الإلكترونية", enabled: false },
      { href: "/employee/e-services/seo", label: "وسوم SEO والصفحات الثابتة", enabled: false }
    ]
  }
};

export function getDepartmentModule(key: DepartmentKey): DepartmentModuleMeta {
  return departmentModuleRegistry[key];
}
