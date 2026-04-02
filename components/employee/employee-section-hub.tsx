import type { ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";
import type { DepartmentKey } from "@/lib/employee/department-keys";
import { getDepartmentModule } from "@/lib/employee/department-module-registry";
import { getEmployeeSectionContent } from "@/lib/site/employee-section-content";

type EmployeeSectionHubProps = {
  departmentKey: DepartmentKey;
  /** محتوى إضافي تحت البطاقات الثابتة (بطاقات الغرفة، إلخ) */
  children?: ReactNode;
  /** عناصر رأس إضافية بجانب العنوان (أزرار) */
  headerAside?: ReactNode;
};

export function EmployeeSectionHub({ departmentKey, children, headerAside }: EmployeeSectionHubProps) {
  const meta = getDepartmentModule(departmentKey);
  const copy = getEmployeeSectionContent(departmentKey);
  const isPlanned = meta.lifecycle === "planned";

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-wide text-gold-600">{copy.roomLabel}</p>
              {isPlanned ? (
                <span className="rounded-full border border-amber-400/60 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-900/90">
                  مخطط للتوسعة — قريباً
                </span>
              ) : (
                <span className="rounded-full border border-emerald-400/50 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-900/85">
                  جاهز للتطوير والإضافة
                </span>
              )}
            </div>
            <h2 className="mt-1 text-2xl font-bold text-brand-400">{copy.title}</h2>
          </div>
          {headerAside ? <div className="flex flex-wrap gap-2">{headerAside}</div> : null}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ink-900/80">{copy.intro}</p>
        {isPlanned && copy.plannedBanner ? (
          <p className="mt-3 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs leading-relaxed text-amber-950/90">
            {copy.plannedBanner}
          </p>
        ) : null}
      </header>

      {children}

      <section className="rounded-2xl border border-ink-900/10 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-ink-900">مسارات جاهزة للتوسعة</h3>
        <p className="mt-1 text-xs text-ink-900/65">
          عرّف المسارات في{" "}
          <code className="rounded bg-ink-900/5 px-1 font-mono text-[11px]">
            lib/employee/department-module-registry.ts
          </code>{" "}
          — غيّر <span className="font-mono">enabled</span> إلى <span className="font-mono">true</span> عند
          جاهزية الصفحة.
        </p>
        <ul className="mt-3 space-y-2">
          {meta.futureRoutes.map((r) => (
            <li key={r.href}>
              {r.enabled ? (
                <Link
                  href={r.href as Route}
                  prefetch={false}
                  className="text-sm font-semibold text-brand-500 hover:underline"
                >
                  {r.label}
                </Link>
              ) : (
                <span className="text-sm text-ink-900/45">
                  <span className="font-medium text-ink-900/55">{r.label}</span>
                  <span className="mr-2 rounded bg-ink-900/5 px-1.5 py-0.5 text-[10px] text-ink-900/50">
                    قريباً
                  </span>
                  <span className="font-mono text-[11px] text-ink-900/35">{r.href}</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {copy.nextSteps.length > 0 ? (
        <section className="rounded-2xl border border-gold-400/25 bg-[#faf8f5] p-5">
          <h3 className="text-sm font-bold text-ink-900">أفكار للمراحل القادمة (قابلة للتعديل في المحتوى)</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-ink-900/80">
            {copy.nextSteps.map((s) => (
              <li key={s}>— {s}</li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-ink-900/50">
            تعديل النصوص:{" "}
            <code className="font-mono">lib/site/employee-section-content.ts</code>
          </p>
        </section>
      ) : null}
    </div>
  );
}
