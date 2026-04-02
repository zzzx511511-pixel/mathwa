import Link from "next/link";
import { EmployeePortalShell } from "@/components/employee/employee-portal-shell";
import { EstatesBreadcrumb } from "@/components/employee/estates-breadcrumb";
import { MaintenanceInvoiceDetailActions } from "@/components/employee/maintenance-invoice-detail-actions";
import { KvTable } from "@/components/ui/kv-table";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EmployeeMaintenanceDetailsPage({
  params
}: {
  params: { id: string };
}) {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("maintenance_invoices")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  return (
    <EmployeePortalShell>
      <EstatesBreadcrumb
        items={[
          { label: "إدارة الأملاك", href: "/employee/estates" },
          { label: "فواتير الصيانة", href: "/employee/maintenance" },
          { label: "تفاصيل الفاتورة" }
        ]}
      />

      <section className="rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-brand-400">تفاصيل فاتورة الصيانة</h2>
          <div className="flex flex-wrap gap-2">
            <Link
              prefetch={false}
              href="/employee/maintenance"
              className="rounded-full border border-ink-900/10 bg-white px-4 py-2 text-sm font-medium text-ink-900/80 hover:border-gold-400 hover:bg-gold-400/10"
            >
              كل الفواتير
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

        {error ? (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-50 p-4 text-sm text-red-700">
            {error.message}
          </div>
        ) : !data ? (
          <div className="mt-4 rounded-xl border border-ink-900/10 bg-brand-100 p-4 text-sm text-ink-900/80">
            لا توجد فاتورة بهذا المعرّف أو لا تملك صلاحية عرضها.
          </div>
        ) : (
          <div className="mt-5">
            <MaintenanceInvoiceDetailActions invoice={data as Record<string, unknown>} />
            <div className="mt-4">
              <KvTable data={data as Record<string, unknown>} />
            </div>
          </div>
        )}
      </section>
    </EmployeePortalShell>
  );
}

