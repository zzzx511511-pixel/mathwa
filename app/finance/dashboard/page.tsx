import { PortalShell } from "@/components/layout/portal-shell";
import { isInternalPreviewOrPortalOpen } from "@/lib/auth/is-internal-preview-or-portal-open";
import { getDemoFinanceRollup } from "@/lib/demo/supabase-mock";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function formatSar(n: number) {
  return `${new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 }).format(n)} ر.س`;
}

export default async function FinanceDashboardPage() {
  let commission: string = "—";
  let net: string = "—";
  let transferCount: string = "—";
  let statusLine = "—";

  if (isInternalPreviewOrPortalOpen()) {
    const r = getDemoFinanceRollup();
    commission = formatSar(r.commissionDeductedTotal);
    net = formatSar(r.netTransferredTotal);
    transferCount = String(r.transferCount);
    statusLine = `معلّق: ${r.pendingCount} — محوّل: ${r.transferredCount}`;
  } else {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from("owner_transfers")
        .select("commission_deducted, net_amount_transferred, status");
      if (error) throw error;
      const rows = data ?? [];
      let c = 0;
      let n = 0;
      let p = 0;
      let t = 0;
      for (const row of rows as {
        commission_deducted?: number | null;
        net_amount_transferred?: number | null;
        status?: string | null;
      }[]) {
        c += Number(row.commission_deducted ?? 0);
        n += Number(row.net_amount_transferred ?? 0);
        if (String(row.status) === "pending") p += 1;
        if (String(row.status) === "transferred") t += 1;
      }
      commission = formatSar(c);
      net = formatSar(n);
      transferCount = String(rows.length);
      statusLine = `معلّق: ${p} — محوّل: ${t}`;
    } catch {
      /* يبقى — */
    }
  }

  return (
    <PortalShell
      title="القسم المالي"
      nav={[
        { href: "/finance/dashboard", label: "الرئيسية" },
        { href: "/finance/dashboard#team", label: "فريق المالية" },
        { href: "/finance/ledger", label: "سجل القيود" },
        { href: "/finance/invoices", label: "الفواتير" },
        { href: "/finance/reports", label: "التقارير" }
      ]}
    >
      <div className="space-y-6">
        <section className="rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-2xl font-bold text-brand-400">القسم المالي</h2>
          <p className="text-ink-900/80">
            لوحة موجزة لتحويلات الملاك والعمولات — مرتبطة بجدول{" "}
            <span className="font-mono text-sm">owner_transfers</span>.
          </p>
          {isInternalPreviewOrPortalOpen() ? (
            <p className="mt-3 rounded-lg border border-emerald-200/80 bg-emerald-50 px-3 py-2 text-sm text-emerald-900/90">
              وضع المعاينة أو بوابة التطوير مفعّل: يمكنك تصفّح <strong>/finance</strong> بدون قيود الدخول
              الكاملة؛ الأرقام أدناه من بيانات التجربة أو من القاعدة عند التفعيل الحقيقي.
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-ink-900/10 bg-brand-100 p-6">
          <h3 className="text-xl font-bold text-ink-900">ملخص العمولات والتحويلات</h3>
          <p className="mt-2 text-sm text-ink-900/80">
            الحقول <span className="font-mono">commission_deducted</span> و{" "}
            <span className="font-mono">net_amount_transferred</span>.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <InfoMetric title="إجمالي الخصم (commission_deducted)" value={commission} />
            <InfoMetric title="إجمالي الصافي (net_amount_transferred)" value={net} />
            <InfoMetric title="عدد التحويلات (owner_transfers)" value={transferCount} />
            <InfoMetric title="حسب الحالة" value={statusLine} />
          </div>
        </section>

        <section id="team" className="rounded-2xl border border-ink-900/10 bg-white p-6">
          <h3 className="text-xl font-bold text-ink-900">تقسيم موظفي القسم المالي</h3>
          <p className="mt-2 text-sm text-ink-900/80">
            لتوضيح المسؤوليات داخل المالية، تم فصل العمل حسب نوع الموظف بدل عرض القسم ككتلة واحدة.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <FinanceRoleCard
              title="موظف التحصيل"
              subtitle="Collector"
              tasks={[
                "متابعة الجدول اليومي للتحصيل",
                "تحديث حالة السداد والدفعات",
                "تصعيد الحالات المتأخرة"
              ]}
            />
            <FinanceRoleCard
              title="المحاسب"
              subtitle="Accountant"
              tasks={[
                "تسجيل القيود المحاسبية",
                "مطابقة الفواتير مع العقود",
                "إعداد التسويات الدورية"
              ]}
            />
            <FinanceRoleCard
              title="مدير المالية"
              subtitle="Finance Manager"
              tasks={[
                "مراجعة المؤشرات والتقارير",
                "اعتماد التحويلات النهائية",
                "متابعة الانحرافات المالية"
              ]}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-ink-900/10 bg-white p-6">
          <h3 className="text-xl font-bold text-ink-900">تقارير وقيود</h3>
          <div className="mt-3 rounded-xl border border-gold-400/40 bg-white p-4">
            <p className="text-sm font-medium text-ink-900/90">
              راجع <a className="font-semibold text-brand-500 hover:underline" href="/finance/reports">التقارير</a>{" "}
              و{" "}
              <a className="font-semibold text-brand-500 hover:underline" href="/finance/ledger">سجل التحصيل</a>{" "}
              و{" "}
              <a className="font-semibold text-brand-500 hover:underline" href="/finance/invoices">الفواتير</a>.
              من بوابة الموظفين:{" "}
              <a className="font-semibold text-brand-500 hover:underline" href="/employee/finance">
                غرفة المالية
              </a>
              .
            </p>
          </div>
        </section>
      </div>
    </PortalShell>
  );
}

function InfoMetric({ title, value }: { title: string; value: string }) {
  return (
    <article className="rounded-2xl border border-ink-900/10 bg-white p-4">
      <div className="text-sm font-medium text-ink-900/80">{title}</div>
      <div className="mt-2 text-2xl font-bold text-brand-400">{value}</div>
    </article>
  );
}

function FinanceRoleCard({
  title,
  subtitle,
  tasks
}: {
  title: string;
  subtitle: string;
  tasks: string[];
}) {
  return (
    <article className="rounded-2xl border border-ink-900/10 bg-brand-50 p-4">
      <div className="text-lg font-bold text-brand-400">{title}</div>
      <div className="text-xs font-medium text-ink-900/60">{subtitle}</div>
      <ul className="mt-3 space-y-1.5 text-sm text-ink-900/85">
        {tasks.map((task) => (
          <li key={task}>- {task}</li>
        ))}
      </ul>
    </article>
  );
}
