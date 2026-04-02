import Link from "next/link";
import { EmployeePortalShell } from "@/components/employee/employee-portal-shell";
import { EstatesBreadcrumb } from "@/components/employee/estates-breadcrumb";
import { PropertyDetailView } from "@/components/employee/property-detail-view";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EmployeePropertyDetailsPage({
  params
}: {
  params: { id: string };
}) {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  let tenant: Record<string, unknown> | null = null;
  if (data && !error) {
    const { data: tenantRows, error: tenantError } = await supabase
      .from("tenants")
      .select("*")
      .eq("property_id", params.id)
      .limit(1);
    if (!tenantError && tenantRows?.length) {
      tenant = tenantRows[0] as Record<string, unknown>;
    }
  }

  return (
    <EmployeePortalShell>
      <EstatesBreadcrumb
        items={[
          { label: "إدارة الأملاك", href: "/employee/estates" },
          { label: "سجل العقارات", href: "/employee/properties" },
          { label: "تفاصيل العقار" }
        ]}
      />

      <section className="rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-brand-400">بطاقة العقار</h2>
          <div className="flex flex-wrap gap-2">
            <Link
              prefetch={false}
              href="/employee/properties"
              className="rounded-full border border-ink-900/10 bg-white px-4 py-2 text-sm font-medium text-ink-900/80 hover:border-gold-400 hover:bg-gold-400/10"
            >
              كل العقارات
            </Link>
            <Link
              prefetch={false}
              href="/employee/estates"
              className="rounded-full border border-brand-100 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-500 hover:border-gold-400"
            >
              غرفة إدارة الأملاك
            </Link>
          </div>
        </div>
        <p className="mt-2 text-sm text-ink-900/70">
          عرض حسب مواصفات وحدة إدارة الأملاك: النوع، الحالة، الموقع، العمولة، المستأجر عند التأجير، ومستوى
          الخطر للعقارات الصناعية.
        </p>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-50 p-4 text-sm text-red-700">
            {error.message}
          </div>
        ) : !data ? (
          <div className="mt-4 rounded-xl border border-ink-900/10 bg-brand-100 p-4 text-sm text-ink-900/80">
            لا يوجد عقار بهذا المعرّف أو لا تملك صلاحية عرضه.
          </div>
        ) : (
          <div className="mt-5">
            <PropertyDetailView property={data as Record<string, unknown>} tenant={tenant} />
          </div>
        )}
      </section>
    </EmployeePortalShell>
  );
}
