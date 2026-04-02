type QueryResult<T> = { data: T | null; error: null };

type TableRow = Record<string, any>;

import { cookies } from "next/headers";

const demoUserId = "00000000-0000-0000-0000-000000000001";

function pickRange<T>(rows: T[], from: number, to: number): T[] {
  if (Number.isNaN(from) || Number.isNaN(to)) return rows;
  return rows.slice(Math.max(0, from), Math.max(0, to) + 1);
}

function applyEq<T extends TableRow>(rows: T[], col: string, value: any): T[] {
  return rows.filter((r) => String(r?.[col]) === String(value));
}

const demoDb: Record<string, TableRow[]> = {
  users: [{ id: demoUserId, role: process.env.DEMO_ROLE ?? "employee" }],
  owners: [
    {
      id: "own_1",
      user_id: demoUserId,
      owner_type: "individual",
      full_name: "مالك تجريبي",
      phone: "0500000000",
      national_id: "1000000000"
    }
  ],
  properties: [
    {
      id: "prop_1",
      owner_id: "own_1",
      ownership_type: "company_owned",
      type: "apartment",
      hazard_level: null,
      status: "occupied",
      area_sqm: 120,
      latitude: 24.7136,
      longitude: 46.6753,
      maps_url: "https://www.google.com/maps?q=24.7136,46.6753",
      city: "الرياض",
      commission_rate: 0.05,
      management_start_date: "2026-01-01",
      management_end_date: null,
      name: "عمارة تجريبية",
      created_at: "2026-03-01T10:00:00Z"
    },
    {
      id: "prop_2",
      owner_id: "own_1",
      ownership_type: "individual_owned",
      type: "villa",
      hazard_level: null,
      status: "vacant",
      area_sqm: 380,
      latitude: 21.4858,
      longitude: 39.1925,
      maps_url: "https://www.google.com/maps?q=21.4858,39.1925",
      city: "جدة",
      commission_rate: 0,
      management_start_date: "2025-06-01",
      management_end_date: null,
      name: "فيلا تجريبية",
      created_at: "2026-03-02T10:00:00Z"
    },
    {
      id: "prop_3",
      owner_id: "own_1",
      ownership_type: "company_owned",
      type: "warehouse",
      hazard_level: "medium",
      status: "vacant",
      area_sqm: 850,
      latitude: 24.6389,
      longitude: 46.7161,
      maps_url: "https://www.google.com/maps?q=24.6389,46.7161",
      city: "الرياض",
      commission_rate: 0.025,
      management_start_date: "2024-09-01",
      management_end_date: null,
      name: "مستودع صناعي (نموذج خطر)",
      created_at: "2026-03-05T10:00:00Z"
    }
  ],
  tenants: [
    {
      id: "ten_1",
      property_id: "prop_1",
      full_name: "محمد التجريبي",
      phone: "+966501234567",
      national_id: "1234567890",
      monthly_rent: 5000,
      contract_start: "2026-01-01",
      contract_end: "2026-12-31",
      status: "active"
    }
  ],
  maintenance_invoices: [
    {
      id: "minv_1",
      property_id: "prop_1",
      uploaded_by: demoUserId,
      approved_by: null,
      description: "إصلاح تسريب سباكة — دور أول",
      amount: 450,
      file_url: "https://example.com/invoice-demo.pdf",
      status: "pending",
      rejection_reason: null,
      created_at: "2026-03-20T09:00:00Z",
      approved_at: null
    },
    {
      id: "minv_2",
      property_id: "prop_2",
      uploaded_by: demoUserId,
      approved_by: demoUserId,
      description: "صيانة كهرباء بوابة",
      amount: 1200,
      file_url: "https://example.com/invoice-approved.pdf",
      status: "approved",
      rejection_reason: null,
      created_at: "2026-03-10T11:00:00Z",
      approved_at: "2026-03-12T14:00:00Z"
    }
  ],
  contracts: [
    {
      id: "con_1",
      tenant_user_id: demoUserId,
      responsible_employee_id: demoUserId,
      property_id: "prop_1",
      start_date: "2026-01-01",
      end_date: "2026-12-31",
      status: "active",
      contract_file_url: "—",
      created_at: "2026-03-01T10:10:00Z"
    },
    {
      id: "con_2",
      tenant_user_id: demoUserId,
      responsible_employee_id: demoUserId,
      property_id: "prop_2",
      start_date: "2026-02-01",
      end_date: "2027-01-31",
      status: "active",
      contract_file_url: "—",
      created_at: "2026-03-03T10:10:00Z"
    }
  ],
  invoices: [
    {
      id: "inv_1",
      contract_id: "con_1",
      tenant_user_id: demoUserId,
      amount: 2500,
      currency: "SAR",
      invoice_date: "2026-03-10",
      due_date: "2026-04-01",
      status: "unpaid",
      created_at: "2026-03-10T12:00:00Z"
    },
    {
      id: "inv_2",
      contract_id: "con_2",
      tenant_user_id: demoUserId,
      amount: 3200,
      currency: "SAR",
      invoice_date: "2026-03-11",
      due_date: "2026-04-05",
      status: "paid",
      created_at: "2026-03-11T12:00:00Z"
    },
    {
      id: "inv_3",
      contract_id: "con_2",
      tenant_user_id: demoUserId,
      amount: 3200,
      currency: "SAR",
      invoice_date: "2026-03-12",
      due_date: "2026-05-05",
      status: "unpaid",
      created_at: "2026-03-12T12:00:00Z"
    }
  ],
  maintenance_requests: [
    {
      id: "mnt_1",
      tenant_user_id: demoUserId,
      property_id: "prop_1",
      status: "open",
      description: "صيانة تجريبية",
      created_at: "2026-03-15T09:00:00Z"
    },
    {
      id: "mnt_2",
      tenant_user_id: demoUserId,
      property_id: "prop_2",
      status: "in_progress",
      description: "طلب صيانة إضافي للتجربة",
      created_at: "2026-03-18T09:00:00Z"
    }
  ],
  collection_schedule: [
    {
      id: "sch_1",
      invoice_id: "inv_1",
      collector_id: demoUserId,
      collector_user_id: demoUserId,
      scheduled_date: "2026-04-01",
      payment_date: "2026-04-01",
      status: "scheduled",
      created_at: "2026-03-20T08:00:00Z"
    },
    {
      id: "sch_2",
      invoice_id: "inv_3",
      collector_id: demoUserId,
      collector_user_id: demoUserId,
      scheduled_date: "2026-05-05",
      payment_date: "2026-05-05",
      status: "scheduled",
      created_at: "2026-03-21T08:00:00Z"
    }
  ],
  owner_transfers: [
    {
      id: "tr_1",
      owner_id: "own_1",
      property_id: "prop_1",
      commission_deducted: 125,
      net_amount_transferred: 2375,
      transfer_date: "2026-04-05",
      status: "pending",
      created_at: "2026-03-22T11:00:00Z"
    },
    {
      id: "tr_2",
      owner_id: "own_1",
      property_id: "prop_2",
      commission_deducted: 0,
      net_amount_transferred: 3200,
      transfer_date: "2026-04-06",
      status: "transferred",
      created_at: "2026-03-23T11:00:00Z"
    }
  ]
};

export function createSupabaseServerMock() {
  const state: { table?: string; eq?: { col: string; value: any }; range?: { from: number; to: number } } =
    {};

  const api = {
    auth: {
      async getSession(): Promise<QueryResult<{ session: { user: { id: string; user_metadata: any; app_metadata: any } } | null }>> {
        const roleCookie = cookies().get("demo_role")?.value;
        const role = roleCookie ?? process.env.DEMO_ROLE ?? "employee";
        if (role === "visitor" || role === "guest") {
          return {
            data: { session: null },
            error: null
          };
        }
        return {
          data: {
            session: {
              user: {
                id: demoUserId,
                user_metadata: { role },
                app_metadata: { role }
              }
            }
          },
          error: null
        };
      },
      async getUser(): Promise<
        QueryResult<{ user: { id: string; user_metadata: any; app_metadata: any } | null }>
      > {
        const sess = await api.auth.getSession();
        const u = sess.data?.session?.user ?? null;
        return { data: { user: u }, error: null };
      }
    },
    from(table: string) {
      state.table = table;
      state.eq = undefined;
      state.range = undefined;
      return api;
    },
    select() {
      return api;
    },
    order(_column: string, _options?: { ascending?: boolean }) {
      return api;
    },
    eq(col: string, value: any) {
      state.eq = { col, value };
      return api;
    },
    range(from: number, to: number) {
      state.range = { from, to };
      return api;
    },
    async maybeSingle(): Promise<QueryResult<any>> {
      const table = state.table ?? "";
      let rows = (demoDb[table] ?? []).slice();
      if (state.eq) rows = applyEq(rows, state.eq.col, state.eq.value);
      const row = rows.length ? rows[0] : null;
      return { data: row, error: null };
    },
    async rpc(fn: string, args?: Record<string, unknown>) {
      if (fn === "get_public_property_offers") {
        return {
          data: [
            {
              id: "demo-prop-1",
              title: "مستودع تجريبي (شاغر — يظهر في الواجهة العامة)",
              summary: "وحدة للإيجار — نموذج من قاعدة التجربة.",
              property_type: "مستودع",
              price: 120000,
              image_url: null,
              city: "الرياض",
              district: "السلي",
              occupancy_status: "vacant"
            },
            {
              id: "demo-prop-occupied",
              title: "عقار مؤجّر (لا يظهر للجمهور)",
              summary: "اختبار فلتر الشاغر فقط.",
              property_type: "شقة",
              price: 80000,
              image_url: null,
              city: "جدة",
              district: "الروضة",
              occupancy_status: "occupied"
            }
          ],
          error: null
        };
      }
      if (fn === "verify_employee_department_code") {
        const code = String(args?.p_plain_code ?? "");
        return { data: /^\d{4}$/.test(String(code).trim()), error: null };
      }
      return { data: null, error: null };
    },
    async then(resolve: (value: any) => any) {
      const table = state.table ?? "";
      let rows = (demoDb[table] ?? []).slice();
      if (state.eq) rows = applyEq(rows, state.eq.col, state.eq.value);
      if (state.range) rows = pickRange(rows, state.range.from, state.range.to);
      return resolve({ data: rows, error: null });
    }
  };

  return api as any;
}

/** أرقام ثابتة من بيانات التجربة — للوحة المالية وتقارير المعاينة */
export function getDemoFinanceRollup() {
  const transfers = demoDb.owner_transfers ?? [];
  let commission = 0;
  let net = 0;
  let pending = 0;
  let transferred = 0;
  for (const r of transfers) {
    commission += Number(r.commission_deducted ?? 0);
    net += Number(r.net_amount_transferred ?? 0);
    const st = String(r.status ?? "");
    if (st === "pending") pending += 1;
    if (st === "transferred") transferred += 1;
  }
  return {
    commissionDeductedTotal: commission,
    netTransferredTotal: net,
    transferCount: transfers.length,
    pendingCount: pending,
    transferredCount: transferred,
    invoicesCount: demoDb.invoices?.length ?? 0,
    scheduleCount: demoDb.collection_schedule?.length ?? 0
  };
}

