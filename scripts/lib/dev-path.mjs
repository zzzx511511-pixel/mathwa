import path from "node:path";

/** مجلد التطوير المحلي الافتراضي (خارج OneDrive، مسار ASCII) */
export const DEFAULT_LOCAL_ROOT = path.join("C:", "dev", "mathwa");

export function getLocalDevRoot() {
  const raw = process.env.MATHWA_DEV_DIR?.trim();
  if (raw) return path.resolve(raw);
  return DEFAULT_LOCAL_ROOT;
}

/** مسارات تكسر Next.js على ويندوز (مزامنة OneDrive / أحرف عربية في المسار) */
export function badWindowsProjectPath(projectRoot) {
  if (process.platform !== "win32") return false;
  if (/OneDrive/i.test(projectRoot)) return true;
  if (/[\u0600-\u06FF]/.test(projectRoot)) return true;
  return false;
}
