import Link from "next/link";
import { EmployeePortalShell } from "@/components/employee/employee-portal-shell";
import { EstatesBreadcrumb } from "@/components/employee/estates-breadcrumb";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OwnersIndexPage() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("owners").select("*");
  const owners = ((data ?? []) as Record<string, unknown>[]).filter(
    (o) => o.archived !== true && o.is_archived !== true && !o.archived_at
  );

  return (
    <EmployeePortalShell>
      <EstatesBreadcrumb
        items={[
          { label: "إدارة الأملاك", href: "/employee/estates" },
          { label: "الملاك" }
        ]}
      />

      <section className="rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-brand-400">الملاك</h1>
            <p className="mt-2 text-sm text-ink-900/75">
              افتح “ملف المالك” لعرض بياناته وعقاراته في خانة واحدة.
            </p>
          </div>
          <Link
            href="/employee/owners/new"
            prefetch={false}
            className="rounded-full bg-brand-500 px-4 py-2 text-sm font-bold text-white shadow hover:bg-brand-400"
          >
            + إضافة مالك
          </Link>
          <Link
            href="/employee/owners/archive"
            prefetch={false}
            className="rounded-full border border-ink-900/15 bg-white px-4 py-2 text-sm font-bold text-ink-900/80 hover:border-gold-400"
          >
            أرشيف الملاك
          </Link>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-50 p-4 text-sm text-red-700">
            {error.message}
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {owners.map((o) => {
            const id = String(o.id ?? "");
            const name = String(o.full_name ?? "مالك");
            return (
              <article
                key={id}
                className="rounded-2xl border border-ink-900/10 bg-brand-50/40 p-5 shadow-sm hover:border-gold-400/60 hover:bg-gold-400/10"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-ink-900/45">ملف المالك</p>
                <h3 className="mt-1 text-lg font-bold text-ink-900">{name}</h3>
                <p className="mt-2 text-sm text-ink-900/70">عرض البيانات + عقاراته + المستأجرين</p>
                <Link
                  href={`/employee/owners/${id}`}
                  prefetch={false}
                  className="mt-4 inline-flex rounded-full bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-400"
                >
                  عرض التفاصيل
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </EmployeePortalShell>
  );
}

