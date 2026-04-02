export const DEPARTMENT_KEYS = [
  "estates",
  "finance",
  "projects",
  "marketing",
  "e_services"
] as const;

export type DepartmentKey = (typeof DEPARTMENT_KEYS)[number];

export const departmentLabels: Record<DepartmentKey, string> = {
  estates: "إدارة الأملاك",
  finance: "المالية",
  projects: "إدارة المشاريع",
  marketing: "التسويق",
  e_services: "الخدمات الإلكترونية"
};

export const departmentHubPaths: Record<DepartmentKey, string> = {
  estates: "/employee/estates",
  finance: "/employee/finance",
  projects: "/employee/projects",
  marketing: "/employee/marketing",
  e_services: "/employee/e-services"
};

export function isDepartmentKey(v: unknown): v is DepartmentKey {
  return typeof v === "string" && (DEPARTMENT_KEYS as readonly string[]).includes(v);
}
