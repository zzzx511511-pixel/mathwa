import { redirect } from "next/navigation";
import { getUserRole, type AppRole } from "@/lib/auth/get-user-role";

function isAllowed(role: AppRole | null, allowedRoles: AppRole[]) {
  if (!role) return false;
  return allowedRoles.includes(role);
}

/**
 * Server-side guard for route protection.
 *
 * NOTE: role mapping below assumes PRD-defined roles:
 * `super_admin / manager / employee / collector / client`
 */
export async function requireRole(
  allowedRoles: AppRole[],
  opts?: { redirectTo?: string }
) {
  const redirectTo = opts?.redirectTo ?? "/login";
  const role = await getUserRole();

  if (!isAllowed(role, allowedRoles)) {
    redirect(redirectTo);
  }
}

