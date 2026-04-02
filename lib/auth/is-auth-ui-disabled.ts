import { envBool } from "@/lib/env/env-bool";

/** تعطيل مؤقت لواجهة الدخول/التسجيل فقط (ليس تعطيل صلاحيات الأقسام). */
export function isAuthUiDisabled(): boolean {
  return (
    envBool("NEXT_PUBLIC_AUTH_UI_DISABLED") ||
    envBool("NEXT_PUBLIC_EMPLOYEE_PORTAL_OPEN")
  );
}
