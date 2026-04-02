import { PortalShell } from "@/components/layout/portal-shell";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { PaginationControls } from "@/components/ui/pagination-controls";

export const dynamic = "force-dynamic";

function getFileUrl(row: any): string {
  return String(
    row?.contract_file_url ?? row?.file_url ?? row?.document_url ?? row?.url ?? "—"
  );
}

export default async function TenantDocumentsPage({
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
      .from("contracts")
      .select("*")
      .range(from, to);
    if (error) throw error;
    rows = data ?? [];
  } catch (e) {
    errorMessage =
      e instanceof Error ? e.message : "تعذر جلب مستندات العقود.";
  }

  const hasPrev = page > 1;
  const hasNext = rows.length === pageSize;

  return (
    <PortalShell
      title="بوابة المستأجر"
      nav={[
        { href: "/tenant/portal", label: "الرئيسية" },
        { href: "/tenant/contracts", label: "العقود" },
        { href: "/tenant/payments", label: "الدفعات" },
        { href: "/tenant/maintenance", label: "الصيانة" },
        { href: "/tenant/documents", label: "المستندات" }
      ]}
    >
      <section className="rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm">
        <h3 className="text-2xl font-bold text-brand-400">المستندات (documents)</h3>
        <p className="mt-2 text-ink-900/80">
          عرض الصفحة {page}: سنحاول إظهار `contract_file_url` أو `file_url` حسب المتاح.
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
                <th className="px-4 py-3 text-right font-semibold">Contract ID</th>
                <th className="px-4 py-3 text-right font-semibold">file url</th>
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
                rows.map((row) => {
                  const id = String(row?.id ?? row?.contract_id ?? "—");
                  const status = String(row?.status ?? row?.contract_status ?? "—");
                  const url = getFileUrl(row);
                  return (
                    <tr key={id} className="border-t border-ink-900/5">
                      <td className="px-4 py-3 font-medium text-ink-900/80">{id}</td>
                      <td className="px-4 py-3 text-ink-900/70">{url}</td>
                      <td className="px-4 py-3 text-ink-900/70">{status}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <PaginationControls
          basePath="/tenant/documents"
          page={page}
          pageSize={pageSize}
          hasPrev={hasPrev}
          hasNext={hasNext}
        />
      </section>
    </PortalShell>
  );
}

