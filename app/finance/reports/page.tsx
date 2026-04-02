import { PortalShell } from "@/components/layout/portal-shell";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/lib/auth/get-session-user-id";
import { isInternalPreviewOrPortalOpen } from "@/lib/auth/is-internal-preview-or-portal-open";
import { getDemoFinanceRollup } from "@/lib/demo/supabase-mock";

export const dynamic = "force-dynamic";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ink-900/10 bg-white p-4">
      <div className="text-sm font-medium text-ink-900/70">{label}</div>
      <div className="mt-2 text-2xl font-bold text-brand-400">{value}</div>
    </div>
  );
}

export default async function FinanceReportsPage() {
  const supabase = getSupabaseServerClient();
  const userId = await getSessionUserId();

  let invoicesCount = 0;
  let scheduleCount = 0;
  let errorMessage: string | null = null;

  try {
    if (isInternalPreviewOrPortalOpen()) {
      const r = getDemoFinanceRollup();
      invoicesCount = r.invoicesCount;
      scheduleCount = r.scheduleCount;
    } else {
      if (!userId) throw new Error("غير مسجل دخول.");

      const { count: invCount, error: invErr } = await supabase
        .from("invoices")
        .select("id", { count: "exact", head: true });
      if (invErr) throw invErr;

      const { count: schCount, error: schErr } = await supabase
        .from("collection_schedule")
        .select("id", { count: "exact", head: true });
      if (schErr) throw schErr;

      invoicesCount = invCount ?? 0;
      scheduleCount = schCount ?? 0;
    }
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : "تعذر إعداد التقارير.";
  }

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
        <h3 className="text-2xl font-bold text-brand-400">التقارير (reports)</h3>
        <p className="mt-2 text-ink-900/80">
          ملخص مبسط اعتمادًا على سجلات مرئية عبر RLS.
        </p>

        {errorMessage ? (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Metric label="عدد الفواتير (invoices)" value={String(invoicesCount)} />
          <Metric
            label="عدد بنود التحصيل (collection_schedule)"
            value={String(scheduleCount)}
          />
        </div>
      </section>
    </PortalShell>
  );
}

