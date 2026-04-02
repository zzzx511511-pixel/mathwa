import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  departmentHubPaths,
  isDepartmentKey,
  type DepartmentKey
} from "@/lib/employee/department-keys";
import { createDeptSessionToken, departmentCookieName } from "@/lib/employee/dept-session-cookie";

const cookieBase = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30
};

function departmentAllowed(
  meta: Record<string, unknown> | undefined,
  department: DepartmentKey
): boolean {
  const raw = meta?.allowed_departments;
  if (raw == null) return true;
  const list = Array.isArray(raw) ? raw.filter((x) => typeof x === "string") : null;
  if (!list || list.length === 0) return true;
  return list.includes(department);
}

/** بعد تسجيل الدخول بالبريد؛ يضبط كوكي الدخول للقسم المختار */
export async function POST(req: Request) {
  let body: { department?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const department = body?.department;
  if (!isDepartmentKey(department)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const {
    data: { user },
    error: userErr
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const meta = user.user_metadata as Record<string, unknown> | undefined;
  if (!departmentAllowed(meta, department)) {
    return NextResponse.json(
      { error: "department_denied", detail: "هذا الحساب غير مفعّل للقسم المختار في بيانات المستخدم (allowed_departments)." },
      { status: 403 }
    );
  }

  const token = createDeptSessionToken(user.id, department);
  const res = NextResponse.json({
    ok: true,
    redirectTo: departmentHubPaths[department]
  });
  res.cookies.set(departmentCookieName(department), token, cookieBase);
  return res;
}
