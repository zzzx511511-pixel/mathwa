import { createHmac, timingSafeEqual } from "crypto";
import type { DepartmentKey } from "./department-keys";

function secret(): string {
  return (
    process.env.DEPARTMENT_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 32) ||
    "mw-dev-dept-secret-change-in-production"
  );
}

export function departmentCookieName(department: DepartmentKey): string {
  return `mw_dept_${department}`;
}

/** جلسة موقّعة (30 يومًا) بعد التحقق من رقم التعريف */
export function createDeptSessionToken(userId: string, department: DepartmentKey): string {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;
  const payload = `${userId}|${department}|${exp}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return Buffer.from(`${payload}|${sig}`, "utf8").toString("base64url");
}

export function parseDeptSessionToken(
  token: string,
  department: DepartmentKey,
  userId: string
): boolean {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const lastSep = raw.lastIndexOf("|");
    if (lastSep === -1) return false;
    const sig = raw.slice(lastSep + 1);
    const payload = raw.slice(0, lastSep);
    const parts = payload.split("|");
    if (parts.length !== 3) return false;
    const [uid, dept, exp] = parts;
    if (uid !== userId || dept !== department) return false;
    if (Number(exp) < Date.now() / 1000) return false;
    const expected = createHmac("sha256", secret()).update(payload).digest("hex");
    if (sig.length !== expected.length) return false;
    return timingSafeEqual(Buffer.from(sig, "utf8"), Buffer.from(expected, "utf8"));
  } catch {
    return false;
  }
}
