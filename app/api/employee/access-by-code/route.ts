import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isValidEmployeePortalCode } from "@/lib/employee/employee-portal-code";
import { hashEmployeePortalCode } from "@/lib/employee/portal-code-hash";
import {
  EMPLOYEE_DEPT_GATE_COOKIE_NAME,
  parseEmployeeDeptGateToken
} from "@/lib/employee/employee-dept-gate-cookie";
import {
  departmentHubPaths,
  isDepartmentKey,
  type DepartmentKey
} from "@/lib/employee/department-keys";
import { createDeptSessionToken, departmentCookieName } from "@/lib/employee/dept-session-cookie";
import { isPreviewMode } from "@/lib/demo/is-preview-mode";

const deptSessionCookieBase = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30
};

function readGateDepartment(): DepartmentKey | undefined | "bypass" {
  if (process.env.EMPLOYEE_GATEWAY_DISABLED === "true") {
    return "bypass";
  }
  const v = cookies().get(EMPLOYEE_DEPT_GATE_COOKIE_NAME)?.value;
  if (!v) return undefined;
  const d = parseEmployeeDeptGateToken(v);
  if (!d || !isDepartmentKey(d)) return undefined;
  return d;
}

function clearGateCookie(res: NextResponse) {
  res.cookies.set(EMPLOYEE_DEPT_GATE_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
}

/**
 * يجب ربط كوكيز Supabase بـ NextResponse وإلا لا تُحفَظ جلسة signInWithPassword في Route Handlers.
 * تتطلب (ما عدا EMPLOYEE_GATEWAY_DISABLED) جلسة «بوابة القسم» بعد department-gateway-login.
 */
export async function POST(request: Request) {
  let body: { code?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const plain = String(body?.code ?? "").trim();
  if (!plain) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  if (!isValidEmployeePortalCode(plain)) {
    return NextResponse.json({ error: "invalid_format" }, { status: 400 });
  }

  const gateDept = readGateDepartment();
  if (gateDept === undefined) {
    return NextResponse.json({ error: "needs_department_gate" }, { status: 403 });
  }

  const requiredDept = gateDept === "bypass" ? undefined : gateDept;

  /** معاينة محلية بدون اتصال بقاعدة حقيقية — لا يحتاج مفاتيح Supabase. */
  if (isPreviewMode()) {
    const res = NextResponse.json({
      ok: true,
      redirectTo: requiredDept ? departmentHubPaths[requiredDept] : "/auth/redirect"
    });
    res.cookies.set("demo_role", process.env.DEMO_ROLE ?? "employee", {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
    if (requiredDept) {
      const demoId = "00000000-0000-0000-0000-000000000001";
      const t = createDeptSessionToken(demoId, requiredDept);
      res.cookies.set(departmentCookieName(requiredDept), t, deptSessionCookieBase);
    }
    clearGateCookie(res);
    return res;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "missing_service_role" }, { status: 500 });
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const h = hashEmployeePortalCode(plain);
  const { data: row, error: qErr } = await admin
    .from("employee_portal_codes")
    .select("user_id")
    .eq("code_hash", h)
    .maybeSingle();

  if (qErr) {
    return NextResponse.json(
      { error: "database_error", detail: qErr.message },
      { status: 500 }
    );
  }
  if (!row?.user_id) {
    return NextResponse.json({ error: "invalid_code" }, { status: 401 });
  }

  const { data: userData, error: adminErr } = await admin.auth.admin.getUserById(row.user_id);
  if (adminErr || !userData?.user?.email) {
    return NextResponse.json({ error: "invalid_code" }, { status: 401 });
  }

  if (requiredDept) {
    const { data: profile } = await admin.from("users").select("role").eq("id", row.user_id).maybeSingle();
    const meta = userData.user.user_metadata as Record<string, unknown> | undefined;
    const metaRole = meta?.role;
    const elevated =
      profile?.role === "super_admin" ||
      profile?.role === "manager" ||
      metaRole === "super_admin" ||
      metaRole === "manager";
    const empDept = meta?.employee_department;
    if (
      !elevated &&
      typeof empDept === "string" &&
      isDepartmentKey(empDept) &&
      empDept !== requiredDept
    ) {
      return NextResponse.json(
        {
          error: "employee_wrong_department",
          detail: "الرمز لا يطابق قسم الدخول الحالي. استخدم الرمز الصادر لك لهذا القسم."
        },
        { status: 403 }
      );
    }
  }

  const email = userData.user.email;

  let response = NextResponse.json({
    ok: true,
    redirectTo: requiredDept ? departmentHubPaths[requiredDept] : "/auth/redirect"
  });

  const cookieStore = cookies();
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const { error: signErr } = await supabase.auth.signInWithPassword({
    email,
    password: plain
  });

  if (signErr) {
    return NextResponse.json(
      {
        error: "password_mismatch",
        detail: signErr.message
      },
      { status: 401 }
    );
  }

  if (requiredDept) {
    const deptTok = createDeptSessionToken(row.user_id, requiredDept);
    response.cookies.set(departmentCookieName(requiredDept), deptTok, deptSessionCookieBase);
  }

  clearGateCookie(response);
  return response;
}
