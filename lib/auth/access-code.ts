/** مواصفة مثوى: رمز تعريفي من 6 أرقام فقط */
export const ACCESS_CODE_LENGTH = 6;

export function normalizeAccessCodeInput(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .replace(/\s+/g, "");
}

export function isValidAccessCode(plain: string): boolean {
  return new RegExp(`^\\d{${ACCESS_CODE_LENGTH}}$`).test(normalizeAccessCodeInput(plain));
}
