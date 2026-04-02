"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const TYPE_LABELS: Record<string, string> = {
  apartment: "شقة",
  office: "مكتب",
  shop: "محل",
  villa: "فيلا",
  factory: "مصنع",
  warehouse: "مستودع",
  workshop: "ورشة",
  yard: "حوش / ساحة"
};

const STATUS_LABELS: Record<string, string> = {
  vacant: "شاغر",
  occupied: "مؤجَر"
};

const HAZARD_LABELS: Record<string, string> = {
  high: "عالية",
  medium: "متوسطة",
  low: "منخفضة"
};

function str(v: unknown): string {
  if (v == null || v === "") return "—";
  return String(v);
}

function needsHazard(ptype: string): boolean {
  return ["factory", "warehouse", "workshop", "yard"].includes(ptype);
}

function fmtCommission(v: unknown): string {
  if (v == null || v === "") return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  if (n <= 1 && n >= 0) return `${(n * 100).toFixed(1)}٪`;
  return `${n}٪`;
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

function googleMapsHref(p: Record<string, unknown>): string {
  const lat = Number(p.latitude ?? NaN);
  const lng = Number(p.longitude ?? NaN);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }
  const q = [String(p.location ?? "").trim(), String(p.city ?? "").trim()].filter(Boolean).join(" ");
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : "https://www.google.com/maps";
}

const LocationMapPicker = dynamic(
  () => import("@/components/employee/location-map-picker").then((m) => m.LocationMapPicker),
  { ssr: false }
);

export function OwnerPortfolioView({
  owner,
  properties,
  tenantsByPropertyId
}: {
  owner: Record<string, unknown>;
  properties: Record<string, unknown>[];
  tenantsByPropertyId: Record<string, Record<string, unknown> | undefined>;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Record<string, unknown>[]>(properties);
  const [tenantsMap, setTenantsMap] = useState<Record<string, Record<string, unknown> | undefined>>(tenantsByPropertyId);
  const [formOpen, setFormOpen] = useState(false);
  const [mapTarget, setMapTarget] = useState<"create" | "edit" | null>(null);
  const [pendingPoint, setPendingPoint] = useState<{ latitude: number; longitude: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmingMap, setConfirmingMap] = useState(false);
  const [locatingCurrent, setLocatingCurrent] = useState(false);
  const [ownerEditOpen, setOwnerEditOpen] = useState(false);
  const [ownerSaving, setOwnerSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deletingOwner, setDeletingOwner] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [propertySaving, setPropertySaving] = useState(false);
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ownerForm, setOwnerForm] = useState({
    fullName: String(owner.full_name ?? ""),
    phone: String(owner.phone ?? ""),
    email: String(owner.email ?? "")
  });
  const [editPropertyForm, setEditPropertyForm] = useState({
    propertyId: "",
    propertyName: "",
    location: "",
    city: "",
    latitude: "",
    longitude: "",
    mapAddress: "",
    propertyType: "",
    areaSqm: "",
    commissionPercent: "",
    conditionStatus: "good",
    tenantId: "",
    tenantName: "",
    tenantPhone: "",
    contractStart: "",
    contractEnd: ""
  });
  const [form, setForm] = useState({
    propertyName: "",
    location: "",
    city: "",
    latitude: "",
    longitude: "",
    mapAddress: "",
    propertyType: "apartment",
    areaSqm: "",
    commissionPercent: "",
    conditionStatus: "good",
    tenantName: "",
    tenantPhone: "",
    contractStart: "",
    contractEnd: ""
  });

  const ownerId = useMemo(() => String(owner.id ?? ""), [owner.id]);
  const isOwnerArchived = owner.archived === true || owner.is_archived === true;

  function openMap(target: "create" | "edit") {
    setMapTarget(target);
    if (target === "edit") {
      setPendingPoint(
        editPropertyForm.latitude && editPropertyForm.longitude
          ? { latitude: Number(editPropertyForm.latitude), longitude: Number(editPropertyForm.longitude) }
          : null
      );
      return;
    }
    setPendingPoint(
      form.latitude && form.longitude ? { latitude: Number(form.latitude), longitude: Number(form.longitude) } : null
    );
  }

  async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
    try {
      const geocode = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
      );
      const geocodeJson = (await geocode.json().catch(() => ({}))) as { display_name?: string };
      return String(geocodeJson.display_name ?? "").trim();
    } catch {
      return "";
    }
  }

  async function confirmSelectedMapLocation() {
    if (!pendingPoint) {
      setError("اختر نقطة على الخريطة أولاً.");
      return;
    }
    setConfirmingMap(true);
    setError(null);
    let resolvedAddress = "";
    try {
      resolvedAddress = await reverseGeocode(pendingPoint.latitude, pendingPoint.longitude);
    } finally {
      setConfirmingMap(false);
    }

    if (mapTarget === "edit") {
      setEditPropertyForm((prev) => ({
        ...prev,
        latitude: String(pendingPoint.latitude),
        longitude: String(pendingPoint.longitude),
        mapAddress: resolvedAddress || prev.mapAddress,
        location: resolvedAddress || `${pendingPoint.latitude}, ${pendingPoint.longitude}`
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        latitude: String(pendingPoint.latitude),
        longitude: String(pendingPoint.longitude),
        mapAddress: resolvedAddress || prev.mapAddress,
        location: resolvedAddress || `${pendingPoint.latitude}, ${pendingPoint.longitude}`
      }));
    }
    setMapTarget(null);
  }

  async function locateCurrentInMapOnly() {
    if (!navigator.geolocation) {
      setError("المتصفح لا يدعم تحديد الموقع الحالي.");
      return;
    }
    setLocatingCurrent(true);
    setError(null);

    // Some browsers (Chrome/Edge especially) are stricter about secure context and can fail fast with
    // high accuracy. We retry with different options and show the real error when possible.
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setLocatingCurrent(false);
      setError("تعذر الحصول على موقعك الحالي. يرجى استخدام اتصال آمن (https) أو localhost.");
      return;
    }

    const getCoords = (options: PositionOptions) =>
      new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          (err) => reject(err),
          options
        );
      });

    try {
      // Attempt 1: high accuracy.
      const coords = await getCoords({ enableHighAccuracy: true, timeout: 25000, maximumAge: 10000 });
      setPendingPoint({ latitude: coords.latitude, longitude: coords.longitude });
      setLocatingCurrent(false);
      return;
    } catch (err) {
      // Fallback: less strict settings (improves compatibility).
      try {
        const fallbackCoords = await getCoords({ enableHighAccuracy: false, timeout: 25000, maximumAge: 30000 });
        setPendingPoint({ latitude: fallbackCoords.latitude, longitude: fallbackCoords.longitude });
        setLocatingCurrent(false);
        return;
      } catch (fallbackErr) {
        const maybeError = fallbackErr as GeolocationPositionError;
        const codePart = typeof maybeError?.code === "number" ? ` (code: ${maybeError.code})` : "";
        const messagePart = maybeError?.message ? ` - ${maybeError.message}` : "";
        setLocatingCurrent(false);
        setError(`تعذر الحصول على موقعك الحالي. تأكد من السماح بالموقع.${codePart}${messagePart}`);
      }
    }
  }

  async function onSaveOwner() {
    setOwnerSaving(true);
    setError(null);
    const res = await fetch("/api/employee/owners/update", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ownerId, ...ownerForm })
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    setOwnerSaving(false);
    if (!res.ok || !data.ok) {
      setError(data.error ?? "تعذر تحديث بيانات المالك.");
      return;
    }
    setOwnerEditOpen(false);
    router.refresh();
  }

  async function onArchiveOwner(archived: boolean) {
    setArchiving(true);
    setError(null);
    const res = await fetch("/api/employee/owners/archive", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ownerId, archived })
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    setArchiving(false);
    if (!res.ok || !data.ok) {
      setError(data.error ?? "تعذر تحديث حالة الأرشفة.");
      return;
    }
    router.push(archived ? "/employee/owners/archive" : "/employee/owners");
    router.refresh();
  }

  async function onDeleteOwner() {
    if (!confirm("متأكد من حذف المالك بالكامل مع عقاراته؟")) return;
    setDeletingOwner(true);
    setError(null);
    const res = await fetch("/api/employee/owners/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ownerId })
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    setDeletingOwner(false);
    if (!res.ok || !data.ok) {
      setError(data.error ?? "تعذر حذف المالك.");
      return;
    }
    router.push("/employee/owners");
    router.refresh();
  }

  function beginEditProperty(p: Record<string, unknown>) {
    const propertyId = String(p.id ?? "");
    const tenant = tenantsMap[propertyId];
    setEditingPropertyId(propertyId);
    setEditPropertyForm({
      propertyId,
      propertyName: String(p.name ?? ""),
      location: String(p.location ?? ""),
      city: String(p.city ?? ""),
      latitude: String(p.latitude ?? ""),
      longitude: String(p.longitude ?? ""),
      mapAddress: String(p.map_address ?? ""),
      propertyType: String(p.type ?? ""),
      areaSqm: String(p.area_sqm ?? ""),
      commissionPercent: (() => {
        const v = Number(p.commission_rate ?? 0);
        return Number.isFinite(v) ? String(v * 100) : "";
      })(),
      conditionStatus: String(p.property_condition ?? "good"),
      tenantId: String(tenant?.id ?? ""),
      tenantName: String(tenant?.full_name ?? ""),
      tenantPhone: String(tenant?.phone ?? ""),
      contractStart: fmtDate(tenant?.contract_start) === "—" ? "" : fmtDate(tenant?.contract_start),
      contractEnd: fmtDate(tenant?.contract_end) === "—" ? "" : fmtDate(tenant?.contract_end)
    });
  }

  async function onSavePropertyEdit() {
    const editingId = editingPropertyId;
    setPropertySaving(true);
    setError(null);
    const res = await fetch("/api/employee/properties/update", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(editPropertyForm)
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      property?: Record<string, unknown>;
      tenant?: Record<string, unknown> | null;
    };
    setPropertySaving(false);
    if (!res.ok || !data.ok || !data.property) {
      setError(data.error ?? "تعذر تعديل بيانات العقار.");
      setEditingPropertyId(editingId);
      return;
    }
    const propId = String(editPropertyForm.propertyId || data.property.id || "");
    const localUpdatedProperty: Record<string, unknown> = {
      ...(data.property as Record<string, unknown>),
      id: propId,
      name: editPropertyForm.propertyName,
      location: editPropertyForm.location,
      city: editPropertyForm.city,
      latitude: editPropertyForm.latitude ? Number(editPropertyForm.latitude) : null,
      longitude: editPropertyForm.longitude ? Number(editPropertyForm.longitude) : null,
      map_address: editPropertyForm.mapAddress,
      type: editPropertyForm.propertyType || null,
      area_sqm: editPropertyForm.areaSqm ? Number(editPropertyForm.areaSqm) : null,
      commission_rate: editPropertyForm.commissionPercent ? Number(editPropertyForm.commissionPercent) / 100 : null,
      property_condition: editPropertyForm.conditionStatus
    };
    setRows((prev) => prev.map((row) => (String(row.id ?? "") === propId ? localUpdatedProperty : row)));
    const localTenant: Record<string, unknown> = {
      ...(data.tenant as Record<string, unknown>),
      id: editPropertyForm.tenantId || data.tenant?.id || "",
      property_id: propId,
      full_name: editPropertyForm.tenantName || null,
      phone: editPropertyForm.tenantPhone || null,
      contract_start: editPropertyForm.contractStart || null,
      contract_end: editPropertyForm.contractEnd || null
    };
    setTenantsMap((prev) => ({ ...prev, [propId]: localTenant }));
    setEditingPropertyId(null);
    setEditPropertyForm({
      propertyId: "",
      propertyName: "",
      location: "",
      city: "",
      latitude: "",
      longitude: "",
      mapAddress: "",
      propertyType: "",
      areaSqm: "",
      commissionPercent: "",
      conditionStatus: "good",
      tenantId: "",
      tenantName: "",
      tenantPhone: "",
      contractStart: "",
      contractEnd: ""
    });
    // Keep the panel closed and updated table visible immediately.
    router.refresh();
  }

  async function onDeleteProperty(propertyId: string) {
    if (!confirm("متأكد من حذف العقار بالكامل؟")) return;
    setDeletingPropertyId(propertyId);
    setError(null);
    const res = await fetch("/api/employee/properties/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ propertyId })
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    setDeletingPropertyId(null);
    if (!res.ok || !data.ok) {
      setError(data.error ?? "تعذر حذف العقار.");
      return;
    }
    setRows((prev) => prev.filter((row) => String(row.id ?? "") !== propertyId));
    setTenantsMap((prev) => {
      const copy = { ...prev };
      delete copy[propertyId];
      return copy;
    });
  }

  async function onCreateProperty(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/employee/properties/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ownerId, ...form })
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      property?: Record<string, unknown>;
      tenant?: Record<string, unknown> | null;
    };
    setSaving(false);
    if (!res.ok || !data.ok || !data.property) {
      setError(data.error ?? "تعذر إضافة العقار.");
      return;
    }
    const newPropId = String(data.property.id ?? "");
    setRows((prev) => [data.property as Record<string, unknown>, ...prev]);
    if (newPropId && data.tenant) {
      setTenantsMap((prev) => ({ ...prev, [newPropId]: data.tenant as Record<string, unknown> }));
    }
    setFormOpen(false);
    setForm({
      propertyName: "",
      location: "",
      city: "",
      latitude: "",
      longitude: "",
      mapAddress: "",
      propertyType: "apartment",
      areaSqm: "",
      commissionPercent: "",
      conditionStatus: "good",
      tenantName: "",
      tenantPhone: "",
      contractStart: "",
      contractEnd: ""
    });
  }

  return (
    <div className="rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gold-600">👤 بيانات المالك</p>
          <h2 className="mt-1 text-2xl font-bold text-brand-400">{str(owner.full_name)}</h2>
        </div>
        <Link
          href="/employee/owners/new"
          prefetch={false}
          className="rounded-full border border-ink-900/10 bg-brand-50 px-4 py-2 text-sm font-bold text-brand-500 hover:border-gold-400"
        >
          + إضافة مالك
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Info label="الجوال" value={str(owner.phone)} />
        <Info label="الإيميل" value={str(owner.email)} />
        <Info label="الاسم" value={str(owner.full_name)} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setOwnerEditOpen((v) => !v)}
          className="rounded-full border border-brand-400 px-4 py-2 text-sm font-bold text-brand-500 hover:bg-brand-50"
        >
          تعديل بيانات المالك
        </button>
        <button
          type="button"
          onClick={() => onArchiveOwner(!isOwnerArchived)}
          disabled={archiving}
          className="rounded-full border border-ink-900/15 px-4 py-2 text-sm font-bold text-ink-900/80 hover:border-gold-400 disabled:opacity-60"
        >
          {archiving ? "جارٍ التنفيذ..." : isOwnerArchived ? "استرجاع من الأرشيف" : "أرشفة المالك"}
        </button>
        <button
          type="button"
          onClick={onDeleteOwner}
          disabled={deletingOwner}
          className="rounded-full border border-red-500/40 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          {deletingOwner ? "جارٍ الحذف..." : "حذف المالك نهائيًا"}
        </button>
      </div>
      {ownerEditOpen ? (
        <div className="mt-3 grid gap-3 rounded-2xl border border-ink-900/10 bg-brand-50/40 p-4 md:grid-cols-3">
          <Input label="اسم المالك" value={ownerForm.fullName} onChange={(v) => setOwnerForm((f) => ({ ...f, fullName: v }))} required />
          <Input label="الجوال" value={ownerForm.phone} onChange={(v) => setOwnerForm((f) => ({ ...f, phone: v }))} />
          <Input label="الإيميل" value={ownerForm.email} onChange={(v) => setOwnerForm((f) => ({ ...f, email: v }))} />
          <div className="md:col-span-3">
            <button
              type="button"
              onClick={onSaveOwner}
              disabled={ownerSaving}
              className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {ownerSaving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-900/45">🏢 عقارات المالك</p>
          <button
            type="button"
            onClick={() => setFormOpen((v) => !v)}
            className="rounded-full bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-400"
          >
            إضافة عقار جديد
          </button>
        </div>

        {formOpen ? (
          <form onSubmit={onCreateProperty} className="mb-4 rounded-2xl border border-ink-900/10 bg-brand-50/40 p-4">
            <div className="grid gap-3 md:grid-cols-3">
              <Input label="اسم العقار" value={form.propertyName} onChange={(v) => setForm((f) => ({ ...f, propertyName: v }))} required />
              <div className="md:col-span-2">
                <span className="mb-1 block text-sm font-semibold text-ink-900/80">الموقع</span>
                <div className="flex gap-2">
                  <input
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    className="w-full rounded-xl border border-ink-900/15 bg-white px-3 py-2 text-ink-900 outline-none focus:border-brand-400"
                  />
                  <button
                    type="button"
                    onClick={() => openMap("create")}
                    className="shrink-0 rounded-xl border border-brand-400 px-3 py-2 text-sm font-bold text-brand-500 hover:bg-brand-50"
                  >
                    تحديد على الخريطة
                  </button>
                </div>
                <p className="mt-1 text-xs text-ink-900/60">
                  اضغط &quot;تحديد على الخريطة&quot; ثم اختر نقطة واضغط &quot;تأكيد الموقع&quot;.
                </p>
              </div>
              <Input label="المدينة" value={form.city} onChange={(v) => setForm((f) => ({ ...f, city: v }))} />
              <Input label="Latitude" value={form.latitude} onChange={(v) => setForm((f) => ({ ...f, latitude: v }))} />
              <Input label="Longitude" value={form.longitude} onChange={(v) => setForm((f) => ({ ...f, longitude: v }))} />
              <Input label="عنوان الموقع (من الخريطة)" value={form.mapAddress} onChange={(v) => setForm((f) => ({ ...f, mapAddress: v }))} />
              <Input label="النوع" value={form.propertyType} onChange={(v) => setForm((f) => ({ ...f, propertyType: v }))} />
              <Input label="المساحة" value={form.areaSqm} onChange={(v) => setForm((f) => ({ ...f, areaSqm: v }))} />
              <Input label="النسبة %" value={form.commissionPercent} onChange={(v) => setForm((f) => ({ ...f, commissionPercent: v }))} />
              <Input label="الحالة (سليم/يحتاج صيانة)" value={form.conditionStatus} onChange={(v) => setForm((f) => ({ ...f, conditionStatus: v }))} />
              <Input label="اسم المستأجر" value={form.tenantName} onChange={(v) => setForm((f) => ({ ...f, tenantName: v }))} />
              <Input label="جوال المستأجر" value={form.tenantPhone} onChange={(v) => setForm((f) => ({ ...f, tenantPhone: v }))} />
              <Input label="تاريخ بداية العقد" value={form.contractStart} onChange={(v) => setForm((f) => ({ ...f, contractStart: v }))} type="date" />
              <Input label="تاريخ نهاية العقد" value={form.contractEnd} onChange={(v) => setForm((f) => ({ ...f, contractEnd: v }))} type="date" />
            </div>
            {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
            <button
              type="submit"
              disabled={saving}
              className="mt-3 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {saving ? "جارٍ الحفظ..." : "حفظ العقار"}
            </button>
          </form>
        ) : null}
        {mapTarget ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-3xl rounded-2xl bg-white p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-lg font-bold text-brand-400">تحديد الموقع على الخريطة</h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={locateCurrentInMapOnly}
                    disabled={locatingCurrent}
                    title="موقعي الحالي"
                    className="rounded-lg border border-ink-900/15 px-3 py-1 text-lg font-bold text-ink-900/80 disabled:opacity-60"
                  >
                    {locatingCurrent ? "..." : "📍"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapTarget(null)}
                    className="rounded-lg border border-ink-900/15 px-3 py-1 text-sm font-semibold text-ink-900/80"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
              <LocationMapPicker
                initialLatitude={
                  mapTarget === "edit"
                    ? editPropertyForm.latitude
                      ? Number(editPropertyForm.latitude)
                      : null
                    : form.latitude
                      ? Number(form.latitude)
                      : null
                }
                initialLongitude={
                  mapTarget === "edit"
                    ? editPropertyForm.longitude
                      ? Number(editPropertyForm.longitude)
                      : null
                    : form.longitude
                      ? Number(form.longitude)
                      : null
                }
                selectedPoint={pendingPoint}
                onSelectionChange={(pick) => setPendingPoint(pick)}
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="text-sm">
                  {pendingPoint ? (
                    <div className="space-y-1">
                      <p className="font-semibold text-emerald-700">تم تحديد موقعك بنجاح - اضغط تأكيد الموقع.</p>
                      <p className="text-ink-900/70">
                        {`Lat: ${pendingPoint.latitude.toFixed(6)} | Lng: ${pendingPoint.longitude.toFixed(6)}`}
                      </p>
                    </div>
                  ) : (
                    <p className="text-ink-900/70">لم يتم اختيار نقطة بعد</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={confirmSelectedMapLocation}
                  disabled={!pendingPoint || confirmingMap}
                  className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                >
                  {confirmingMap ? "جارٍ التأكيد..." : "تأكيد الموقع"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-2xl border border-ink-900/10">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead className="bg-brand-100 text-ink-900/85">
              <tr>
                <th className="px-3 py-3 text-right font-semibold">اسم العقار</th>
                <th className="px-3 py-3 text-right font-semibold">الموقع</th>
                <th className="px-3 py-3 text-right font-semibold">النسبة %</th>
                <th className="px-3 py-3 text-right font-semibold">حالة العقار</th>
                <th className="px-3 py-3 text-right font-semibold">اسم المستأجر</th>
                <th className="px-3 py-3 text-right font-semibold">جوال المستأجر</th>
                <th className="px-3 py-3 text-right font-semibold">بداية العقد</th>
                <th className="px-3 py-3 text-right font-semibold">نهاية العقد</th>
                <th className="px-3 py-3 text-right font-semibold">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-5 text-ink-900/70" colSpan={9}>
                    لا توجد عقارات مرتبطة بهذا المالك حالياً.
                  </td>
                </tr>
              ) : (
                rows.map((p) => {
                  const id = String(p.id ?? "");
                  const tenant = tenantsMap[id];
                  return (
                    <tr key={id} className="border-t border-ink-900/5">
                      <td className="px-3 py-3">{str(p.name)}</td>
                      <td className="px-3 py-3">
                        <a
                          href={googleMapsHref(p)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-500 underline-offset-2 hover:underline"
                        >
                          {[str(p.location), str(p.city)].filter((v) => v !== "—").join(" - ") || "فتح الموقع"}
                        </a>
                      </td>
                      <td className="px-3 py-3">{fmtCommission(p.commission_rate)}</td>
                      <td className="px-3 py-3">{str(p.property_condition)}</td>
                      <td className="px-3 py-3">{str(tenant?.full_name)}</td>
                      <td className="px-3 py-3">{str(tenant?.phone)}</td>
                      <td className="px-3 py-3">{fmtDate(tenant?.contract_start)}</td>
                      <td className="px-3 py-3">{fmtDate(tenant?.contract_end)}</td>
                      <td className="px-3 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => beginEditProperty(p)}
                            className="rounded-full border border-brand-400 px-3 py-1 text-xs font-bold text-brand-500 hover:bg-brand-50"
                          >
                            تعديل
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteProperty(id)}
                            disabled={deletingPropertyId === id}
                            className="rounded-full border border-red-500/40 px-3 py-1 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-60"
                          >
                            {deletingPropertyId === id ? "..." : "حذف"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {editingPropertyId ? (
          <div className="mt-4 rounded-2xl border border-ink-900/10 bg-brand-50/40 p-4">
            <h4 className="mb-3 text-base font-bold text-brand-400">تعديل بيانات العقار</h4>
            <div className="grid gap-3 md:grid-cols-3">
              <Input label="اسم العقار" value={editPropertyForm.propertyName} onChange={(v) => setEditPropertyForm((f) => ({ ...f, propertyName: v }))} required />
              <div className="md:col-span-2">
                <span className="mb-1 block text-sm font-semibold text-ink-900/80">الموقع</span>
                <div className="flex gap-2">
                  <input
                    value={editPropertyForm.location}
                    onChange={(e) => setEditPropertyForm((f) => ({ ...f, location: e.target.value }))}
                    className="w-full rounded-xl border border-ink-900/15 bg-white px-3 py-2 text-ink-900 outline-none focus:border-brand-400"
                  />
                  <button
                    type="button"
                    onClick={() => openMap("edit")}
                    title="تحديد على الخريطة"
                    className="shrink-0 rounded-xl border border-brand-400 px-3 py-2 text-sm font-bold text-brand-500 hover:bg-brand-50"
                  >
                    تحديد على الخريطة
                  </button>
                </div>
              </div>
              <Input label="المدينة" value={editPropertyForm.city} onChange={(v) => setEditPropertyForm((f) => ({ ...f, city: v }))} />
              <Input label="Latitude" value={editPropertyForm.latitude} onChange={(v) => setEditPropertyForm((f) => ({ ...f, latitude: v }))} />
              <Input label="Longitude" value={editPropertyForm.longitude} onChange={(v) => setEditPropertyForm((f) => ({ ...f, longitude: v }))} />
              <Input label="عنوان الموقع" value={editPropertyForm.mapAddress} onChange={(v) => setEditPropertyForm((f) => ({ ...f, mapAddress: v }))} />
              <Input label="النوع" value={editPropertyForm.propertyType} onChange={(v) => setEditPropertyForm((f) => ({ ...f, propertyType: v }))} />
              <Input label="المساحة" value={editPropertyForm.areaSqm} onChange={(v) => setEditPropertyForm((f) => ({ ...f, areaSqm: v }))} />
              <Input label="النسبة %" value={editPropertyForm.commissionPercent} onChange={(v) => setEditPropertyForm((f) => ({ ...f, commissionPercent: v }))} />
              <Input label="حالة العقار" value={editPropertyForm.conditionStatus} onChange={(v) => setEditPropertyForm((f) => ({ ...f, conditionStatus: v }))} />
              <Input label="اسم المستأجر" value={editPropertyForm.tenantName} onChange={(v) => setEditPropertyForm((f) => ({ ...f, tenantName: v }))} />
              <Input label="جوال المستأجر" value={editPropertyForm.tenantPhone} onChange={(v) => setEditPropertyForm((f) => ({ ...f, tenantPhone: v }))} />
              <Input label="بداية العقد" value={editPropertyForm.contractStart} onChange={(v) => setEditPropertyForm((f) => ({ ...f, contractStart: v }))} type="date" />
              <Input label="نهاية العقد" value={editPropertyForm.contractEnd} onChange={(v) => setEditPropertyForm((f) => ({ ...f, contractEnd: v }))} type="date" />
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={onSavePropertyEdit}
                disabled={propertySaving}
                className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                {propertySaving ? "جارٍ الحفظ..." : "حفظ تعديل العقار"}
              </button>
              <button
                type="button"
                onClick={() => setEditingPropertyId(null)}
                className="rounded-xl border border-ink-900/15 px-4 py-2 text-sm font-semibold text-ink-900/80"
              >
                إلغاء
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-900/10 bg-white px-4 py-3">
      <p className="text-xs font-semibold text-ink-900/55">{label}</p>
      <p className="mt-1 text-sm font-medium text-ink-900/90">{value}</p>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  required,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-ink-900/80">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        type={type}
        className="w-full rounded-xl border border-ink-900/15 bg-white px-3 py-2 text-ink-900 outline-none focus:border-brand-400"
      />
    </label>
  );
}

