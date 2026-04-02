import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth/get-session-user-id";
import { isPreviewMode } from "@/lib/demo/is-preview-mode";
import { envBool } from "@/lib/env/env-bool";

/** جلسة Supabase لمسارات /employee — يُتخطّى مع المعاينة أو EMPLOYEE_PORTAL_OPEN */
export async function requireEmployeePortalSession(fallbackPath = "/employee/dashboard") {
  if (isPreviewMode() || envBool("NEXT_PUBLIC_EMPLOYEE_PORTAL_OPEN")) {
    return;
  }

  const userId = await getSessionUserId();
  if (!userId) {
    const pathname = headers().get("x-mw-pathname") ?? fallbackPath;
    redirect(`/employee/login?returnTo=${encodeURIComponent(pathname)}`);
  }
}
