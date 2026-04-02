import { NextResponse } from "next/server";
import { isPreviewMode } from "@/lib/demo/is-preview-mode";
import { createDeptSessionToken, departmentCookieName } from "@/lib/employee/dept-session-cookie";
import { isDepartmentKey, type DepartmentKey } from "@/lib/employee/department-keys";

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

const demoCookieBase = {
  path: "/" as const,
  maxAge: 60 * 60 * 24 * 7,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production"
};

const deptCookieBase = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/" as const,
  maxAge: 60 * 60 * 24 * 30
};

/**
 * يضبط كوكيز جلسة المعاينة ويفتح بوابة موظف (مثل غرفة إدارة الأملاك) بدون رمز.
 * يعمل فقط عند NEXT_PUBLIC_PREVIEW_UNTIL_LIVE أو NEXT_PUBLIC_DEMO_MODE.
 */
export async function GET(request: Request) {
  if (!isPreviewMode()) {
    return NextResponse.json(
      { error: "يمكن استخدام هذا المسار في وضع المعاينة فقط (PREVIEW_UNTIL_LIVE أو DEMO_MODE)." },
      { status: 403 }
    );
  }

  const url = new URL(request.url);
  let nextPath = url.searchParams.get("next") ?? "/employee/estates";
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return NextResponse.json({ error: "invalid_next" }, { status: 400 });
  }

  let department: DepartmentKey = "estates";
  const d = url.searchParams.get("department");
  if (d && isDepartmentKey(d)) {
    department = d;
  }

  const target = new URL(nextPath, url.origin);
  const res = NextResponse.redirect(target);

  const role = process.env.DEMO_ROLE ?? "super_admin";
  res.cookies.set("demo_role", role, demoCookieBase);

  const t = createDeptSessionToken(DEMO_USER_ID, department);
  res.cookies.set(departmentCookieName(department), t, deptCookieBase);

  return res;
}
