"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ACCESS_CODE_LENGTH, normalizeAccessCodeInput } from "@/lib/auth/access-code";
import { BackButton } from "@/components/layout/back-button";

interface AccessCodeLoginFormProps {
  backFallbackHref?: string;
}

export function AccessCodeLoginForm({ backFallbackHref = "/" }: AccessCodeLoginFormProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const normalized = normalizeAccessCodeInput(code);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalized })
      });
      const j = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        redirectTo?: string;
        message?: string;
        error?: string;
      };
      if (!res.ok || !j.ok) {
        setError(j.message ?? "الرمز غير صحيح، حاول مرة أخرى.");
        return;
      }
      const dest = j.redirectTo && j.redirectTo.startsWith("/") ? j.redirectTo : "/auth/redirect";
      router.replace(dest);
      router.refresh();
    } catch {
      setError("تعذّر الاتصال بالخادم.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-gold-400/35 bg-gradient-to-br from-[#2f160f] to-[#1a0f0a] p-6 text-white shadow-lg">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-extrabold text-gold-300">شاشة الدخول الرئيسية</h2>
        <BackButton fallbackHref={backFallbackHref} />
      </div>
      <p className="text-sm leading-relaxed text-white/85">
        أدخل <strong>الرمز التعريفي</strong> المكوّن من {ACCESS_CODE_LENGTH} أرقام — دون اسم مستخدم أو كلمة مرور
        إضافية. يُوجَّه النظام تلقائياً للبوابة المناسبة (موظف / مالك / عميل).
      </p>

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="access-code" className="mb-1 block text-sm font-semibold text-gold-200/95">
            الرمز التعريفي ({ACCESS_CODE_LENGTH} أرقام)
          </label>
          <input
            id="access-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={ACCESS_CODE_LENGTH}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, ACCESS_CODE_LENGTH))}
            className="w-full rounded-xl border-2 border-gold-400/50 bg-white/95 px-4 py-3 text-center font-mono text-2xl tracking-[0.4em] text-ink-900 outline-none focus:border-gold-300"
            placeholder="••••••"
            required
            dir="ltr"
          />
        </div>

        {error ? (
          <p className="rounded-lg border border-red-400/40 bg-red-950/40 px-3 py-2 text-sm text-red-100">
            {error}
          </p>
        ) : null}

        <p className="text-[11px] leading-relaxed text-white/55">
          3 محاولات فاشلة متتالية قد تجمّد الرمز مؤقتاً ويُشعَر المدير (بعد تفعيل الأعمدة في قاعدة البيانات).
        </p>

        <button
          type="submit"
          disabled={loading || code.length !== ACCESS_CODE_LENGTH}
          className="w-full rounded-xl bg-gold-500 py-3 text-sm font-bold text-[#2f160f] shadow-md transition hover:bg-gold-400 disabled:opacity-50"
        >
          {loading ? "جاري التحقق…" : "دخول"}
        </button>
      </form>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-white/75">
        <p className="mb-2 font-bold text-gold-200/90">بعد التحقق من الرمز</p>
        <ul className="space-y-1.5">
          <li>
            👤 <strong>موظف / مدير</strong> — بوابة جميع الأقسام (مثل إدارة الأملاك)
          </li>
          <li>
            🏢 <strong>مالك</strong> — بوابة المالك (عقاراته وعقوده)
          </li>
          <li>
            👥 <strong>عميل</strong> — بوابة العميل (عقوده وطلباته)
          </li>
        </ul>
      </div>

      <p className="mt-4 text-center text-sm text-white/70">
        <Link href="/login?legacy=1" className="font-semibold text-gold-300 underline hover:text-white">
          دخول بالبريد وكلمة المرور (قديم)
        </Link>
      </p>
    </section>
  );
}
