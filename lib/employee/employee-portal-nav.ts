export type EmployeePortalNavItem =
  | { type?: "link"; href: string; label: string }
  | {
      type: "collapsible";
      label: string;
      items: { href: string; label: string }[];
    };

export type EmployeePortalNavGroup = {
  heading: string;
  items: EmployeePortalNavItem[];
};

/** قائمة موحّدة لكل صفحات بوابة الموظفين — غرف الأقسام */
export const employeePortalNavGroups: EmployeePortalNavGroup[] = [
  {
    heading: "عام",
    items: [{ href: "/", label: "الرئيسية" }]
  },
  {
    heading: "غرف الأقسام",
    items: [
      { href: "/employee/estates", label: "إدارة الأملاك" },
      { href: "/employee/finance", label: "المالية" },
      {
        type: "collapsible",
        label: "المشاريع",
        items: [
          { href: "/#industrial", label: "المصانع والمستودعات" },
          { href: "/#commercial-workers", label: "التجارية وسكن العمال" },
          { href: "/#residential", label: "السكني" },
          { href: "/#lands", label: "الأراضي" }
        ]
      },
      { href: "/employee/marketing", label: "التسويق" },
      { href: "/employee/e-services", label: "الخدمات الإلكترونية" }
    ]
  }
];
