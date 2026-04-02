import { PortalShell } from "@/components/layout/portal-shell";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { PaginationControls } from "@/components/ui/pagination-controls";
import Link from "next/link";

export const dynamic = "force-dynamic";

function getAnyId(row: any): string {
  return String(row?.id ?? row?.schedule_id ?? row?.uuid ?? "—");
}

export default async function FinanceLedgerPage({
  searchParams
}: {
  searchParams?: { page?: string; pageSize?: string };
}) {
  const supabase = getSupabaseServerClient();

  const page = Math.max(1, Number(searchParams?.page ?? 1));
  const pageSize = Math.min(50, Math.max(5, Number(searchParams?.pageSize ?? 10)));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let rows: any[] = [];
  let errorMessage: string | null = null;
  try {
    const { data, error } = await supabase
      .from("collection_schedule")
      .select("*")
      .range(from, to);
    if (error) throw error;
    rows = data ?? [];
  } catch (e) {
    errorMessage =
      e instanceof Error ? e.message : "تعذر جلب بيانات السجل.";
  }

  const hasPrev = page > 1;
  const hasNext = rows.length === pageSize;

  return (
    <PortalShell
      title="القسم المالي"
      nav={[
        { href: "/finance/dashboard", label: "الرئيسية" },
        { href: "/finance/ledger", label: "سجل القيود" },
        { href: "/finance/invoices", label: "الفواتير" },
        { href: "/finance/reports", label: "التقارير" }
      ]}
    >
      <section className="rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm">
        <h3 className="text-2xl font-bold text-brand-400">سجل القيود (ledger)</h3>
        <p className="mt-2 text-ink-900/80">
          عرض الصفحة {page} من سجلات `collection_schedule` (وفق سياسات RLS).
        </p>

        {errorMessage ? (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-5 overflow-hidden rounded-2xl border border-ink-900/10">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-brand-100 text-ink-900/80">
              <tr>
                <th className="px-4 py-3 text-right font-semibold">ID</th>
                <th className="px-4 py-3 text-right font-semibold">payment_date</th>
                <th className="px-4 py-3 text-right font-semibold">status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-4" colSpan={3}>
                    لا توجد بيانات.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={getAnyId(row)} className="border-t border-ink-900/5">
                    <td className="px-4 py-3 font-medium text-ink-900/80">
                      <Link
                        prefetch={false}
                        className="hover:underline"
                        href={`/finance/ledger/${getAnyId(row)}`}
                      >
                        {getAnyId(row)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-900/70">
                      {String(
                        row?.scheduled_date ?? row?.payment_date ?? row?.due_date ?? "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-900/70">
                      {String(row?.status ?? row?.state ?? "—")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <PaginationControls
          basePath="/finance/ledger"
          page={page}
          pageSize={pageSize}
          hasPrev={hasPrev}
          hasNext={hasNext}
        />
      </section>
    </PortalShell>
  );
}

