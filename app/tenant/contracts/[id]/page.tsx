import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { KvTable } from "@/components/ui/kv-table";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function TenantContractDetailsPage({
  params
}: {
  params: { id: string };
}) {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("contracts")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-2xl font-bold text-brand-400">تفاصيل العقد</h3>
          <Link
            prefetch={false}
            href="/tenant/contracts"
            className="rounded-full border border-ink-900/10 bg-white px-4 py-2 text-sm font-medium text-ink-900/80 hover:border-gold-400 hover:bg-gold-400/10"
          >
            العودة للعقود
          </Link>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-50 p-4 text-sm text-red-700">
            {error.message}
          </div>
        ) : !data ? (
          <div className="mt-4 rounded-xl border border-ink-900/10 bg-brand-100 p-4 text-sm text-ink-900/80">
            لا يوجد عقد بهذا المعرّف أو لا تملك صلاحية عرضه.
          </div>
        ) : (
          <div className="mt-5">
            <KvTable data={data as Record<string, unknown>} />
          </div>
        )}
      </section>
    </PortalShell>
  );
}

