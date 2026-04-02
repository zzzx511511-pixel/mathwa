import { createHash } from "crypto";

/** يطابق دالة digest في docs/supabase-employee-portal-code.sql */
export function hashEmployeePortalCode(plain: string): string {
  return createHash("sha256").update(`MW_PORTAL_V1:${plain.trim()}`).digest("hex");
}
