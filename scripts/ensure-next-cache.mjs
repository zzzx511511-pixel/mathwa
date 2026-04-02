/**
 * ويندوز فقط: يربط مجلد `.next` داخل المشروع بـ `%TEMP%\mathwa-next-cache`
 * حتى لا يُكتب البناء داخل OneDrive/مسار عربي (يسبب EINVAL/readlink مع Next).
 * إذا فشل الربط، يُنشأ `.next` عاديًا داخل المشروع.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const linkPath = path.join(root, ".next");
const targetPath = path.join(os.tmpdir(), "mathwa-next-cache");

if (process.platform !== "win32") {
  process.exit(0);
}

fs.mkdirSync(targetPath, { recursive: true });

function isOurJunction() {
  if (!fs.existsSync(linkPath)) return false;
  try {
    const dest = fs.readlinkSync(linkPath);
    const resolved = path.isAbsolute(dest)
      ? dest
      : path.resolve(path.dirname(linkPath), dest);
    return path.resolve(resolved) === path.resolve(targetPath);
  } catch {
    return false;
  }
}

if (isOurJunction()) {
  process.exit(0);
}

if (fs.existsSync(linkPath)) {
  fs.rmSync(linkPath, { recursive: true, force: true });
}

try {
  execFileSync("cmd.exe", ["/c", "mklink", "/J", linkPath, targetPath], {
    stdio: "inherit",
    windowsHide: true
  });
} catch {
  fs.mkdirSync(linkPath, { recursive: true });
  console.warn(
    "[مثوى] تعذر ربط .next بمجلد Temp. إن استمرت أخطاء البناء، انقل المشروع خارج OneDrive (مثلاً C:\\dev\\mathwa)."
  );
}
