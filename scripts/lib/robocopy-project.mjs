/**
 * نسخ مجلد المشروع مع استثناءات ثقيلة (node_modules، .next، …).
 * على Windows، robocopy يعيد 0–7 عند اكتمال العملية بنجاح؛ 8+ يعني فشلاً.
 * (execSync يعتبر 1–7 «خطأ» لأنها ≠ 0 — لذلك لا نستخدمه.)
 */
import { spawnSync } from "node:child_process";

const ROBOCOPY_SUCCESS_MAX = 7;

export function robocopyProjectExcludingDeps(src, dest) {
  const result = spawnSync(
    "robocopy",
    [
      src,
      dest,
      "/E",
      "/XD",
      "node_modules",
      ".next",
      ".next-local",
      ".git",
      "/NFL",
      "/NDL",
      "/NJH",
      "/NJS"
    ],
    { stdio: "inherit", windowsHide: true }
  );
  const code = result.status;
  if (code === null) {
    throw new Error("robocopy: لم يُرجع رمز خروج");
  }
  if (code > ROBOCOPY_SUCCESS_MAX) {
    throw new Error(`robocopy فشل (رمز الخروج ${code})`);
  }
}
