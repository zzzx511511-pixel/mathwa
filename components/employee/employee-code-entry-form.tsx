"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  EMPLOYEE_PORTAL_CODE_LENGTH,
  isValidEmployeePortalCode
} from "@/lib/employee/employee-portal-code";

type EmployeeCodeEntryFormProps = {
  /** يُعرض تحت العنوان بعد اجتياز بوابة القسم */
  departmentContext?: string;
  /** إذا انتهت جلسة بوابة القسم يُستدعى للعودة للخطوة الأولى */
  onDepartmentGateRequired?: () => void;
};

export function EmployeeCodeEntryForm({
  departmentContext,
  onDepartmentGateRequired
}: EmployeeCodeEntryFormProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function setDigitsOnly(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, EMPLOYEE_PORTAL_CODE_LENGTH);
    setCode(digits);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    if (!isValidEmployeePortalCode(code)) {
      setLoading(false);
      setErrorMessage(`يجب إدخال ${EMPLOYEE_PORTAL_CODE_LENGTH} أرقام بالضبط (مثال: 1234).`);
      return;
    }
    const res = await fetch("/api/employee/access-by-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ code: code.trim() })
    });
    setLoading(false);
    const j = (await res.json().catch(() => ({}))) as {
      error?: string;
      detail?: string;
      redirectTo?: string;
    };
    if (res.ok) {
      const nextPath = j.redirectTo?.startsWith("/") ? j.redirectTo : "/auth/redirect";
      router.replace(nextPath);
      router.refresh();
      return;
    }

    if (j.error === "password_mismatch") {
      setErrorMessage(
        "الرمز مسجّل لكن تسجيل الدخول فشل: كلمة مرور المستخدم في Supabase يجب أن تطابق الرمز نفسه. راجع docs/supabase-employee-portal-code.sql"
      );
      return;
    }
    if (j.error === "missing_service_role" || j.error === "server_misconfigured") {
      setErrorMessage(
        "الخادم غير مهيأ: أضف SUPABASE_SERVICE_ROLE_KEY ومتغيرات Supabase في .env.local"
      );
      return;
    }
    if (j.error === "database_error") {
      const d = (j.detail ?? "").toLowerCase();
      if (d.includes("invalid api key") || d.includes("jwt")) {
        setErrorMessage(
          "مفتاح Supabase غير صالح أو من مشروع آخر. حدّث المفاتيح من لوحة Supabase (Settings → API)، أو للمعاينة حتى التفعيل ضع NEXT_PUBLIC_PREVIEW_UNTIL_LIVE=true (أو NEXT_PUBLIC_DEMO_MODE=true) في .env.local وأعد تشغيل السيرفر."
        );
        return;
      }
      setErrorMessage(
        `قاعدة البيانات: ${j.detail ?? "شغّل docs/supabase-employee-portal-code.sql في Supabase"}`
      );
      return;
    }
    if (j.error === "invalid_format") {
      setErrorMessage(`يجب إدخال ${EMPLOYEE_PORTAL_CODE_LENGTH} أرقام بالضبط.`);
      return;
    }
    if (j.error === "needs_department_gate") {
      setErrorMessage(
        "انتهت جلسة بوابة القسم أو لم تُكمَل الخطوة الأولى. أعد إدخال بريد القسم وكلمة المرور."
      );
      onDepartmentGateRequired?.();
      return;
    }
    if (j.error === "employee_wrong_department") {
      setErrorMessage(
        j.detail ?? "هذا الرمز لا يطابق القسم الذي اخترت الدخول منه."
      );
      return;
    }
    setErrorMessage(
      "رمز التعريف غير مطابق أو الجدول غير مُنشأ. للمعاينة بدون قاعدة: NEXT_PUBLIC_PREVIEW_UNTIL_LIVE=true في .env.local"
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-md space-y-5 rounded-2xl border border-gold-400/50 bg-white p-6 shadow-sm"
    >
      {departmentContext ? (
        <p className="rounded-lg bg-brand-50 px-3 py-2 text-center text-xs text-ink-900/75">
          القسم: <strong className="text-brand-500">{departmentContext}</strong>
        </p>
      ) : null}

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-ink-900/85">
          الرمز التعريفي الشخصي ({EMPLOYEE_PORTAL_CODE_LENGTH} أرقام)
        </span>
        <input
          className="w-full rounded-lg border border-ink-900/15 bg-white px-4 py-3 font-mono text-2xl tracking-[0.4em] text-ink-900 outline-none focus:border-brand-400"
          value={code}
          onChange={(e) => setDigitsOnly(e.target.value)}
          autoComplete="one-time-code"
          inputMode="numeric"
          pattern="\d{4}"
          maxLength={EMPLOYEE_PORTAL_CODE_LENGTH}
          placeholder="••••"
          aria-label={`رمز من ${EMPLOYEE_PORTAL_CODE_LENGTH} أرقام`}
          required
        />
      </label>

      {errorMessage ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{errorMessage}</p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-bold text-white shadow hover:bg-brand-400 disabled:opacity-60"
      >
        {loading ? "جارٍ الدخول…" : "تأكيد الرمز والدخول"}
      </button>
    </form>
  );
}
