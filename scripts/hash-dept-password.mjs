/**
 * توليد password_hash لجدول department_portal_accounts (نفس خوارزمية lib/employee/department-gate-password.ts)
 * الاستخدام: node scripts/hash-dept-password.mjs "كلمة-المرور"
 */
import { randomBytes, scryptSync } from "node:crypto";

function hashDepartmentGatePassword(plain) {
  const salt = randomBytes(16);
  const hash = scryptSync(plain, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

const p = process.argv[2];
if (!p) {
  console.error("الاستخدام: node scripts/hash-dept-password.mjs \"كلمة-المرور\"");
  process.exit(1);
}
console.log(hashDepartmentGatePassword(p));
