"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import {
  roleFromAuthUser,
  syncPublicUserRole,
  type PublicAccountRole
} from "@/lib/auth/sync-public-user-role";
import { mergeLocalFavoritesAfterAuth } from "@/lib/favorites/remote-favorites";
import { BackButton } from "@/components/layout/back-button";

type FormMode = "signin" | "signup";
type AccountType = PublicAccountRole;

type SignupRole = Exclude<AccountType, "employee">;

type SignInFormProps = {
  initialMode?: FormMode;
  /** أدوار التسجيل عبر البريد (الموظفون العامون يستخدمون /employee/access) */
  initialRole?: SignupRole;
  backFallbackHref?: string;
};

function mapAuthErrorToArabic(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("user already registered") || m.includes("already registered")) {
    return "هذا البريد مسجّل مسبقاً. جرّب تسجيل الدخول أو استخدم بريداً آخر.";
  }
  if (m.includes("invalid login credentials") || m.includes("invalid credentials")) {
    return "البريد أو كلمة المرور غير صحيحة.";
  }
  if (m.includes("email not confirmed")) {
    return "يرجى تأكيد البريد من الرابط المرسل إليك قبل تسجيل الدخول.";
  }
  if (m.includes("password") && (m.includes("least") || m.includes("short"))) {
    return "كلمة المرور ضعيفة؛ استخدم كلمة أطول أو أضف أرقاماً ورموزاً.";
  }
  if (m.includes("signup") && m.includes("disabled")) {
    return "التسجيل معطّل من إعدادات المشروع؛ تواصل مع المسؤول.";
  }
  return message;
}

export default function SignInForm({
  initialMode = "signin",
  initialRole = "client",
  backFallbackHref = "/"
}: SignInFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<FormMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [accountType, setAccountType] = useState<SignupRole>(initialRole);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (mode === "signin") {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;
        const user = data.user;
        if (!user) throw new Error("No user returned from Supabase.");

        await supabaseClient.auth.getSession();
        const sync = await syncPublicUserRole(user.id, roleFromAuthUser(user));
        if (!sync.ok) {
          setErrorMessage(
            `تعذّر حفظ الدور في قاعدة البيانات: ${sync.message ?? ""} — تأكد من تشغيل سكربت Supabase (جدول users والسياسات).`
          );
          setLoading(false);
          return;
        }
        await mergeLocalFavoritesAfterAuth();
        router.replace("/auth/redirect");
        return;
      }

      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: accountType,
            full_name: fullName.trim() || undefined
          }
        }
      });

      if (error) throw error;

      if (data.session?.user) {
        const sync = await syncPublicUserRole(data.session.user.id, accountType);
        if (!sync.ok) {
          setErrorMessage(
            `تعذّر حفظ الدور: ${sync.message ?? ""} — شغّل docs/supabase-setup.sql في Supabase (جدول users + سياسات RLS).`
          );
          setLoading(false);
          return;
        }
        await mergeLocalFavoritesAfterAuth();
        router.replace("/auth/redirect");
        return;
      }

      setSuccessMessage(
        "تم إنشاء الحساب. إذا كان تأكيد البريد مفعّلًا في Supabase، افحص بريدك ثم سجّل الدخول."
      );
      setMode("signin");
    } catch (err) {
      const raw = err instanceof Error ? err.message : "حدث خطأ غير متوقع.";
      setErrorMessage(mapAuthErrorToArabic(raw));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-lg rounded-2xl border border-gold-400 bg-white p-6 shadow-sm">
      <div className="mb-5 flex gap-2 rounded-xl bg-brand-100 p-1">
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${
            mode === "signin"
              ? "bg-white text-brand-400 shadow-sm"
              : "text-ink-900/80 hover:bg-white/70"
          }`}
        >
          تسجيل الدخول
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${
            mode === "signup"
              ? "bg-white text-brand-400 shadow-sm"
              : "text-ink-900/80 hover:bg-white/70"
          }`}
        >
          إنشاء حساب
        </button>
      </div>

      <h2 className="mb-2 text-2xl font-bold text-brand-400">
        {mode === "signin" ? "تسجيل الدخول" : "إنشاء حساب جديد"}
      </h2>
      <p className="mb-3 text-ink-900/80">
        {mode === "signin"
          ? "سجّل الدخول للمستأجرين والمالكين وموظفي التحصيل والمالية. الموظفون العامون يدخلون عبر رمز التعريف من صفحة منفصلة."
          : "أنشئ حسابًا جديدًا ثم ادخل للنظام مباشرة أو بعد تفعيل البريد."}
      </p>

      <div className="mb-5 rounded-xl border border-gold-400/35 bg-[#faf6ef] px-3 py-3 text-sm text-ink-900/90">
        <p className="font-bold text-brand-400">روابط سريعة</p>
        <ul className="mt-2 space-y-2">
          <li>
            <Link
              className="font-semibold text-brand-500 underline-offset-2 hover:underline"
              href="/employee/access"
            >
              دخول الموظفين (رمز أو بريد + قسم)
            </Link>
            <span className="mr-2 text-xs text-ink-900/60">/employee/access</span>
          </li>
          <li>
            <Link className="font-semibold text-brand-500 underline-offset-2 hover:underline" href="/login">
              تسجيل الدخول بالبريد
            </Link>
            <span className="mr-2 text-xs text-ink-900/60">/login</span>
          </li>
          <li>
            <Link
              className="font-semibold text-brand-500 underline-offset-2 hover:underline"
              href="/login?mode=signup"
            >
              إنشاء حساب (عميل / مالك / تحصيل)
            </Link>
            <span className="mr-2 text-xs text-ink-900/60">/login?mode=signup</span>
          </li>
        </ul>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        {mode === "signup" ? (
          <>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink-900/80">الاسم الكامل (اختياري)</span>
              <input
                className="w-full rounded-md border border-ink-900/15 bg-white px-3 py-2 text-ink-900 outline-none focus:border-brand-400"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                type="text"
                autoComplete="name"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink-900/80">نوع الحساب</span>
              <select
                className="w-full rounded-md border border-ink-900/15 bg-white px-3 py-2 text-ink-900 outline-none focus:border-brand-400"
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as SignupRole)}
              >
                <option value="client">عميل (مستأجر)</option>
                <option value="owner">مالك</option>
                <option value="collector">موظف مالي (تحصيل)</option>
              </select>
            </label>
            <p className="text-xs text-ink-900/65">
              موظفو العمليات يدخلون من{" "}
              <Link href="/employee/access" className="font-semibold text-brand-500 underline">
                صفحة رمز التعريف
              </Link>{" "}
              لا من هنا.
            </p>
          </>
        ) : null}

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-900/80">البريد الإلكتروني</span>
          <input
            className="w-full rounded-md border border-ink-900/15 bg-white px-3 py-2 text-ink-900 outline-none focus:border-brand-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-900/80">كلمة المرور</span>
          <input
            className="w-full rounded-md border border-ink-900/15 bg-white px-3 py-2 text-ink-900 outline-none focus:border-brand-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            required
          />
        </label>

        {errorMessage ? (
          <div className="rounded-xl border border-red-500/30 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}
        {successMessage ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-50 p-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        <button
          disabled={loading}
          className="w-full rounded-md bg-brand-500 px-4 py-2 text-white hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
        >
          {loading
            ? mode === "signin"
              ? "جارٍ تسجيل الدخول..."
              : "جارٍ إنشاء الحساب..."
            : mode === "signin"
            ? "دخول"
            : "إنشاء الحساب"}
        </button>

        <div className="flex justify-center">
          <BackButton fallbackHref={backFallbackHref} />
        </div>
      </form>
    </section>
  );
}

