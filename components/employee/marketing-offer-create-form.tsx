"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
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

function newListingId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `listing-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function MarketingOfferCreateForm() {
  const router = useRouter();
  const [listingId] = useState(newListingId);
  const imagesInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
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
  const [videoUrl, setVideoUrl] = useState("");
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [okIsPreview, setOkIsPreview] = useState(false);

  const uploadingMedia = uploadingGallery || uploadingVideo;

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

  async function uploadGalleryFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (!files.length) {
      setError("اختر ملفات صور صالحة.");
      return;
    }
    const remaining = 8 - galleryUrls.length;
    if (remaining <= 0) {
      setError("الحد الأقصى 8 صور.");
      return;
    }
    const toUpload = files.slice(0, remaining);
    if (files.length > remaining) {
      setError(`تم اختيار ${files.length} صورة؛ سيتم رفع أول ${remaining} فقط (الحد 8).`);
    } else {
      setError(null);
    }

    setUploadingGallery(true);
    const pushed: string[] = [];
    try {
      for (const file of toUpload) {
        if (file.size > 10 * 1024 * 1024) {
          setError("إحدى الصور تتجاوز 10MB.");
          continue;
        }
        const fd = new FormData();
        fd.append("listingId", listingId);
        fd.append("kind", "image");
        fd.append("file", file);
        const res = await fetch("/api/employee/marketing/offers/upload", { method: "POST", body: fd });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
          publicUrl?: string | null;
        };
        if (!res.ok || !data.ok || !data.publicUrl) {
          throw new Error(data.error ?? "تعذر رفع الصورة.");
        }
        pushed.push(data.publicUrl);
      }
      if (pushed.length) {
        setGalleryUrls((g) => [...g, ...pushed]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل رفع الصور.");
    } finally {
      setUploadingGallery(false);
      if (imagesInputRef.current) imagesInputRef.current.value = "";
    }
  }

  async function uploadVideoFile(file: File | null) {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setError("حجم الفيديو يتجاوز 50MB.");
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "mp4" && file.type && file.type !== "video/mp4") {
      setError("الفيديو يجب أن يكون MP4.");
      return;
    }
    setUploadingVideo(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("listingId", listingId);
      fd.append("kind", "video");
      fd.append("file", file);
      const res = await fetch("/api/employee/marketing/offers/upload", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        publicUrl?: string | null;
      };
      if (!res.ok || !data.ok || !data.publicUrl) {
        throw new Error(data.error ?? "تعذر رفع الفيديو.");
      }
      setVideoUrl(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل رفع الفيديو.");
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
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
    setOkIsPreview(false);
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
      const mainImageUrl = galleryUrls[0] ?? "";

      const res = await fetch("/api/employee/marketing/offers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
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
        تُرفع الصور والفيديو إلى bucket <strong>marketing-offers</strong> ضمن المسار{" "}
        <code className="text-xs">
          {listingId}/images/…
        </code>{" "}
        و{" "}
        <code className="text-xs">
          {listingId}/videos/…
        </code>
        . تُحفظ الروابط العامة مع العرض عند الحفظ.
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

      <div className="relative rounded-xl border border-ink-900/10 bg-[#faf8f5] p-4">
        <p className="mb-2 text-sm font-semibold text-ink-900/80">معرض الصور (حتى 8 — الأولى صورة رئيسية)</p>
        <p className="mb-3 text-xs text-ink-900/55">رفع من الجهاز؛ الحد 10MB لكل صورة.</p>
        <input
          ref={imagesInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={uploadingGallery || galleryUrls.length >= 8}
          onChange={(e) => void uploadGalleryFiles(e.target.files)}
        />
        <button
          type="button"
          disabled={uploadingGallery || galleryUrls.length >= 8}
          onClick={() => imagesInputRef.current?.click()}
          className="rounded-xl border border-gold-400/50 bg-gold-400/15 px-4 py-2.5 text-sm font-bold text-ink-900 hover:bg-gold-400/25 disabled:opacity-50"
        >
          رفع صور
        </button>
        {uploadingGallery ? (
          <div className="mt-3 flex items-center gap-2 text-sm text-ink-900/80">
            <span
              className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"
              aria-hidden
            />
            جاري رفع الصور…
          </div>
        ) : null}
        {galleryUrls.length > 0 ? (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {galleryUrls.map((url, i) => (
              <li
                key={`${url}-${i}`}
                className="flex items-center gap-2 rounded-lg border border-ink-900/10 bg-white p-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- public storage URL */}
                <img src={url} alt="" className="h-20 w-20 shrink-0 rounded object-cover" />
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
                  disabled={uploadingGallery}
                  className="shrink-0 rounded border border-red-200/80 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  حذف
                </button>
              </li>
            ))}
          </ul>
        ) : !uploadingGallery ? (
          <p className="mt-2 text-xs text-ink-900/50">لم تُرفع صور بعد.</p>
        ) : null}
      </div>

      <div className="relative rounded-xl border border-ink-900/10 bg-[#faf8f5] p-4">
        <label className="block text-sm font-semibold text-ink-900/80">فيديو العرض (اختياري)</label>
        <p className="mt-1 text-xs text-ink-900/55">ملف MP4 واحد، بحد أقصى 50MB.</p>
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,.mp4"
          className="hidden"
          disabled={uploadingVideo}
          onChange={(e) => void uploadVideoFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          disabled={uploadingVideo}
          onClick={() => videoInputRef.current?.click()}
          className="mt-2 rounded-xl border border-brand-400/50 bg-brand-50 px-4 py-2.5 text-sm font-bold text-brand-700 hover:bg-brand-100 disabled:opacity-50"
        >
          رفع فيديو MP4
        </button>
        {uploadingVideo ? (
          <div className="mt-3 flex items-center gap-2 text-sm text-ink-900/80">
            <span
              className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"
              aria-hidden
            />
            جاري رفع الفيديو…
          </div>
        ) : null}
        {videoUrl && !uploadingVideo ? (
          <div className="mt-3 overflow-hidden rounded-xl border border-ink-900/15 bg-black/5">
            <p className="bg-[#f5f3ef] px-3 py-2 text-xs font-semibold text-ink-900/70">معاينة الفيديو</p>
            <video src={videoUrl} controls className="max-h-72 w-full" preload="metadata" />
            <div className="border-t border-ink-900/10 px-3 py-2">
              <button
                type="button"
                onClick={() => setVideoUrl("")}
                className="text-xs font-semibold text-red-700 hover:underline"
              >
                إزالة الفيديو
              </button>
            </div>
          </div>
        ) : null}
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
          {okIsPreview
            ? "تم تسجيل العرض (وضع معاينة — بدون حفظ في قاعدة البيانات). جارٍ الرجوع…"
            : "تم حفظ العرض في قاعدة البيانات. جارٍ الرجوع لغرفة التسويق…"}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={loading || uploadingMedia}
          className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-brand-400 disabled:opacity-60"
        >
          {loading ? "جاري الحفظ…" : uploadingMedia ? "انتظر انتهاء الرفع…" : "حفظ العرض"}
        </button>
      </div>
    </form>
  );
}
