import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/salsabeel/admin-auth";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const BUCKET       = "place-photos";

const headers = {
  apikey:          SUPABASE_KEY,
  Authorization:   `Bearer ${SUPABASE_KEY}`,
  "Content-Type":  "application/json",
};

async function listFolders(): Promise<string[]> {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ prefix: "", limit: 1000, sortBy: { column: "name", order: "asc" } }),
  });
  if (!res.ok) throw new Error(`list root: ${res.status}`);
  const items: { name: string; id: string | null }[] = await res.json();
  return items.filter((i) => i.id === null && i.name).map((i) => i.name);
}

async function listFiles(folder: string): Promise<string[]> {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ prefix: `${folder}/`, limit: 100, sortBy: { column: "name", order: "asc" } }),
  });
  if (!res.ok) return [];
  const items: { name: string }[] = await res.json();
  return items.map((f) => f.name).filter(Boolean);
}

async function deleteFiles(paths: string[]): Promise<boolean> {
  if (!paths.length) return true;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}`, {
    method: "DELETE",
    headers,
    body: JSON.stringify({ prefixes: paths }),
  });
  return res.ok;
}

const isLegacyGid = (n: string) => n.startsWith(".gid-") && !/-\d+$/.test(n);
const isValidGid  = (n: string) => n.startsWith(".gid-") && /-\d+$/.test(n);
const isPhoto     = (n: string) => /^photo_\d+\.(jpg|jpeg|png|webp)$/i.test(n);

type FolderEntry = { folder: string; toDelete: string[] };

async function scan(): Promise<{ folders: string[]; caseA: FolderEntry[]; caseB: FolderEntry[] }> {
  const folders = await listFolders();
  const caseA: FolderEntry[] = [];
  const caseB: FolderEntry[] = [];

  // Process in parallel batches of 20 to stay fast without overloading Supabase.
  const BATCH = 20;
  for (let i = 0; i < folders.length; i += BATCH) {
    const batch = folders.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(async (folder) => ({ folder, files: await listFiles(folder) }))
    );
    for (const { folder, files } of results) {
      const legacyGids = files.filter(isLegacyGid);
      const validGids  = files.filter(isValidGid);
      const hasSkip    = files.includes(".skip");
      if (!legacyGids.length) continue;
      if (validGids.length) {
        caseB.push({ folder, toDelete: legacyGids });
      } else if (!hasSkip) {
        caseA.push({ folder, toDelete: files.filter((n) => isPhoto(n) || isLegacyGid(n)) });
      }
    }
  }
  return { folders, caseA, caseB };
}

// GET → dry-run scan, returns full details for preview.
export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();
  if (!SUPABASE_URL || !SUPABASE_KEY)
    return NextResponse.json({ error: "Supabase env vars not configured" }, { status: 500 });
  try {
    const { folders, caseA, caseB } = await scan();
    return NextResponse.json({ folders_scanned: folders.length, case_a: caseA, case_b: caseB });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// POST → apply cleanup (delete legacy sentinels + stale photos).
export async function POST(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();
  if (!SUPABASE_URL || !SUPABASE_KEY)
    return NextResponse.json({ error: "Supabase env vars not configured" }, { status: 500 });
  try {
    const { folders, caseA, caseB } = await scan();
    let cleaned = 0;
    let failed  = 0;
    for (const { folder, toDelete } of [...caseA, ...caseB]) {
      const ok = await deleteFiles(toDelete.map((n) => `${folder}/${n}`));
      if (ok) cleaned++; else failed++;
    }
    return NextResponse.json({
      folders_scanned: folders.length,
      case_a_count: caseA.length,
      case_b_count: caseB.length,
      cleaned,
      failed,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
