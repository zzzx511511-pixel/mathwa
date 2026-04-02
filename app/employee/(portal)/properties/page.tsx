import Link from "next/link";
import { EmployeePortalShell } from "@/components/employee/employee-portal-shell";
import { EstatesBreadcrumb } from "@/components/employee/estates-breadcrumb";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { PaginationControls } from "@/components/ui/pagination-controls";

export const dynamic = "force-dynamic";

function getAnyId(row: Record<string, unknown>): string {
  return String(row?.id ?? row?.property_id ?? row?.uuid ?? "—");
}

function fmtCommission(v: unknown): string {
  if (v == null || v === "") return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  if (n <= 1 && n >= 0) return `${(n * 100).toFixed(1)}٪`;
  return `${n}`;
}

const TYPE_LABELS: Record<string, string> = {
  apartment: "شقة",
  office: "مكتب",
  shop: "محل",
  villa: "فيلا",
  factory: "مصنع",
  warehouse: "مستودع",
  workshop: "ورشة",
  yard: "ساحة"
};

const STATUS_LABELS: Record<string, string> = {
  vacant: "شاغر",
  occupied: "مؤجَر"
};

function fmtType(row: Record<string, unknown>): string {
  const raw = row.type ?? row.property_type;
  if (raw == null || raw === "") {
    return String(row.ownership_type ?? "—");
  }
  const s = String(raw);
  return TYPE_LABELS[s] ?? s;
}

function fmtStatus(row: Record<string, unknown>): string {
  const s = String(row.status ?? "").toLowerCase();
  if (!s) return "—";
  return STATUS_LABELS[s] ?? s;
}

export default async function EmployeePropertiesPage({
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
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) throw error;
    rows = (data ?? []) as Record<string, unknown>[];
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : "تعذر جلب بيانات العقارات.";
  }

  const hasPrev = page > 1;
  const hasNext = rows.length === pageSize;

  return (
    <EmployeePortalShell>
      <EstatesBreadcrumb
        items={[
          { label: "إدارة الأملاك", href: "/employee/estates" },
          { label: "سجل العقارات" }
        ]}
      />

      <section className="rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-brand-400">سجل العقارات</h2>
            <p className="mt-2 text-sm text-ink-900/75">
              قائمة العقارات المسجّلة في النظام (حسب صلاحيات RLS). اضغط على الصف لعرض التفاصيل الكاملة.
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
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead className="bg-brand-100 text-ink-900/85">
              <tr>
                <th className="px-3 py-3 text-right font-semibold">المعرّف</th>
                <th className="px-3 py-3 text-right font-semibold">الاسم</th>
                <th className="px-3 py-3 text-right font-semibold">نوع العقار</th>
                <th className="px-3 py-3 text-right font-semibold">المساحة (م²)</th>
                <th className="px-3 py-3 text-right font-semibold">الحالة</th>
                <th className="px-3 py-3 text-right font-semibold">المدينة</th>
                <th className="px-3 py-3 text-right font-semibold">العمولة</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-ink-900/70" colSpan={7}>
                    لا توجد عقارات في هذه الصفحة. قد تكون القائمة فارغة أو مقيدة بالصلاحيات.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={getAnyId(row)} className="border-t border-ink-900/5 hover:bg-brand-50/40">
                    <td className="px-3 py-3 font-mono text-xs text-ink-900/80">
                      <Link
                        prefetch={false}
                        title={getAnyId(row)}
                        className="font-medium text-brand-500 hover:underline"
                        href={`/employee/properties/${getAnyId(row)}`}
                      >
                        {getAnyId(row).length > 12
                          ? `${getAnyId(row).slice(0, 8)}…`
                          : getAnyId(row)}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-ink-900/90">
                      {String(row.name ?? "—")}
                    </td>
                    <td className="px-3 py-3 text-ink-900/75">{fmtType(row)}</td>
                    <td className="px-3 py-3 tabular-nums text-ink-900/75">
                      {row.area_sqm != null && row.area_sqm !== ""
                        ? String(row.area_sqm)
                        : "—"}
                    </td>
                    <td className="px-3 py-3 text-ink-900/75">{fmtStatus(row)}</td>
                    <td className="px-3 py-3 text-ink-900/75">
                      {String(row.city ?? "—")}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-ink-900/75">
                      {fmtCommission(row.commission_rate)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <PaginationControls
          basePath="/employee/properties"
          page={page}
          pageSize={pageSize}
          hasPrev={hasPrev}
          hasNext={hasNext}
        />
      </section>
    </EmployeePortalShell>
  );
}
