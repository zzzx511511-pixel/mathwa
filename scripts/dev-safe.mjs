/**
 * التطوير الآمن على ويندوز: نسخ تلقائي إلى مجلد محلي عند الحاجة ثم `next dev`.
 * يُمكن تغيير الوجهة: set MATHWA_DEV_DIR=D:\work\mathwa
 */
import { spawnSync, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { badWindowsProjectPath, getLocalDevRoot } from "./lib/dev-path.mjs";
import { robocopyProjectExcludingDeps } from "./lib/robocopy-project.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const PORT = process.env.PORT?.trim() || "3000";

function robocopySync(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  // IMPORTANT:
  // `robocopy /E` لا يحذف الملفات التي تم حذفها من المصدر، وهذا يسبب تعارض مسارات (route groups)
  // داخل `C:\dev\mathwa` بعد تغييرات مثل حذف/نقل صفحات من `app/`.
  // لذلك ننظّف `app/` فقط قبل النسخ (بدون لمس node_modules).
  const destApp = path.join(dest, "app");
  if (fs.existsSync(destApp)) {
    try {
      fs.rmSync(destApp, { recursive: true, force: true });
    } catch (e) {
      console.error(e instanceof Error ? e.message : e);
      console.error("[مثوى] تعذّر تنظيف مجلد app في الوجهة قبل النسخ.");
      process.exit(1);
    }
  }
  try {
    robocopyProjectExcludingDeps(src, dest);
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    console.error("[مثوى] فشل النسخ. تحقق من الصلاحيات أو عيّن MATHWA_DEV_DIR لمسار آخر.");
    process.exit(1);
  }
  if (!fs.existsSync(path.join(dest, "package.json"))) {
    console.error("[مثوى] فشل النسخ (لا package.json في الوجهة).");
    process.exit(1);
  }
}

function syncToLocal(localRoot) {
  console.log("[مثوى] نسخ المشروع إلى مسار آمن للتطوير:\n  " + localRoot + "\n");
  robocopySync(root, localRoot);
  const nextReady = fs.existsSync(path.join(localRoot, "node_modules", "next"));
  if (!nextReady) {
    console.log("[مثوى] npm install …\n");
    execSync("npm install", { cwd: localRoot, stdio: "inherit", shell: true });
  } else {
    console.log("[مثوى] تخطّي npm install (موجود node_modules).\n");
  }
  return localRoot;
}

function runNext(cwd) {
  const win = process.platform === "win32";
  const nextCli = path.join(cwd, "node_modules", ".bin", win ? "next.cmd" : "next");
  const result = fs.existsSync(nextCli)
    ? spawnSync(nextCli, ["dev", "-p", PORT], {
        cwd,
        stdio: "inherit",
        shell: win,
        env: { ...process.env, PORT }
      })
    : spawnSync(win ? "npx.cmd" : "npx", ["next", "dev", "-p", PORT], {
        cwd,
        stdio: "inherit",
        shell: true,
        env: { ...process.env, PORT }
      });
  process.exit(result.status === null ? 1 : result.status);
}

const localRoot = getLocalDevRoot();
let cwd = root;
if (badWindowsProjectPath(root)) {
  cwd = syncToLocal(localRoot);
  console.log("[مثوى] افتح: http://localhost:" + PORT + "\n");
}
runNext(cwd);
