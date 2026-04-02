import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { getLocalDevRoot } from "./lib/dev-path.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const tempCache = path.join(os.tmpdir(), "mathwa-next-cache");
const localNext = path.join(getLocalDevRoot(), ".next");

const dirs = [
  path.join(root, ".next"),
  path.join(root, ".next-local"),
  tempCache,
  localNext
];

for (const d of dirs) {
  try {
    fs.rmSync(d, { recursive: true, force: true });
    console.log("removed:", d);
  } catch (e) {
    const err = /** @type {NodeJS.ErrnoException} */ (e);
    if (err.code !== "ENOENT") throw err;
  }
}
