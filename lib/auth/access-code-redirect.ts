import type { AppRole } from "@/lib/auth/get-user-role";

/** مسارات البوابات الثلاث حسب مواصفة التعريف */
export function redirectUrlForAccessCodeRole(role: string | null | undefined): string {
  const r = String(role ?? "")
    .trim()
    .toLowerCase();

  if (
    r === "admin" ||
    r === "super_admin" ||
    r === "manager" ||
    r === "employee" ||
    r === "collector" ||
    r === "finance"
  ) {
    return "/employee/estates";
  }
  if (r === "owner") {
    return "/owner/properties";
  }
  if (r === "client" || r === "tenant") {
    return "/client/contracts";
  }

  return "/auth/redirect";
}

export function isEmployeePortalWideAccessRole(role: AppRole | string | null | undefined): boolean {
  const r = String(role ?? "").toLowerCase();
  return (
    r === "admin" ||
    r === "super_admin" ||
    r === "manager" ||
    r === "employee" ||
    r === "collector"
  );
}
