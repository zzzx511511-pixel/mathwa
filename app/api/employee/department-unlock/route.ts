import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createDeptSessionToken, departmentCookieName } from "@/lib/employee/dept-session-cookie";
import { isValidEmployeePortalCode } from "@/lib/employee/employee-portal-code";
import { isDepartmentKey } from "@/lib/employee/department-keys";
import { isPreviewMode } from "@/lib/demo/is-preview-mode";

const cookieBase = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30
};

export async function POST(req: Request) {
  let body: { department?: unknown; code?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const department = body?.department;
  const code = String(body?.code ?? "").trim();
  if (!isDepartmentKey(department) || !code) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  if (!isValidEmployeePortalCode(code)) {
    return NextResponse.json({ error: "invalid_format" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const {
    data: { user },
    error: userErr
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let verified = false;

  if (isPreviewMode()) {
    verified = true;
  } else {
    const { data, error } = await supabase.rpc("verify_employee_department_code", {
      p_department: department,
      p_plain_code: code
    });
    if (error) {
      return NextResponse.json(
        { error: "server_error", detail: error.message },
        { status: 500 }
      );
    }
    verified = Boolean(data);
  }

  if (!verified) {
    return NextResponse.json({ error: "wrong_code" }, { status: 401 });
  }

  const token = createDeptSessionToken(user.id, department);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(departmentCookieName(department), token, cookieBase);
  return res;
}
