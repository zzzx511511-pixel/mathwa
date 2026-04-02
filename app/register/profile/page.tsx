"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";

type AccountRole = "owner" | "client";

export default function RegisterProfilePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<AccountRole>("client");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const href = window.location.href;
    const url = new URL(href);
    const code = url.searchParams.get("code");
    const tokenHash = url.searchParams.get("token_hash");
    const type = url.searchParams.get("type");
    if (code) {
      supabaseClient.auth.exchangeCodeForSession(code).catch(() => {
        // ignore; submit flow below will report auth issue if still missing
      });
      return;
    }
    if (tokenHash && type) {
      supabaseClient.auth
        .verifyOtp({
          token_hash: tokenHash,
          type: type as "signup" | "email_change" | "recovery" | "invite" | "magiclink"
        })
        .catch(() => {
          // ignore; submit flow below will report auth issue if still missing
        });
    }
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!username.trim()) {
      setError("اسم المستخدم مطلوب.");
      return;
    }

    setLoading(true);
    const {
      data: { session }
    } = await supabaseClient.auth.getSession();
    const res = await fetch("/api/public-auth/complete-profile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      ...(session?.access_token
        ? { headers: { "content-type": "application/json", authorization: `Bearer ${session.access_token}` } }
        : {}),
      body: JSON.stringify({ username: username.trim(), role })
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string; redirectTo?: string };
    setLoading(false);
    if (!res.ok) {
      setError(data.message ?? "تعذر حفظ البيانات.");
      return;
    }
    router.replace(data.redirectTo ?? (role === "owner" ? "/owner/properties" : "/client/contracts"));
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md space-y-5 px-4 py-8">
      <h1 className="text-center text-2xl font-extrabold text-ink-900">إكمال التسجيل</h1>
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-ink-900/10 bg-white p-5 shadow-sm">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-900/80">اسم المستخدم</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-md border border-ink-900/15 px-3 py-2 outline-none focus:border-brand-400"
            placeholder="اسم المستخدم"
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-900/80">نوع الحساب</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AccountRole)}
            className="w-full rounded-md border border-ink-900/15 px-3 py-2 outline-none focus:border-brand-400"
          >
            <option value="owner">مالك</option>
            <option value="client">عميل</option>
          </select>
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brand-500 px-4 py-2 font-bold text-white hover:bg-brand-400 disabled:opacity-60"
        >
          {loading ? "جارٍ الحفظ..." : "حفظ والمتابعة"}
        </button>
      </form>
    </div>
  );
}
