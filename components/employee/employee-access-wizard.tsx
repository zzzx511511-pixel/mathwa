"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { EmployeeCodeEntryForm } from "@/components/employee/employee-code-entry-form";

type Step = "gateway" | "code";

type Props = {
  /** عند true: يُسمح بإدخال الرمز فقط (مثل EMPLOYEE_GATEWAY_DISABLED في الخادم) */
  skipGateway?: boolean;
};

export function EmployeeAccessWizard({ skipGateway = false }: Props) {
  const [step, setStep] = useState<Step>(skipGateway ? "code" : "gateway");
  const [departmentLabel, setDepartmentLabel] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [gatewaysError, setGatewaysError] = useState<string | null>(null);

  async function onGatewaySubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setGatewaysError(null);
    const res = await fetch("/api/employee/department-gateway-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ email: email.trim(), password })
    });
    setLoading(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string; detail?: string };
      if (j.error === "invalid_credentials") {
        setGatewaysError("البريد أو كلمة المرور غير صحيحة لهذا القسم.");
        return;
      }
      if (j.error === "database_error") {
        setGatewaysError(`قاعدة البيانات: ${j.detail ?? "أنشئ جدول department_portal_accounts (انظر docs)."}`);
        return;
      }
      if (j.error === "server_misconfigured") {
        setGatewaysError("الخادم غير مهيأ (Supabase / مفاتيح).");
        return;
      }
      setGatewaysError("تعذّر التحقق. حاول مرة أخرى.");
      return;
    }
    const data = (await res.json()) as { departmentLabel?: string };
    setDepartmentLabel(data.departmentLabel ?? null);
    setStep("code");
    setPassword("");
  }

  if (step === "code") {
    return (
      <div className="space-y-4">
        {skipGateway ? (
          <p className="rounded-xl border border-amber-200/70 bg-amber-50/80 px-4 py-3 text-center text-sm text-ink-900/80">
            بوابة القسم معطّلة على الخادم — أدخل رمزك التعريفي مباشرة.
          </p>
        ) : (
          <div className="rounded-xl border border-brand-200/80 bg-brand-50/60 px-4 py-3 text-center text-sm text-ink-900/85">
            <p className="font-semibold text-brand-500">
              الخطوة 2 — رمزك الشخصي
              {departmentLabel ? ` (${departmentLabel})` : null}
            </p>
            <p className="mt-1 text-ink-900/70">
              أدخل الرمز المكوّن من 4 أرقام الخاص بك فقط (يصدره المسؤول لحسابك).
            </p>
            <button
              type="button"
              onClick={() => {
                setStep("gateway");
                setDepartmentLabel(null);
              }}
              className="mt-2 text-xs font-medium text-brand-500 underline"
            >
              ← العودة لبريد القسم وكلمة المرور
            </button>
          </div>
        )}
        <EmployeeCodeEntryForm
          departmentContext={departmentLabel ?? undefined}
          onDepartmentGateRequired={() => setStep("gateway")}
        />
      </div>
    );
  }

  return (
    <form
      onSubmit={onGatewaySubmit}
      className="mx-auto max-w-md space-y-4 rounded-2xl border border-gold-400/50 bg-white p-6 shadow-sm"
    >
      <div className="text-center">
        <p className="text-sm font-bold text-brand-400">الخطوة 1 — بوابة القسم</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-900/75">
          أدخل <strong>البريد</strong> و<strong>كلمة المرور الخاصة بالقسم</strong> (يصدرهما المسؤول لكل قسم).
          بعد نجاح الدخول ستطلب منك الخطوة التالية <strong>رمزك التعريفي الشخصي</strong> (4 أرقام).
        </p>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink-900/85">بريد القسم</span>
        <input
          className="w-full rounded-lg border border-ink-900/15 bg-white px-3 py-2.5 text-ink-900 outline-none focus:border-brand-400"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink-900/85">كلمة مرور القسم</span>
        <input
          className="w-full rounded-lg border border-ink-900/15 bg-white px-3 py-2.5 text-ink-900 outline-none focus:border-brand-400"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      {gatewaysError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{gatewaysError}</p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-bold text-white shadow hover:bg-brand-400 disabled:opacity-60"
      >
        {loading ? "جارٍ التحقق…" : "متابعة إلى الرمز الشخصي"}
      </button>
      <p className="text-center text-xs text-ink-900/55">
        وضع التجربة: استخدم البريد التجريبي حسب القسم (مثل estates.demo@mathwa.local / estates1).
      </p>
    </form>
  );
}
