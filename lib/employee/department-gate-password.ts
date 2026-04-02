import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

/** تخزين آمن نسبياً بدون تبعيات إضافية: scrypt + ملح */
export function hashDepartmentGatePassword(plain: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(plain, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyDepartmentGatePassword(plain: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 2) return false;
  const [saltHex, hashHex] = parts;
  try {
    const salt = Buffer.from(saltHex, "hex");
    const hash = Buffer.from(hashHex, "hex");
    const test = scryptSync(plain, salt, 64);
    if (test.length !== hash.length) return false;
    return timingSafeEqual(test, hash);
  } catch {
    return false;
  }
}
