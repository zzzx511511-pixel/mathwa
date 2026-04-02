/**
 * يشغّل `npm run dev` ثم يراقب المنفذ حتى يصبح Next جاهزاً،
 * ويفتح المتصفح الافتراضي على صفحة الموظفين (معاينة فورية).
 * الاستخدام: npm run dev:preview
 */
import { spawn, exec } from "node:child_process";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const port = process.env.PORT?.trim() || "3000";
const previewPath = "/employee";

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const child = spawn(npmCmd, ["run", "dev"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, PORT: port }
});

function probe() {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}`, { timeout: 2000 }, (res) => {
      res.resume();
      resolve(true);
    });
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

function openBrowser(url) {
  if (process.platform === "win32") {
    exec(`start "" "${url}"`, { shell: true });
  } else if (process.platform === "darwin") {
    exec(`open "${url}"`);
  } else {
    exec(`xdg-open "${url}"`);
  }
}

let opened = false;

(async function waitAndOpen() {
  for (let i = 0; i < 180; i++) {
    if (await probe()) {
      if (!opened) {
        opened = true;
        const url = `http://127.0.0.1:${port}${previewPath}`;
        openBrowser(url);
        console.log(`\n[مثوى] تم فتح المعاينة في المتصفح: ${url}\n`);
      }
      return;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!opened) {
    console.log(
      `\n[مثوى] لم يستجب الخادم بعد انتظار طويل. جرّب يدوياً: http://127.0.0.1:${port}${previewPath}\n`
    );
  }
})();

child.on("exit", (code) => process.exit(code ?? 0));
