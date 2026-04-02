import type { DepartmentKey } from "@/lib/employee/department-keys";

/**
 * نصوص غرف الموظفين — عدّل هذا الملف بعد الرفع للإنتاج دون المساس بمنطق الصفحات.
 * (لاحقاً يمكن استبدال القراءة بمصدر CMS أو جدول في قاعدة البيانات بنفس الشكل.)
 */
export type EmployeeSectionCopy = {
  roomLabel: string;
  title: string;
  intro: string;
  /** يظهر فقط عندما lifecycle = planned في الـ registry */
  plannedBanner?: string;
  /** افكار تطوير — عرض كنقاط في الواجهة */
  nextSteps: string[];
};

export const employeeSectionContent: Record<DepartmentKey, EmployeeSectionCopy> = {
  estates: {
    roomLabel: "غرفة القسم",
    title: "إدارة الأملاك",
    intro:
      "هنا إدارة الأملاك كاملة تحت الولاية: العقارات بحالاتها والصيانة والتفاصيل. الموقع العام يعرض للزوّار الوحدات الشاغرة كعروض فقط.",
    nextSteps: [
      "ربط حقول إضافية من قاعدة البيانات عند الحاجة",
      "توسيع تقارير الصيانة والاعتمادات"
    ]
  },
  finance: {
    roomLabel: "غرفة القسم",
    title: "المالية",
    intro:
      "القيود والفواتير والتحصيل عبر واجهة /finance. في وضع المعاينة يمكن تصفّح المسارات بدون حماية كاملة.",
    nextSteps: ["اعتماد قيود محاسبية كاملة", "تكامل بنوك وتصدير تقارير زكاة وضريبة عند الطلب"]
  },
  marketing: {
    roomLabel: "غرفة القسم",
    title: "التسويق",
    intro:
      "عروض، أرشيف، عملاء محتملون — ربط التخزين وPDF وواتساب يُكمَل عند تفعيل الإنتاج الكامل.",
    nextSteps: ["رفع الوسائط إلى Supabase Storage", "توليد عروض أسعار PDF", "أتمتة المطابقة مع Leads"]
  },
  projects: {
    roomLabel: "غرفة القسم",
    title: "إدارة المشاريع",
    intro:
      "هيكل الغرفة جاهز للتطوير المستقبلي: مهام، مراحل، ميزانيات مشاريع، ومستندات — دون كسر المسارات الحالية.",
    plannedBanner:
      "هذا القسم مؤجَّل حسب إعدادات المشروع الحالية. يمكنك تغيير الحالة إلى «نشط» من ملف department-module-registry.ts عند الجاهزية.",
    nextSteps: [
      "تعريف كيانات المشروع في قاعدة البيانات",
      "صلاحيات فرق المشاريع ومسارات الاعتماد",
      "ربط المشاريع بالعقارات أو العقود عند الحاجة"
    ]
  },
  e_services: {
    roomLabel: "غرفة القسم",
    title: "الخدمات الإلكترونية",
    intro:
      "إدارة ما يظهر للعملاء رقمياً على الموقع. جزء من المحتوى متاح عبر «تفاصيل الخدمات»؛ بقية البنود تُفعَّل لاحقاً.",
    plannedBanner:
      "التوسعة الرئيسية (نماذج، SEO، أتمتة) مؤجّلة — الهيكل والروابط الجاهزة للتفعيل من department-module-registry.ts.",
    nextSteps: [
      "نماذج طلبات قابلة للتكوين من لوحة التحكم",
      "ربط الإشعارات والبريد",
      "صفحات ثابتة ووسوم SEO مركزية"
    ]
  }
};

export function getEmployeeSectionContent(key: DepartmentKey): EmployeeSectionCopy {
  return employeeSectionContent[key];
}
