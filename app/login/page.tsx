 "use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/public-auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string; redirectTo?: string };
    setLoading(false);
    if (!res.ok) {
      setError(data.message ?? "بيانات الدخول غير صحيحة.");
      return;
    }
    router.replace(data.redirectTo ?? "/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md space-y-5 px-4 py-8">
      <h1 className="text-center text-2xl font-extrabold text-ink-900">تسجيل الدخول</h1>
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-ink-900/10 bg-white p-5 shadow-sm">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-900/80">اسم المستخدم</span>
          <input
            type="text"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-md border border-ink-900/15 px-3 py-2 outline-none focus:border-brand-400"
            placeholder="اسم المستخدم"
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-900/80">كلمة المرور</span>
          <input
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-ink-900/15 px-3 py-2 outline-none focus:border-brand-400"
            placeholder="كلمة المرور"
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
      <p className="text-center text-sm text-ink-900/70">
        ليس لديك حساب؟{" "}
        <Link href="/register" className="font-semibold text-brand-500 hover:underline">
          إنشاء حساب جديد
        </Link>
      </p>
    </div>
  );
}
