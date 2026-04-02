"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (password.length < 4) {
      setError("كلمة المرور يجب أن تكون 4 أحرف على الأقل.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/public-auth/register-email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        password,
        emailRedirectTo: `${window.location.origin}/register/profile`
      })
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    setLoading(false);

    if (!res.ok) {
      setError(data.message ?? "تعذر إنشاء الحساب.");
      return;
    }
    setSuccess("تم إنشاء الحساب وإرسال رابط تأكيد إلى بريدك الإلكتروني.");
  }

  return (
    <div className="mx-auto max-w-md space-y-5 px-4 py-8">
      <h1 className="text-center text-2xl font-extrabold text-ink-900">إنشاء حساب جديد</h1>
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-ink-900/10 bg-white p-5 shadow-sm">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-900/80">البريد الإلكتروني</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-ink-900/15 px-3 py-2 outline-none focus:border-brand-400"
            placeholder="name@example.com"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-900/80">كلمة المرور</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-ink-900/15 px-3 py-2 outline-none focus:border-brand-400"
            placeholder="كلمة المرور"
            required
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {success ? (
          <p className="text-sm text-emerald-700">
            {success} بعد التأكيد انتقل إلى{" "}
            <Link href="/register/profile" className="font-semibold underline">
              صفحة إكمال البيانات
            </Link>
            .
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brand-500 px-4 py-2 font-bold text-white hover:bg-brand-400 disabled:opacity-60"
        >
          {loading ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب"}
        </button>
      </form>
    </div>
  );
}
