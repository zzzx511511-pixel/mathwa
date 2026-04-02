import Link from "next/link";
import { DepartmentUnlockForm } from "@/components/employee/department-unlock-form";
import {
  departmentHubPaths,
  departmentLabels,
  isDepartmentKey,
  type DepartmentKey
} from "@/lib/employee/department-keys";

export default function EmployeeUnlockPage({
  searchParams
}: {
  searchParams: { department?: string; returnTo?: string };
}) {
  const deptRaw = searchParams.department;
  const initialDept: DepartmentKey = isDepartmentKey(deptRaw) ? deptRaw : "estates";
  const returnRaw = searchParams.returnTo;
  const returnTo =
    returnRaw &&
    returnRaw.startsWith("/") &&
    !returnRaw.startsWith("//") &&
    !returnRaw.includes(":")
      ? returnRaw
      : departmentHubPaths[initialDept];

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <section className="rounded-2xl border border-gold-400/40 bg-gradient-to-br from-brand-50 to-white p-6 shadow-sm">
        <h1 className="text-xl font-extrabold text-brand-400">دخول قسم</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-900/80">
          حسابك يفتح <strong>بوابة الموظفين</strong>. لكل قسم (مثل {departmentLabels.estates} أو{" "}
          {departmentLabels.finance}) يصدر المسؤول <strong>رقم تعريف خاص</strong> يمنحه للموظف؛
          أدخله هنا للمرة الأولى أو بعد انتهاء الجلسة.
        </p>
        <p className="mt-2 text-xs text-ink-900/60">
          القسم المطلوب الآن: <strong>{departmentLabels[initialDept]}</strong>
        </p>
      </section>

      <DepartmentUnlockForm initialDepartment={initialDept} returnTo={returnTo} />

      <p className="text-center text-sm">
        <Link
          href="/employee/estates"
          className="font-semibold text-brand-500 underline"
        >
          العودة إلى إدارة الأملاك
        </Link>
      </p>
    </div>
  );
}
