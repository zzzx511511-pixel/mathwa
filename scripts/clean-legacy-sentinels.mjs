#!/usr/bin/env node
/**
 * clean-legacy-sentinels.mjs
 *
 * Scans every folder in Supabase Storage bucket "place-photos" and fixes
 * folders that have a legacy .gid-* sentinel (no count suffix).
 *
 * Two cleanup modes per folder:
 *   CASE A — only legacy sentinel, no valid sentinel (.gid-*-N):
 *            Delete all photos + legacy sentinel so the place auto-refetches
 *            correct photos from Google on the next page visit.
 *
 *   CASE B — both legacy AND valid sentinel (.gid-*-N):
 *            Delete only the legacy sentinel; photos and valid sentinel stay.
 *            The system already works correctly here (new code prefers the
 *            valid sentinel), this just removes the dead weight.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... \
 *   node scripts/clean-legacy-sentinels.mjs
 *
 *   Add --dry-run to preview without making any changes.
 */

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const BUCKET       = "place-photos";
const DRY_RUN      = process.argv.includes("--dry-run");

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌  Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  process.exit(1);
}

const apiHeaders = {
  apikey:        SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** List top-level "folders" (place IDs) in the bucket. */
async function listFolders() {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
    method: "POST",
    headers: apiHeaders,
    body: JSON.stringify({
      prefix:  "",
      limit:   1000,
      sortBy:  { column: "name", order: "asc" },
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Failed to list root: HTTP ${res.status} — ${txt}`);
  }
  const items = await res.json();
  // Supabase returns folders as items with id === null
  return items
    .filter((item) => item.id === null && item.name)
    .map((item) => item.name);
}

/** List all files inside a folder (returns file names only, no folder prefix). */
async function listFiles(folder) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
    method: "POST",
    headers: apiHeaders,
    body: JSON.stringify({
      prefix:  `${folder}/`,
      limit:   100,
      sortBy:  { column: "name", order: "asc" },
    }),
  });
  if (!res.ok) return [];
  const items = await res.json();
  return items.map((f) => f.name).filter(Boolean);
}

/** Delete specific files (array of full storage paths, e.g. "c104/photo_0.jpg"). */
async function deleteFiles(paths) {
  if (!paths.length) return true;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}`, {
    method:  "DELETE",
    headers: apiHeaders,
    body:    JSON.stringify({ prefixes: paths }),
  });
  return res.ok;
}

const isLegacyGid = (name) => name.startsWith(".gid-") && !/-\d+$/.test(name);
const isValidGid  = (name) => name.startsWith(".gid-") && /-\d+$/.test(name);
const isPhoto     = (name) => /^photo_\d+\.(jpg|jpeg|png|webp)$/i.test(name);

async function main() {
  console.log(DRY_RUN ? "🔍  DRY RUN — no changes will be made\n" : "");

  // ── 1. Discover folders ─────────────────────────────────────────────
  process.stdout.write("Listing top-level folders... ");
  const folders = await listFolders();
  console.log(`${folders.length} found\n`);

  // ── 2. Scan each folder ─────────────────────────────────────────────
  const caseA = []; // only legacy, no valid sentinel → delete photos + legacy
  const caseB = []; // both → delete legacy sentinel only

  for (let i = 0; i < folders.length; i++) {
    const folder = folders[i];
    const files  = await listFiles(folder);
    await sleep(40); // stay well under Supabase rate limits

    const legacyGids = files.filter(isLegacyGid);
    const validGids  = files.filter(isValidGid);
    const hasSkip    = files.includes(".skip");

    if (!legacyGids.length) continue; // nothing to do

    if (validGids.length) {
      // Case B: both exist — just remove legacy dead weight
      caseB.push({ folder, toDelete: legacyGids });
    } else if (!hasSkip) {
      // Case A: only legacy, no valid sentinel, no .skip
      // Delete photos + legacy so next visit triggers a fresh Google fetch
      const toDelete = files.filter((n) => isPhoto(n) || isLegacyGid(n));
      caseA.push({ folder, toDelete, files });
    }
    // If hasSkip → admin explicitly disabled fetching → leave it alone

    if ((i + 1) % 50 === 0) {
      console.log(`  Scanned ${i + 1} / ${folders.length}...`);
    }
  }

  console.log("\n──────────────────────────────────────");
  console.log(`Scan complete — ${folders.length} folders checked`);
  console.log(`  Case A (stale photos, no valid sentinel): ${caseA.length} folder(s)`);
  console.log(`  Case B (both sentinels, remove legacy):   ${caseB.length} folder(s)`);
  console.log("──────────────────────────────────────\n");

  if (!caseA.length && !caseB.length) {
    console.log("✅  No cleanup needed. All folders are already in good shape.");
    return;
  }

  // ── 3. Preview ──────────────────────────────────────────────────────
  if (caseA.length) {
    console.log("CASE A — will delete all photos + legacy sentinel:");
    for (const { folder, toDelete } of caseA) {
      console.log(`  ${folder}/  →  ${toDelete.join(", ")}`);
    }
    console.log("");
  }

  if (caseB.length) {
    console.log("CASE B — will delete legacy sentinel only (photos kept):");
    for (const { folder, toDelete } of caseB) {
      console.log(`  ${folder}/  →  ${toDelete.join(", ")}`);
    }
    console.log("");
  }

  if (DRY_RUN) {
    console.log("⚠️   DRY RUN — run without --dry-run to apply the above changes.");
    return;
  }

  // ── 4. Apply ────────────────────────────────────────────────────────
  console.log("🗑️   Applying cleanup...\n");

  let cleaned = 0;
  let failed  = 0;

  for (const { folder, toDelete } of [...caseA, ...caseB]) {
    const paths = toDelete.map((n) => `${folder}/${n}`);
    const ok    = await deleteFiles(paths);
    await sleep(60);

    if (ok) {
      console.log(`  ✅  ${folder}/  (${toDelete.length} file(s) removed)`);
      cleaned++;
    } else {
      console.log(`  ❌  ${folder}/  (delete request failed — try again manually)`);
      failed++;
    }
  }

  // ── 5. Summary ──────────────────────────────────────────────────────
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊  Summary
    Folders scanned :  ${folders.length}
    Case A cleaned  :  ${caseA.filter((_, i) => i < cleaned - caseB.length).length} / ${caseA.length}  (photos + sentinel removed)
    Case B cleaned  :  ${Math.max(0, cleaned - caseA.length)} / ${caseB.length}  (legacy sentinel only removed)
    Failed          :  ${failed}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${failed === 0 ? "✅  All done." : "⚠️   Some deletions failed — check output above."}

Case A places will automatically re-fetch correct photos from Google
the next time their page is opened (using the saved googlePlaceId).
Case B places already serve correct photos — legacy files removed.
`);
}

main().catch((err) => {
  console.error("\nFatal error:", err.message);
  process.exit(1);
});
