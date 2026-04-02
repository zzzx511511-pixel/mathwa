import Link from "next/link";
import { EmployeePortalShell } from "@/components/employee/employee-portal-shell";
import { EstatesBreadcrumb } from "@/components/employee/estates-breadcrumb";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { PaginationControls } from "@/components/ui/pagination-controls";

export const dynamic = "force-dynamic";

function getAnyId(row: Record<string, unknown>): string {
  return String(row?.id ?? row?.request_id ?? row?.uuid ?? "—");
}

function shortText(v: unknown, max = 56): string {
  if (v == null || v === "") return "—";
  const s = String(v).replace(/\s+/g, " ").trim();
  return s.length <= max ? s : `${s.slice(0, max)}…`;
}

function fmtDate(v: unknown): string {
  if (v == null || v === "") return "—";
  const s = String(v);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function fmtAmount(v: unknown): string {
  if (v == null || v === "") return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return `${n.toLocaleString("ar-SA")} ر.س`;
}

const INV_STATUS: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "معتمد",
  rejected: "مرفوض"
};

function fmtInvoiceStatus(v: unknown): string {
  const s = String(v ?? "").toLowerCase();
  return INV_STATUS[s] ?? (s || "—");
}

export default async function EmployeeMaintenancePage({
  searchParams
}: {
  searchParams?: { page?: string; pageSize?: string };
}) {
  const supabase = getSupabaseServerClient();

  const page = Math.max(1, Number(searchParams?.page ?? 1));
  const pageSize = Math.min(50, Math.max(5, Number(searchParams?.pageSize ?? 10)));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let rows: Record<string, unknown>[] = [];
  let errorMessage: string | null = null;

  try {
    const { data, error } = await supabase
      .from("maintenance_invoices")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) throw error;
    rows = (data ?? []) as Record<string, unknown>[];
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : "تعذر جلب فواتير الصيانة.";
  }

  const hasPrev = page > 1;
  const hasNext = rows.length === pageSize;

  return (
    <EmployeePortalShell>
      <EstatesBreadcrumb
        items={[
          { label: "إدارة الأملاك", href: "/employee/estates" },
          { label: "طلبات الصيانة" }
        ]}
      />

      <section className="rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-brand-400">فواتير الصيانة</h2>
            <p className="mt-2 text-sm text-ink-900/75">
              جدول <span className="font-mono text-xs">maintenance_invoices</span>: مرفوعات الموظف، مبالغ،
              حالة اعتماد الإدارة (قيد المراجعة / معتمد / مرفوض).
            </p>
          </div>
          <Link
            href="/employee/estates"
            prefetch={false}
            className="rounded-full border border-ink-900/15 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-500 hover:border-gold-400"
          >
            ← غرفة إدارة الأملاك
          </Link>
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-5 overflow-x-auto rounded-2xl border border-ink-900/10">
          <table className="w-full min-w-[800px] border-collapse text-sm">
            <thead className="bg-brand-100 text-ink-900/85">
              <tr>
                <th className="px-3 py-3 text-right font-semibold">المعرّف</th>
                <th className="px-3 py-3 text-right font-semibold">الحالة</th>
                <th className="px-3 py-3 text-right font-semibold">العقار</th>
                <th className="px-3 py-3 text-right font-semibold">المبلغ</th>
                <th className="px-3 py-3 text-right font-semibold">الوصف</th>
                <th className="px-3 py-3 text-right font-semibold">تاريخ الإنشاء</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-ink-900/70" colSpan={6}>
                    لا توجد فواتير في هذه الصفحة.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={getAnyId(row)} className="border-t border-ink-900/5 hover:bg-brand-50/40">
                    <td className="px-3 py-3 font-mono text-xs">
                      <Link
                        prefetch={false}
                        className="font-medium text-brand-500 hover:underline"
                        href={`/employee/maintenance/${getAnyId(row)}`}
                      >
                        {getAnyId(row).slice(0, 8)}…
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-ink-900/80">
                      {fmtInvoiceStatus(row.status)}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-ink-900/70">
                      {String(row.property_id ?? "—")}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-ink-900/80">
                      {fmtAmount(row.amount)}
                    </td>
                    <td className="max-w-[14rem] px-3 py-3 text-ink-900/75">
                      {shortText(row.description)}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-ink-900/70">
                      {fmtDate(row.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <PaginationControls
          basePath="/employee/maintenance"
          page={page}
          pageSize={pageSize}
          hasPrev={hasPrev}
          hasNext={hasNext}
        />
      </section>
    </EmployeePortalShell>
  );
}
