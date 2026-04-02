"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FEATURE_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  PROPERTY_TYPES_WITH_HAZARD,
  type FeatureKey,
  type PaymentMethodValue
} from "@/lib/marketing/listing-form-constants";

const cityOptions = ["الرياض", "جدة", "الدمام", "مكة", "المدينة", "الخبر", "الطائف"];
const districtOptions = ["السلي", "الملقا", "النرجس", "الياسمين", "العليا", "الصحافة", "النسيم"];
const typeOptions = [
  "مصنع",
  "مستودع",
  "ورشة",
  "حوش",
  "أرض صناعية",
  "أرض تجارية",
  "أرض سكنية",
  "شقة",
  "دور",
  "فيلا",
  "مكتب تجاري",
  "عمارة تجارية",
  "سكن عمال"
];

function buildFeaturesRecord(selected: Set<FeatureKey>) {
  const o: Record<string, boolean> = {};
  for (const { key } of FEATURE_OPTIONS) {
    o[key] = selected.has(key);
  }
  return o;
}

export function MarketingOfferCreateForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [listingMode, setListingMode] = useState<"sale" | "rent">("sale");
  const [price, setPrice] = useState("");
  const [areaSqm, setAreaSqm] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodValue>("cash");
  const [hazardLevel, setHazardLevel] = useState<"high" | "medium" | "low" | "">("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [featuresPick, setFeaturesPick] = useState<Set<FeatureKey>>(new Set());
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [galleryDraft, setGalleryDraft] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const showHazard = useMemo(
    () => PROPERTY_TYPES_WITH_HAZARD.has(propertyType.trim()),
    [propertyType]
  );

  const mapEmbedSrc = useMemo(() => {
    const lat = parseFloat(latitude.replace(",", "."));
    const lng = parseFloat(longitude.replace(",", "."));
    if (
      Number.isNaN(lat) ||
      Number.isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return null;
    }
    return `https://www.google.com/maps?q=${lat},${lng}&z=16&hl=ar&output=embed`;
  }, [latitude, longitude]);

  function toggleFeature(key: FeatureKey) {
    setFeaturesPick((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function addGalleryUrlFromDraft() {
    const u = galleryDraft.trim();
    if (!u) return;
    try {
      // eslint-disable-next-line no-new -- validation only
      new URL(u);
    } catch {
      setError("رابط صورة غير صالح.");
      return;
    }
    if (galleryUrls.length >= 8) {
      setError("الحد الأقصى 8 صور.");
      return;
    }
    setGalleryUrls((g) => [...g, u]);
    setGalleryDraft("");
    setError(null);
  }

  function removeGalleryAt(i: number) {
    setGalleryUrls((g) => g.filter((_, idx) => idx !== i));
  }

  function setMainGalleryAt(i: number) {
    if (i <= 0) return;
    setGalleryUrls((g) => {
      const copy = [...g];
      const [picked] = copy.splice(i, 1);
      return [picked, ...copy];
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOk(false);
    try {
      const area = String(areaSqm).trim();
      if (area && (Number.isNaN(Number(area)) || Number(area) <= 0)) {
        throw new Error("أدخل مساحة صحيحة بالمتر المربّع.");
      }
      if (showHazard && !hazardLevel) {
        throw new Error("اختر مستوى الخطورة لهذا النوع من العقار.");
      }
      if (!showHazard && hazardLevel) {
        /* allow — server clears */
      }
      const latStr = latitude.trim();
      const lngStr = longitude.trim();
      if (latStr || lngStr) {
        const lat = parseFloat(latStr.replace(",", "."));
        const lng = parseFloat(lngStr.replace(",", "."));
        if (Number.isNaN(lat) || Number.isNaN(lng)) {
          throw new Error("خطوط الطول والعرض يجب أن تكون أرقاماً صحيحة.");
        }
      }
      const v = videoUrl.trim();
      if (v && !/\.mp4(\?|$)/i.test(v) && !v.includes("youtube")) {
        /* optional mp4 url — soft warn only */
      }

      const mainImageUrl = galleryUrls[0] ?? "";

      const res = await fetch("/api/employee/marketing/offers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          propertyType: propertyType.trim(),
          city: city.trim(),
          district: district.trim(),
          listingMode,
          price: price.trim(),
          areaSqm: area || undefined,
          paymentMethod,
          hazardLevel: showHazard ? hazardLevel : undefined,
          latitude: latStr || undefined,
          longitude: lngStr || undefined,
          features: buildFeaturesRecord(featuresPick),
          galleryUrls,
          mainImageUrl,
          videoUrl: videoUrl.trim() || undefined,
          description: description.trim()
        })
      });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        throw new Error(j.error || "تعذّر تسجيل العرض.");
      }
      setOk(true);
      setTimeout(() => {
        router.push("/employee/marketing");
        router.refresh();
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6 rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm"
    >
      <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950/90">
        رفع الملفات إلى <strong>Supabase Storage</strong> (مسار <code>marketing-offers/{"{listing_id}"}/</code>)
        يُفعّل عند ربط قاعدة البيانات؛ حالياً يمكنك إدخال روابط صور مباشرة (حتى 8، الأولى رئيسية).
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-ink-900/80">عنوان العرض</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-xl border border-ink-900/15 bg-white px-3 py-2.5 text-ink-900 outline-none focus:border-brand-400"
            placeholder="مثال: مستودع في حي السلي"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-ink-900/80">نوع العقار</label>
          <input
            value={propertyType}
            onChange={(e) => {
              setPropertyType(e.target.value);
              if (!PROPERTY_TYPES_WITH_HAZARD.has(e.target.value.trim())) setHazardLevel("");
            }}
            list="marketing-offer-types"
            className="mt-1 w-full rounded-xl border border-ink-900/15 bg-white px-3 py-2.5 text-ink-900 outline-none focus:border-brand-400"
            placeholder="اختر أو اكتب النوع"
            required
          />
          <datalist id="marketing-offer-types">
            {typeOptions.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-sm font-semibold text-ink-900/80">نوع العرض</label>
          <select
            value={listingMode}
            onChange={(e) => setListingMode(e.target.value as "sale" | "rent")}
            className="mt-1 w-full rounded-xl border border-ink-900/15 bg-white px-3 py-2.5 text-ink-900 outline-none focus:border-brand-400"
          >
            <option value="sale">للبيع</option>
            <option value="rent">للإيجار</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-ink-900/80">طريقة الدفع</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodValue)}
            className="mt-1 w-full rounded-xl border border-ink-900/15 bg-white px-3 py-2.5 text-ink-900 outline-none focus:border-brand-400"
          >
            {PAYMENT_METHOD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-ink-900/80">المساحة (م²)</label>
          <input
            value={areaSqm}
            onChange={(e) => setAreaSqm(e.target.value)}
            inputMode="decimal"
            className="mt-1 w-full rounded-xl border border-ink-900/15 bg-white px-3 py-2.5 text-ink-900 outline-none focus:border-brand-400"
            placeholder="مثال: 1200"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-ink-900/80">السعر (رقم)</label>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            className="mt-1 w-full rounded-xl border border-ink-900/15 bg-white px-3 py-2.5 text-ink-900 outline-none focus:border-brand-400"
            placeholder="300000"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-ink-900/80">المدينة</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            list="marketing-offer-cities"
            className="mt-1 w-full rounded-xl border border-ink-900/15 bg-white px-3 py-2.5 text-ink-900 outline-none focus:border-brand-400"
            required
          />
          <datalist id="marketing-offer-cities">
            {cityOptions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-sm font-semibold text-ink-900/80">الحي / المنطقة</label>
          <input
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            list="marketing-offer-districts"
            className="mt-1 w-full rounded-xl border border-ink-900/15 bg-white px-3 py-2.5 text-ink-900 outline-none focus:border-brand-400"
            required
          />
          <datalist id="marketing-offer-districts">
            {districtOptions.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </div>
      </div>

      {showHazard ? (
        <fieldset className="rounded-xl border border-ink-900/10 bg-brand-50/40 p-4">
          <legend className="px-1 text-sm font-bold text-ink-900">مستوى الخطورة (صناعي)</legend>
          <div className="mt-2 flex flex-wrap gap-4">
            {(
              [
                { v: "high" as const, label: "عالي" },
                { v: "medium" as const, label: "متوسط" },
                { v: "low" as const, label: "منخفض" }
              ] as const
            ).map(({ v, label }) => (
              <label key={v} className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink-900">
                <input
                  type="radio"
                  name="hazard"
                  checked={hazardLevel === v}
                  onChange={() => setHazardLevel(v)}
                  className="text-brand-500"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <div>
        <p className="mb-2 text-sm font-semibold text-ink-900/80">المميزات</p>
        <div className="flex flex-wrap gap-3">
          {FEATURE_OPTIONS.map(({ key, label }) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink-900/15 bg-[#f5f3ef] px-3 py-2 text-sm text-ink-900"
            >
              <input
                type="checkbox"
                checked={featuresPick.has(key)}
                onChange={() => toggleFeature(key)}
                className="rounded border-ink-900/30 text-brand-500"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-ink-900/80">خط العرض (latitude)</label>
          <input
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            inputMode="decimal"
            className="mt-1 w-full rounded-xl border border-ink-900/15 bg-white px-3 py-2.5 font-mono text-sm text-ink-900 outline-none focus:border-brand-400"
            placeholder="24.7136"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-ink-900/80">خط الطول (longitude)</label>
          <input
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            inputMode="decimal"
            className="mt-1 w-full rounded-xl border border-ink-900/15 bg-white px-3 py-2.5 font-mono text-sm text-ink-900 outline-none focus:border-brand-400"
            placeholder="46.6753"
          />
        </div>
      </div>
      {mapEmbedSrc ? (
        <div className="overflow-hidden rounded-xl border border-ink-900/15">
          <p className="bg-[#f5f3ef] px-3 py-2 text-xs font-semibold text-ink-900/70">معاينة الخريطة</p>
          <iframe
            title="معاينة موقع العرض"
            src={mapEmbedSrc}
            className="h-56 w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : (
        <p className="text-xs text-ink-900/55">أدخل خطي طول وعرض صحيحين لعرض خريطة Google.</p>
      )}

      <div>
        <p className="mb-2 text-sm font-semibold text-ink-900/80">معرض الصور (حتى 8 — الأولى صورة رئيسية)</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={galleryDraft}
            onChange={(e) => setGalleryDraft(e.target.value)}
            type="url"
            className="flex-1 rounded-xl border border-ink-900/15 bg-white px-3 py-2.5 text-ink-900 outline-none focus:border-brand-400"
            placeholder="https://... (رابط صورة)"
          />
          <button
            type="button"
            onClick={addGalleryUrlFromDraft}
            disabled={galleryUrls.length >= 8}
            className="rounded-xl border border-gold-400/50 bg-gold-400/15 px-4 py-2.5 text-sm font-bold text-ink-900 hover:bg-gold-400/25 disabled:opacity-50"
          >
            إضافة للمعرض
          </button>
        </div>
        {galleryUrls.length > 0 ? (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {galleryUrls.map((url, i) => (
              <li
                key={`${url}-${i}`}
                className="flex items-center gap-2 rounded-lg border border-ink-900/10 bg-[#faf8f5] p-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- user/external URLs */}
                <img src={url} alt="" className="h-14 w-14 shrink-0 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-ink-900/80">{url}</p>
                  {i === 0 ? (
                    <span className="text-xs font-bold text-gold-700">رئيسية</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setMainGalleryAt(i)}
                      className="text-xs font-semibold text-brand-600 hover:underline"
                    >
                      جعلها رئيسية
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeGalleryAt(i)}
                  className="shrink-0 rounded border border-red-200/80 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                >
                  حذف
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div>
        <label className="block text-sm font-semibold text-ink-900/80">رابط فيديو MP4 (اختياري)</label>
        <input
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          type="url"
          className="mt-1 w-full rounded-xl border border-ink-900/15 bg-white px-3 py-2.5 text-ink-900 outline-none focus:border-brand-400"
          placeholder="رابط مباشر لملف MP4 — الحد 50MB عند الرفع للتخزين"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-ink-900/80">وصف العرض</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 w-full rounded-xl border border-ink-900/15 bg-white px-3 py-2.5 text-ink-900 outline-none focus:border-brand-400"
          rows={4}
          placeholder="تفاصيل العرض للزوار والمهتمين…"
          required
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {ok ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          تم تسجيل العرض (معاينة). جارٍ الرجوع لغرفة التسويق…
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-brand-400 disabled:opacity-60"
        >
          {loading ? "جاري الحفظ…" : "حفظ العرض"}
        </button>
      </div>
    </form>
  );
}
