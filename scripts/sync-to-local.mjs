/**
 * نسخ المشروع إلى مجلد التطوير المحلي فقط (بدون تشغيل السيرفر).
 * الوجهة: MATHWA_DEV_DIR أو C:\dev\mathwa
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { badWindowsProjectPath, getLocalDevRoot } from "./lib/dev-path.mjs";
import { robocopyProjectExcludingDeps } from "./lib/robocopy-project.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dest = getLocalDevRoot();

if (!badWindowsProjectPath(root)) {
  console.log("[مثوى] المسار الحالي مناسب؛ لا حاجة للنسخ. المجلد:\n  " + root);
  process.exit(0);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
console.log("[مثوى] من:\n  " + root + "\nإلى:\n  " + dest + "\n");

try {
  robocopyProjectExcludingDeps(root, dest);
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
}

if (!fs.existsSync(path.join(dest, "package.json"))) {
  console.error("[مثوى] فشل النسخ.");
  process.exit(1);
}

const nextReady = fs.existsSync(path.join(dest, "node_modules", "next"));
if (!nextReady) {
  console.log("[مثوى] npm install …\n");
  execSync("npm install", { cwd: dest, stdio: "inherit", shell: true });
}

console.log("[مثوى] تم. افتح المشروع من:\n  " + dest);
