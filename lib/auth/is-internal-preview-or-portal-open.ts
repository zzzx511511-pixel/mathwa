import { isPreviewMode } from "@/lib/demo/is-preview-mode";
import { envBool } from "@/lib/env/env-bool";

/** معاينة المشروع أو فتح بوابة الموظفين للتطوير — نقاط دخول داخلية بدون مصادقة كاملة */
export function isInternalPreviewOrPortalOpen(): boolean {
  return isPreviewMode() || envBool("NEXT_PUBLIC_EMPLOYEE_PORTAL_OPEN");
}
