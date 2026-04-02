import Link from "next/link";

const TYPE_LABELS: Record<string, string> = {
  apartment: "شقة",
  office: "مكتب",
  shop: "محل",
  villa: "فيلا",
  factory: "مصنع",
  warehouse: "مستودع",
  workshop: "ورشة",
  yard: "ساحة / فناء"
};

const HAZARD_LABELS: Record<string, string> = {
  high: "مرتفع (دفاع مدني)",
  medium: "متوسط",
  low: "منخفض"
};

const STATUS_LABELS: Record<string, string> = {
  vacant: "شاغر",
  occupied: "مؤجَر"
};

function str(v: unknown): string {
  if (v == null || v === "") return "";
  return String(v);
}

function fmtMoney(v: unknown): string {
  if (v == null || v === "") return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return `${n.toLocaleString("ar-SA")} ر.س`;
}

function fmtDate(v: unknown): string {
  if (v == null || v === "") return "—";
  const s = String(v);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function fmtCommission(v: unknown): string {
  if (v == null || v === "") return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  if (n <= 1 && n >= 0) return `${(n * 100).toFixed(1)}٪`;
  return `${n}٪`;
}

function needsHazard(t: string): boolean {
  return ["factory", "warehouse", "workshop", "yard"].includes(t);
}

type Props = {
  property: Record<string, unknown>;
  tenant: Record<string, unknown> | null;
};

export function PropertyDetailView({ property, tenant }: Props) {
  const ptype = str(property.type ?? property.property_type ?? "");
  const ownership = str(property.ownership_type ?? "");
  const statusKey = str(property.status ?? "").toLowerCase();
  const statusLabel = STATUS_LABELS[statusKey] ?? (statusKey || "—");
  const lat = property.latitude ?? property.lat;
  const lng = property.longitude ?? property.lng;
  const latN = lat != null && lat !== "" ? Number(lat) : NaN;
  const lngN = lng != null && lng !== "" ? Number(lng) : NaN;
  const hasCoords = !Number.isNaN(latN) && !Number.isNaN(lngN);
  const mapsUrl =
    str(property.maps_url) ||
    (hasCoords ? `https://www.google.com/maps?q=${latN},${lngN}&z=16` : "");
  const embedUrl = hasCoords
    ? `https://maps.google.com/maps?q=${latN},${lngN}&z=16&output=embed`
    : "";
  const showHazard = ptype && needsHazard(ptype);
  const hazard = str(property.hazard_level ?? "").toLowerCase();
  const showTenant = statusKey === "occupied" && tenant;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-900/10 pb-4">
        <div>
          <h3 className="text-xl font-bold text-brand-400">{str(property.name) || "عقار"}</h3>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {ptype ? (
              <span className="rounded-full bg-brand-100 px-3 py-1 font-medium text-brand-600">
                {TYPE_LABELS[ptype] ?? ptype}
              </span>
            ) : null}
            <span className="rounded-full border border-ink-900/15 bg-white px-3 py-1 text-ink-900/75">
              الحالة: {statusLabel}
            </span>
            {ownership ? (
              <span className="rounded-full border border-ink-900/10 px-3 py-1 text-ink-900/60">
                الملكية: {ownership}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-ink-900/10 bg-brand-50/40 p-4">
          <p className="text-xs font-semibold text-ink-900/55">المساحة والعمولة</p>
          <dl className="mt-2 space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-ink-900/60">المساحة (م²)</dt>
              <dd className="font-medium text-ink-900/90">
                {property.area_sqm != null && property.area_sqm !== ""
                  ? str(property.area_sqm)
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-900/60">نسبة العمولة</dt>
              <dd className="font-medium tabular-nums text-ink-900/90">
                {fmtCommission(property.commission_rate)}
              </dd>
            </div>
            {str(property.city) ? (
              <div className="flex justify-between gap-2">
                <dt className="text-ink-900/60">المدينة</dt>
                <dd className="font-medium text-ink-900/90">{str(property.city)}</dd>
              </div>
            ) : null}
            {str(property.management_start_date) ? (
              <div className="flex justify-between gap-2">
                <dt className="text-ink-900/60">بداية الإدارة</dt>
                <dd className="tabular-nums text-ink-900/90">
                  {fmtDate(property.management_start_date)}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="rounded-2xl border border-ink-900/10 bg-white p-4">
          <p className="text-xs font-semibold text-ink-900/55">الموقع (للموظف / الإدارة / المالك)</p>
          {hasCoords ? (
            <dl className="mt-2 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-ink-900/60">خط العرض</dt>
                <dd className="font-mono text-xs text-ink-900/90">{latN}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-900/60">خط الطول</dt>
                <dd className="font-mono text-xs text-ink-900/90">{lngN}</dd>
              </div>
              {mapsUrl ? (
                <div className="pt-1">
                  <Link
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-brand-500 hover:underline"
                  >
                    فتح في خرائط Google →
                  </Link>
                </div>
              ) : null}
            </dl>
          ) : (
            <p className="mt-2 text-sm text-ink-900/60">لا تتوفر إحداثيات مسجّلة لهذا العقار.</p>
          )}
        </div>
      </div>

      {showHazard ? (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-50/80 p-4">
          <p className="text-xs font-semibold text-amber-900/80">مستوى الخطر (مصانع / مستودعات / ورش / ساحات)</p>
          <p className="mt-1 text-sm text-ink-900/85">
            {hazard ? HAZARD_LABELS[hazard] ?? hazard : "غير محدد في النظام"}
          </p>
        </div>
      ) : null}

      {embedUrl ? (
        <div className="overflow-hidden rounded-2xl border border-ink-900/10">
          <p className="bg-brand-100 px-4 py-2 text-xs font-semibold text-ink-900/70">معاينة الخريطة</p>
          <iframe
            title="خريطة العقار"
            src={embedUrl}
            className="h-56 w-full border-0 bg-ink-900/5"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : null}

      {showTenant ? (
        <div className="rounded-2xl border border-ink-900/10 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-ink-900/55">بيانات المستأجر (عند التأجير)</p>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-ink-900/55">الاسم</dt>
              <dd className="font-medium text-ink-900/90">{str(tenant.full_name)}</dd>
            </div>
            <div>
              <dt className="text-ink-900/55">الجوال</dt>
              <dd className="tabular-nums text-ink-900/90">{str(tenant.phone)}</dd>
            </div>
            <div>
              <dt className="text-ink-900/55">الهوية</dt>
              <dd className="tabular-nums text-ink-900/90">{str(tenant.national_id)}</dd>
            </div>
            <div>
              <dt className="text-ink-900/55">الإيجار الشهري</dt>
              <dd className="font-medium tabular-nums text-ink-900/90">
                {fmtMoney(tenant.monthly_rent)}
              </dd>
            </div>
            <div>
              <dt className="text-ink-900/55">بداية العقد</dt>
              <dd className="tabular-nums">{fmtDate(tenant.contract_start)}</dd>
            </div>
            <div>
              <dt className="text-ink-900/55">نهاية العقد</dt>
              <dd className="tabular-nums">{fmtDate(tenant.contract_end)}</dd>
            </div>
          </dl>
        </div>
      ) : statusKey === "occupied" ? (
        <div className="rounded-2xl border border-ink-900/10 bg-brand-100/50 p-4 text-sm text-ink-900/75">
          الحالة «مؤجَر» دون سجل مستأجر مرتبط في قاعدة البيانات حالياً.
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 rounded-2xl border border-dashed border-ink-900/15 bg-ink-900/[0.02] p-4">
        <span className="text-sm text-ink-900/65">إجراءات لاحقة حسب المواصفات:</span>
        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded-full border border-ink-900/10 bg-white px-4 py-2 text-sm text-ink-900/45"
          title="يُربط برفع الملفات ومسار الموافقة"
        >
          رفع فاتورة صيانة
        </button>
        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded-full border border-ink-900/10 bg-white px-4 py-2 text-sm text-ink-900/45"
          title="توليد CTR-YYYY-XXXX"
        >
          إنشاء عقد PDF
        </button>
      </div>
    </div>
  );
}
