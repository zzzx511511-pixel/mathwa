import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { DepartmentKey } from "@/lib/employee/department-keys";
import { departmentHubPaths } from "@/lib/employee/department-keys";
import { departmentCookieName, parseDeptSessionToken } from "@/lib/employee/dept-session-cookie";
import { getSessionUserId } from "@/lib/auth/get-session-user-id";
import { getUserRole } from "@/lib/auth/get-user-role";
import { isEmployeePortalWideAccessRole } from "@/lib/auth/access-code-redirect";
import { isPreviewMode } from "@/lib/demo/is-preview-mode";
import { envBool } from "@/lib/env/env-bool";

/**
 * يفرض وجود جلسة Supabase + كوكي قسم موقّع بعد إدخال رمز التعريف.
 * مواصفة مثوى: الموظف/المدير بعد الدخول بالرمز — جميع الأقسام مفتوحة دون رمز إضافي.
 * يُتخطّى تلقائياً في وضع المعاينة أو عند NEXT_PUBLIC_EMPLOYEE_PORTAL_OPEN (تطوير).
 */
export async function requireDepartmentAccess(department: DepartmentKey) {
  if (isPreviewMode() || envBool("NEXT_PUBLIC_EMPLOYEE_PORTAL_OPEN")) {
    return;
  }

  const userId = await getSessionUserId();
  const hub = departmentHubPaths[department];
  const unlockUrl = `/employee/unlock?department=${encodeURIComponent(department)}&returnTo=${encodeURIComponent(hub)}`;

  if (!userId) {
    redirect(`/login?returnTo=${encodeURIComponent(unlockUrl)}`);
  }

  const role = await getUserRole();
  if (isEmployeePortalWideAccessRole(role)) {
    return;
  }

  const token = cookies().get(departmentCookieName(department))?.value;
  if (!token || !parseDeptSessionToken(token, department, userId)) {
    redirect(unlockUrl);
  }
}
