import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  let body: { fullName?: unknown; phone?: unknown; nationalId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const fullName = String(body?.fullName ?? "").trim();
  const phone = String(body?.phone ?? "").trim();
  const nationalId = String(body?.nationalId ?? "").trim();
  if (!fullName || !phone || !nationalId) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) {
    return NextResponse.json({ ok: false, error: "server_misconfigured: NEXT_PUBLIC_SUPABASE_URL غير مضبوط." }, { status: 500 });
  }

  // fallback بدون service role: نحاول حفظ سجل المالك مباشرة باستخدام جلسة السيرفر الحالية.
  if (!serviceKey) {
    try {
      const supabase = getSupabaseServerClient();
      const tryPayloads: Array<Record<string, unknown>> = [
        { full_name: fullName, phone, national_id: nationalId },
        { full_name: fullName, phone },
        { full_name: fullName }
      ];
      let lastError: string | null = null;
      for (const payload of tryPayloads) {
        const { data: createdOwner, error } = await supabase.from("owners").insert(payload).select("*").maybeSingle();
        if (!error) return NextResponse.json({ ok: true, owner: createdOwner });
        lastError = error.message;
      }
      return NextResponse.json({ ok: false, error: `owners_insert_failed: ${lastError ?? "unknown"}` }, { status: 500 });
    } catch (e) {
      const message = e instanceof Error ? e.message : "unknown_error";
      return NextResponse.json({ ok: false, error: `owners_insert_failed: ${message}` }, { status: 500 });
    }
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const normalizedPhone = phone.replace(/\D/g, "");
  const emailLocal = normalizedPhone || nationalId.replace(/\D/g, "") || Date.now().toString();
  const email = `owner_${emailLocal}_${Date.now()}@mathwa.local`;
  const tempPassword = randomBytes(12).toString("base64url");

  try {
    const { data: authCreated, error: authError } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { role: "owner", full_name: fullName, phone }
    });
    if (authError || !authCreated?.user?.id) {
      return NextResponse.json(
        { ok: false, error: `auth_create_failed: ${authError?.message ?? "unknown"}` },
        { status: 500 }
      );
    }
    const userId = authCreated.user.id;

    const { error: userUpsertError } = await admin.from("users").upsert(
      {
        id: userId,
        role: "owner",
        full_name: fullName,
        phone,
        is_active: true
      },
      { onConflict: "id" }
    );
    if (userUpsertError) {
      return NextResponse.json(
        { ok: false, error: `users_upsert_failed: ${userUpsertError.message}` },
        { status: 500 }
      );
    }

    // تأكد أن جدول owners موجود ويقبل الإدراج
    const tryPayloads: Array<Record<string, unknown>> = [
      { user_id: userId, full_name: fullName, phone, national_id: nationalId },
      { user_id: userId, full_name: fullName, phone },
      { user_id: userId, full_name: fullName },
      { user_id: userId }
    ];

    let ownersInsertError: string | null = null;
    for (const payload of tryPayloads) {
      const { data: createdOwner, error: insertError } = await admin.from("owners").insert(payload).select("*").maybeSingle();
      if (!insertError) {
        return NextResponse.json({ ok: true, owner: createdOwner });
      }
      ownersInsertError = insertError.message;
    }

    return NextResponse.json(
      {
        ok: false,
        error: `owners_insert_failed: ${ownersInsertError ?? "unknown"}`
      },
      { status: 500 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown_error";
    return NextResponse.json({ ok: false, error: `live_create_failed: ${message}` }, { status: 500 });
  }
}

