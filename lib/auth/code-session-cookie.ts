import { createHmac, timingSafeEqual } from "crypto";

const CODE_SESSION_COOKIE = "mw_code_session";

function secret(): string {
  return (
    process.env.DEPARTMENT_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 32) ||
    "mw-dev-code-secret-change-in-production"
  );
}

export function codeSessionCookieName() {
  return CODE_SESSION_COOKIE;
}

export function createCodeSessionToken(userId: string, role: string): string {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
  const payload = `${userId}|${role}|${exp}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return Buffer.from(`${payload}|${sig}`, "utf8").toString("base64url");
}

export function parseCodeSessionToken(token: string): { userId: string; role: string } | null {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const lastSep = raw.lastIndexOf("|");
    if (lastSep === -1) return null;
    const sig = raw.slice(lastSep + 1);
    const payload = raw.slice(0, lastSep);
    const expected = createHmac("sha256", secret()).update(payload).digest("hex");
    if (sig.length !== expected.length) return null;
    if (!timingSafeEqual(Buffer.from(sig, "utf8"), Buffer.from(expected, "utf8"))) return null;
    const [userId, role, exp] = payload.split("|");
    if (!userId || !role || !exp) return null;
    if (Number(exp) < Date.now() / 1000) return null;
    return { userId, role };
  } catch {
    return null;
  }
}
