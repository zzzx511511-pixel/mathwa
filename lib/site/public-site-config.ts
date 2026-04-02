import { generalPhotoRotation, industrialPhotoRotation } from "@/lib/site/sample-photos";
import { DEPARTMENT_KEYS, departmentHubPaths, departmentLabels } from "@/lib/employee/department-keys";

/** روابط غرف أقسام الموظفين — القائمة الكاملة (مثلاً بوابات الدخول، معاينات) */
export const employeeRoomNavLinks = DEPARTMENT_KEYS.map((k) => ({
  href: departmentHubPaths[k],
  label: departmentLabels[k]
}));

/** نفس الغرف لكن بدون «إدارة المشاريع» — المشاريع تُفتح من السايدبار فقط (منسدلة المشاريع) */
export const employeeRoomNavLinksBar = DEPARTMENT_KEYS.filter((k) => k !== "projects").map((k) => ({
  href: departmentHubPaths[k],
  label: departmentLabels[k]
}));

/** روابط أنواع العروض — تظهر داخل خانة «العروض» في الشريط العلوي */
export const offersCategoryLinks = [
  { href: "/#industrial", label: "المصانع والمستودعات" },
  { href: "/#commercial-workers", label: "التجارية وسكن العمال" },
  { href: "/#residential", label: "السكني" },
  { href: "/#lands", label: "الأراضي" }
] as const;

export type TopNavOffersDropdown = {
  type: "offers";
  label: string;
  /** صفحة العروض عند النقر على العنوان الرئيسي */
  href: string;
  items: readonly { href: string; label: string }[];
};

export type TopNavSimpleLink = { href: string; label: string };

export type TopNavItem = TopNavSimpleLink | TopNavOffersDropdown;

export const topNavLinks: TopNavItem[] = [
  {
    type: "offers",
    label: "العروض",
    href: "/offers",
    items: offersCategoryLinks
  },
  { href: "/projects", label: "مشاريعنا" },
  { href: "/services", label: "الخدمات" },
  { href: "/employee/login", label: "بوابة الموظفين" },
  { href: "/board", label: "مجلس الإدارة" },
  { href: "/#contact", label: "تواصل معنا" }
];

export const sidebarLinks = [
  { href: "/", label: "الرئيسية" },
  { href: "/employee-preview", label: "معاينة واجهة الموظفين" },
  { href: "/login?mode=signup&role=client", label: "العملاء" },
  { href: "/login?mode=signup&role=owner", label: "الملاك" }
];

// Hero background for the landing section — أي ملف داخل /public (مثلاً PNG أو SVG).
export const heroBackgroundImagePath = "/riyadh-skyline.svg";

export const industrialFilters = ["خطورة عالية", "خطورة متوسطة", "خطورة منخفضة"];

/** صور احتياطية لبطاقات العروض عند عدم وجود صورة من قاعدة البيانات */
export const suggestedIndustrialImages = [...industrialPhotoRotation];
export const suggestedGeneralImages = [...generalPhotoRotation];

export const metrics = [
  { value: "+150", label: "مشروع منجز" },
  { value: "+22", label: "سنة خبرة" },
  { value: "+1200", label: "عميل سعيد" },
  { value: "+850", label: "عقار تم بيعه" }
];

export const boardMembers = [
  { name: "م. عبدالله الراشد", role: "رئيس مجلس الإدارة", imageUrl: "/board-member-1.svg" },
  { name: "د. سارة المحمد", role: "نائب رئيس مجلس الإدارة", imageUrl: "/board-member-3.svg" },
  { name: "أ. خالد العتيبي", role: "المدير التنفيذي", imageUrl: "/board-member-2.svg" },
  { name: "أ. نورة القحطاني", role: "المدير المالي", imageUrl: "/board-member-1.svg" }
];

// Edit these text arrays whenever you want to refresh footer content.
export const footerQuickLinks: { href: string; label: string }[] = [
  { href: "/", label: "الرئيسية" },
  { href: "/employee/login", label: "بوابة الموظفين" },
  { href: "/#industrial", label: "المصانع والمستودعات" },
  { href: "/#lands", label: "الأراضي" },
  { href: "/offers", label: "العروض" },
  { href: "/projects", label: "مشاريعنا" },
  { href: "/board", label: "مجلس الإدارة" },
  { href: "/#contact", label: "تواصل معنا" }
];
export const footerContactLines = ["الرياض، المملكة العربية السعودية", "+966 11 XXXX XXX", "info@mathwa.sa"];
export const footerWorkingHoursLines = ["الأحد - الخميس", "8 ص - 5 م", "الجمعة - السبت: مغلق"];
