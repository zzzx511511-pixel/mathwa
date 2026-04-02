import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function isArchived(row: Record<string, unknown>): boolean {
  return Boolean(row.archived || row.is_archived || row.archived_at);
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ ok: false, error: "missing_supabase_service_role_key" }, { status: 500 });
  }

  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.from("owners").select("id, full_name, phone, email, archived, is_archived, archived_at").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const owners = (data ?? [])
    .map((o) => o as Record<string, unknown>)
    .filter((o) => !isArchived(o))
    .map((o) => ({
      id: String(o.id ?? ""),
      full_name: String(o.full_name ?? "").trim() || "—",
      phone: String(o.phone ?? "").trim() || "",
      email: String(o.email ?? "").trim() || ""
    }))
    .filter((o) => o.id);

  return NextResponse.json({ ok: true, owners });
}

