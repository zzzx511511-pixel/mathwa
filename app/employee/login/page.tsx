"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

function normalizeCodeInput(input: string): string {
  return input
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/\D/g, "")
    .slice(0, 6);
}

export default function EmployeeLoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/employee/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code })
    });

    const data = (await res.json().catch(() => ({}))) as { message?: string; redirectTo?: string };
    setLoading(false);

    if (!res.ok) {
      setError(data.message ?? "الرمز غير صحيح.");
      return;
    }

    router.replace(data.redirectTo ?? "/employee/estates");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md space-y-5 px-4 py-8">
      <h1 className="text-center text-2xl font-extrabold text-ink-900">بوابة الموظفين</h1>
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-ink-900/10 bg-white p-5 shadow-sm">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-900/80">الرمز التعريفي (6 أرقام)</span>
          <input
            type="text"
            name="employee_code"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(normalizeCodeInput(e.target.value))}
            className="w-full rounded-md border border-ink-900/15 px-3 py-2 font-mono outline-none focus:border-brand-400"
            placeholder="123456"
            required
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brand-500 px-4 py-2 font-bold text-white hover:bg-brand-400 disabled:opacity-60"
        >
          {loading ? "جارٍ الدخول..." : "دخول"}
        </button>
      </form>
    </div>
  );
}
