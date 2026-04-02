import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type Body = {
  ownerId?: unknown;
  archived?: unknown;
};

function asText(v: unknown): string {
  return String(v ?? "").trim();
}

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const ownerId = asText(body.ownerId);
  const archived = body.archived !== false;
  if (!ownerId) {
    return NextResponse.json({ ok: false, error: "owner_id مطلوب." }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const db = url && serviceKey
    ? createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : getSupabaseServerClient();

  const nowIso = new Date().toISOString();
  const payloads = archived
    ? [
        { archived: true, is_archived: true, archived_at: nowIso },
        { archived: true, is_archived: true },
        { archived: true, archived_at: nowIso },
        { is_archived: true, archived_at: nowIso },
        { archived: true },
        { is_archived: true }
      ]
    : [
        { archived: false, is_archived: false, archived_at: null },
        { archived: false, is_archived: false },
        { archived: false, archived_at: null },
        { is_archived: false, archived_at: null },
        { archived: false },
        { is_archived: false }
      ];

  let data: Record<string, unknown> | null = null;
  let updateError: string | null = null;
  for (const payload of payloads) {
    const { data: row, error } = await db.from("owners").update(payload).eq("id", ownerId).select("*").maybeSingle();
    if (!error) {
      data = (row as Record<string, unknown>) ?? null;
      updateError = null;
      break;
    }
    updateError = error.message;
  }
  if (updateError) {
    return NextResponse.json({ ok: false, error: `archive_update_failed: ${updateError}` }, { status: 500 });
  }

  // Cascade to properties if the archived column exists.
  const { error: propArchiveError } = await db.from("properties").update({ archived }).eq("owner_id", ownerId);
  if (propArchiveError) {
    // keep flow working when properties.archived doesn't exist yet
    await db.from("properties").update({ status: archived ? "archived" : "vacant" }).eq("owner_id", ownerId);
  }

  return NextResponse.json({ ok: true, owner: data });
}

