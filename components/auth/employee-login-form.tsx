"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "login" | "signup";

export function EmployeeLoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [fullName, setFullName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const url = mode === "signup" ? "/api/employee/auth/signup" : "/api/employee/auth/login";
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fullName, code })
    });
    const j = (await res.json().catch(() => ({}))) as { message?: string; redirectTo?: string };
    setLoading(false);
    if (!res.ok) {
      setError(j.message ?? "تعذّر تنفيذ العملية.");
      return;
    }
    router.replace(j.redirectTo ?? "/employee/dashboard");
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
          <label className="block">
            <span className="mb-1 block text-sm font-medium">الاسم</span>
            <input className="w-full rounded-md border border-ink-900/15 px-3 py-2" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </label>
        ) : null}
        <label className="block">
          <span className="mb-1 block text-sm font-medium">رمز الموظف (6 أرقام)</span>
          <input className="w-full rounded-md border border-ink-900/15 px-3 py-2 font-mono" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" pattern="\d{6}" required />
        </label>
        {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <button disabled={loading} className="w-full rounded-md bg-brand-500 px-4 py-2 font-bold text-white disabled:opacity-60" type="submit">
          {loading ? "جارٍ التنفيذ..." : mode === "signup" ? "إنشاء الحساب والدخول" : "دخول الموظف"}
        </button>
      </form>
    </section>
  );
}
