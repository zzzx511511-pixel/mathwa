import { EmployeePortalShell } from "@/components/employee/employee-portal-shell";
import { EstatesBreadcrumb } from "@/components/employee/estates-breadcrumb";
import { OwnerPortfolioView } from "@/components/employee/owner-portfolio-view";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OwnerDetailsPage({ params }: { params: { id: string } }) {
  const supabase = getSupabaseServerClient();

  const { data: owner, error: ownerErr } = await supabase
    .from("owners")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  let ownerEmail: string | null = null;
  if (owner && !ownerErr && owner.user_id) {
    const { data: userRow } = await supabase
      .from("users")
      .select("email")
      .eq("id", String(owner.user_id))
      .maybeSingle();
    ownerEmail = (userRow?.email as string | undefined) ?? null;
  }

  let properties: Record<string, unknown>[] = [];
  if (owner && !ownerErr) {
    const { data } = await supabase.from("properties").select("*").eq("owner_id", params.id);
    properties = (data ?? []) as Record<string, unknown>[];
  }

  const tenantsByPropertyId: Record<string, Record<string, unknown> | undefined> = {};
  if (properties.length) {
    const propIds = properties.map((p) => String(p.id ?? "")).filter(Boolean);
    const { data: tenants } = await supabase.from("tenants").select("*");
    for (const t of (tenants ?? []) as Record<string, unknown>[]) {
      const pid = String(t.property_id ?? "");
      if (pid && propIds.includes(pid) && !tenantsByPropertyId[pid]) {
        tenantsByPropertyId[pid] = t;
      }
    }
  }

  return (
    <EmployeePortalShell>
      <EstatesBreadcrumb
        items={[
          { label: "إدارة الأملاك", href: "/employee/estates" },
          { label: "ملف المالك" }
        ]}
      />

      {ownerErr ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-50 p-6 text-sm text-red-700">
          {ownerErr.message}
        </div>
      ) : !owner ? (
        <div className="rounded-2xl border border-ink-900/10 bg-brand-100 p-6 text-sm text-ink-900/80">
          لا يوجد مالك بهذا المعرّف.
        </div>
      ) : (
        <OwnerPortfolioView
          owner={{ ...(owner as Record<string, unknown>), email: ownerEmail }}
          properties={properties}
          tenantsByPropertyId={tenantsByPropertyId}
        />
      )}
    </EmployeePortalShell>
  );
}

