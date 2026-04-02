import { createHmac, timingSafeEqual } from "crypto";
import type { DepartmentKey } from "./department-keys";

const COOKIE_NAME = "mw_employee_dept_gate";

function secret(): string {
  return (
    process.env.EMPLOYEE_DEPT_GATE_SECRET ||
    process.env.DEPARTMENT_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 32) ||
    "mw-dev-emp-gate-change-me"
  );
}

export { COOKIE_NAME as EMPLOYEE_DEPT_GATE_COOKIE_NAME };

/** بعد التحقق من بريد/كلمة مرور القسم — يسمح بالخطوة الثانية (الرمز الشخصي) */
export function createEmployeeDeptGateToken(department: DepartmentKey): string {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 8;
  const payload = `${department}|${exp}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return Buffer.from(`${payload}|${sig}`, "utf8").toString("base64url");
}

export function parseEmployeeDeptGateToken(token: string): DepartmentKey | null {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const lastSep = raw.lastIndexOf("|");
    if (lastSep === -1) return null;
    const sig = raw.slice(lastSep + 1);
    const payload = raw.slice(0, lastSep);
    const parts = payload.split("|");
    if (parts.length !== 2) return null;
    const [department, exp] = parts;
    if (Number(exp) < Date.now() / 1000) return null;
    const expected = createHmac("sha256", secret()).update(payload).digest("hex");
    if (sig.length !== expected.length) return null;
    if (!timingSafeEqual(Buffer.from(sig, "utf8"), Buffer.from(expected, "utf8"))) return null;
    return department as DepartmentKey;
  } catch {
    return null;
  }
}
