import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

/** يضمّ مسارات عامة مثل /employee/login ومسارات (portal) المحمية */
export default function EmployeeShellLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
