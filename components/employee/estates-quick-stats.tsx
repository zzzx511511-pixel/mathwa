import { getSupabaseServerClient } from "@/lib/supabase/server";

function dash(n: number | null) {
  return n === null ? "—" : String(n);
}

/** أرقام سريعة من قاعدة البيانات عند توفرها؛ عند الخطأ تُعرض شرطات */
export async function EstatesQuickStats() {
  let totalProperties: number | null = null;
  let openMaintenance: number | null = null;

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.from("properties").select("id");
    if (error) throw error;
    totalProperties = data?.length ?? null;
  } catch {
    totalProperties = null;
  }

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("maintenance_invoices")
      .select("id")
      .eq("status", "pending");
    if (error) throw error;
    openMaintenance = data?.length ?? null;
  } catch {
    openMaintenance = null;
  }

  const stats = [
    { label: "عقارات تحت الإدارة", value: dash(totalProperties), hint: "عدد السجلات الظاهرة لك" },
    { label: "فواتير صيانة قيد المراجعة", value: dash(openMaintenance), hint: "حالة pending" },
    { label: "آخر تحديث", value: "مباشر", hint: "من قاعدة البيانات" }
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-2xl border border-gold-400/25 bg-gradient-to-br from-white to-brand-50/90 px-4 py-4 shadow-sm"
        >
          <p className="text-xs font-medium text-ink-900/55">{s.label}</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-brand-400">{s.value}</p>
          <p className="mt-1 text-[11px] text-ink-900/45">{s.hint}</p>
        </div>
      ))}
    </div>
  );
}
