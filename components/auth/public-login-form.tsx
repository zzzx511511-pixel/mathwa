"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "login" | "signup";
type PublicRole = "owner" | "client";

export function PublicLoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<PublicRole>("client");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const url = mode === "signup" ? "/api/public-auth/signup" : "/api/public-auth/login";
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fullName, username, password, role })
    });
    const j = (await res.json().catch(() => ({}))) as { message?: string; redirectTo?: string };
    setLoading(false);
    if (!res.ok) {
      setError(j.message ?? "تعذّر تسجيل الدخول.");
      return;
    }
    router.replace(j.redirectTo ?? "/");
    router.refresh();
  }

  return (
    <section className="mx-auto max-w-md rounded-2xl border border-gold-400 bg-white p-6 shadow-sm">
      <div className="mb-4 flex gap-2 rounded-lg bg-brand-100 p-1">
        <button type="button" onClick={() => setMode("login")} className={`flex-1 rounded-md px-3 py-2 text-sm font-bold ${mode === "login" ? "bg-white text-brand-500" : "text-ink-900/75"}`}>دخول</button>
        <button type="button" onClick={() => setMode("signup")} className={`flex-1 rounded-md px-3 py-2 text-sm font-bold ${mode === "signup" ? "bg-white text-brand-500" : "text-ink-900/75"}`}>إنشاء حساب</button>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        {mode === "signup" ? (
          <>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">الاسم</span>
              <input className="w-full rounded-md border border-ink-900/15 px-3 py-2" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">نوع الحساب</span>
              <select className="w-full rounded-md border border-ink-900/15 px-3 py-2" value={role} onChange={(e) => setRole(e.target.value as PublicRole)}>
                <option value="owner">مالك</option>
                <option value="client">عميل</option>
              </select>
            </label>
          </>
        ) : null}
        <label className="block">
          <span className="mb-1 block text-sm font-medium">اسم المستخدم</span>
          <input className="w-full rounded-md border border-ink-900/15 px-3 py-2" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">كلمة المرور</span>
          <input className="w-full rounded-md border border-ink-900/15 px-3 py-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <button disabled={loading} className="w-full rounded-md bg-brand-500 px-4 py-2 font-bold text-white disabled:opacity-60" type="submit">
          {loading ? "جارٍ التنفيذ..." : mode === "signup" ? "إنشاء الحساب" : "تسجيل الدخول"}
        </button>
      </form>
    </section>
  );
}
