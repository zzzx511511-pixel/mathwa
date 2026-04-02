import { EmployeePortalShell } from "@/components/employee/employee-portal-shell";
import { EmployeeRoomCard, EmployeeRoomPlaceholder } from "@/components/employee/employee-room-card";
import { EstatesBreadcrumb } from "@/components/employee/estates-breadcrumb";
import { EstatesQuickStats } from "@/components/employee/estates-quick-stats";
import { EmployeeSectionHub } from "@/components/employee/employee-section-hub";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function EmployeeEstatesRoomPage() {
  const supabase = getSupabaseServerClient();
  const { data: ownersRows } = await supabase.from("owners").select("id, full_name, phone").order("created_at", { ascending: false }).limit(8);
  const owners = (ownersRows ?? []) as Array<{ id: string; full_name?: string | null; phone?: string | null }>;

  return (
    <EmployeePortalShell>
      <div className="space-y-6">
        <EstatesBreadcrumb items={[{ label: "إدارة الأملاك" }]} />

        <EmployeeSectionHub
          departmentKey="estates"
          headerAside={
            <Link
              href="/employee/owners/new"
              prefetch={false}
              className="rounded-full bg-brand-500 px-4 py-2 text-sm font-bold text-white shadow hover:bg-brand-400"
            >
              + إضافة مالك
            </Link>
          }
        >
          <EstatesQuickStats />

          <div className="grid gap-4 md:grid-cols-2">
            <EmployeeRoomCard href="/employee/owners" title="غرفة بيانات الملاك">
              قائمة جميع الملاك المضافين مع زر عرض التفاصيل وملف المالك الكامل.
            </EmployeeRoomCard>
            <EmployeeRoomCard href="/employee/properties" title="سجل العقارات (كامل)">
              جميع العقارات المسجّلة للإدارة — شاغر ومؤجَر وأي حالة — مع التصفح والبطاقة التفصيلية.
            </EmployeeRoomCard>
            <EmployeeRoomCard href="/employee/maintenance" title="فواتير الصيانة">
              فواتير مرفوعة من الموظفين مع مسار اعتماد الإدارة (قيد المراجعة / معتمد / مرفوض) وربط كل فاتورة
              بالعقار.
            </EmployeeRoomCard>
          </div>

          <section className="rounded-2xl border border-ink-900/10 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-brand-400">قائمة الملاك المضافين</h3>
              <Link href="/employee/owners" prefetch={false} className="text-sm font-bold text-brand-500 hover:text-brand-400">
                عرض الكل
              </Link>
            </div>

            {owners.length === 0 ? (
              <p className="text-sm text-ink-900/70">لا يوجد ملاك مضافون حتى الآن.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {owners.map((owner) => (
                  <article key={owner.id} className="rounded-xl border border-ink-900/10 bg-brand-50/40 p-4">
                    <p className="text-base font-bold text-ink-900">{owner.full_name || "مالك بدون اسم"}</p>
                    <p className="mt-1 text-sm text-ink-900/70">{owner.phone || "لا يوجد جوال"}</p>
                    <Link
                      href={`/employee/owners/${owner.id}`}
                      prefetch={false}
                      className="mt-3 inline-flex rounded-full bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-400"
                    >
                      عرض التفاصيل
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </section>

          <EmployeeRoomPlaceholder title="لاحقاً في هذا القسم">
            جداول العقود التفصيلية، مرفقات وثائق الملكية، وتقارير الجرد — فعّل المسارات من ملف الـ registry
            وأضف الصفحات عند الجاهزية.
          </EmployeeRoomPlaceholder>
        </EmployeeSectionHub>
      </div>
    </EmployeePortalShell>
  );
}
