/** طول رمز دخول بوابة الموظفين (أرقام فقط) */
export const EMPLOYEE_PORTAL_CODE_LENGTH = 4;

/** يقبل أربعة أرقام بالضبط، بدون مسافات */
export function isValidEmployeePortalCode(plain: string): boolean {
  return /^\d{4}$/.test(String(plain).trim());
}
