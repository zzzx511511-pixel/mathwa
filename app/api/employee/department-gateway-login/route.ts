import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { departmentLabels, isDepartmentKey, type DepartmentKey } from "@/lib/employee/department-keys";
import { verifyDepartmentGatePassword } from "@/lib/employee/department-gate-password";
import {
  EMPLOYEE_DEPT_GATE_COOKIE_NAME,
  createEmployeeDeptGateToken
} from "@/lib/employee/employee-dept-gate-cookie";
import { isPreviewMode } from "@/lib/demo/is-preview-mode";

const gateCookieOpts = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 8
};

/** معاينة: بريد لكل قسم وكلمة مرور بسيطة (لا تستخدم في الإنتاج) */
const DEMO_EMAIL_TO_DEPT: Record<string, { password: string; department: DepartmentKey }> = {
  "estates.demo@mathwa.local": { password: "estates1", department: "estates" },
  "finance.demo@mathwa.local": { password: "finance1", department: "finance" },
  "projects.demo@mathwa.local": { password: "projects1", department: "projects" },
  "marketing.demo@mathwa.local": { password: "marketing1", department: "marketing" },
  "eservices.demo@mathwa.local": { password: "eservices1", department: "e_services" }
};

export async function POST(request: Request) {
  if (process.env.EMPLOYEE_GATEWAY_DISABLED === "true") {
    return NextResponse.json({ error: "disabled" }, { status: 403 });
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");

  if (!email || !password) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  let department: DepartmentKey | null = null;

  if (isPreviewMode()) {
    const d = DEMO_EMAIL_TO_DEPT[email];
    if (!d || d.password !== password) {
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }
    department = d.department;
  } else {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
    }
    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: row, error } = await admin
      .from("department_portal_accounts")
      .select("department, password_hash")
      .eq("login_email", email)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: "database_error", detail: error.message },
        { status: 500 }
      );
    }
    if (!row?.password_hash || !isDepartmentKey(row.department)) {
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }
    if (!verifyDepartmentGatePassword(password, row.password_hash)) {
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }
    department = row.department;
  }

  if (!department) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const token = createEmployeeDeptGateToken(department);
  const res = NextResponse.json({
    ok: true,
    department,
    departmentLabel: departmentLabels[department]
  });
  res.cookies.set(EMPLOYEE_DEPT_GATE_COOKIE_NAME, token, gateCookieOpts);
  return res;
}
