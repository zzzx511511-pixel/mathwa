"use client";

import { useCallback, useState } from "react";
import { useFavorites } from "@/hooks/use-favorites";

type OfferPublicToolbarProps = {
  path: string;
  title: string;
  kind: "offer" | "demo";
  /** عند true يستخدم تنسيق أصغر للبطاقات */
  compact?: boolean;
};

function buildAbsoluteUrl(path: string) {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${path}`;
}

export function OfferPublicToolbar({ path, title, kind, compact }: OfferPublicToolbarProps) {
  const { isFav, toggle } = useFavorites();
  const [hint, setHint] = useState<string | null>(null);
  const favorite = isFav(path);

  const showHint = useCallback((msg: string) => {
    setHint(msg);
    window.setTimeout(() => setHint(null), 2200);
  }, []);

  const onCopy = useCallback(async () => {
    const url = buildAbsoluteUrl(path);
    try {
      await navigator.clipboard.writeText(url);
      showHint("تم نسخ الرابط.");
    } catch {
      showHint("تعذّر النسخ من المتصفح.");
    }
  }, [path, showHint]);

  const onShare = useCallback(async () => {
    const url = buildAbsoluteUrl(path);
    const payload = { title: title || "عرض من مثوى العقارية", text: title, url };
    try {
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(url);
      showHint("المشاركة غير متاحة؛ تم نسخ الرابط.");
    } catch {
      showHint("المشاركة والنسخ غير متاحين.");
    }
  }, [path, title, showHint]);

  const onToggleFavorite = useCallback(async () => {
    const was = favorite;
    await toggle({ path, title, kind });
    showHint(!was ? "أُضيف إلى المفضلة." : "أُزيل من المفضلة.");
  }, [toggle, path, title, kind, showHint, favorite]);

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={onCopy}
          className="rounded-lg border border-ink-900/15 bg-white px-2 py-1 text-[11px] font-semibold text-ink-900 hover:bg-[#f8f3ea]"
          title="نسخ رابط العرض"
        >
          نسخ الرابط
        </button>
        <button
          type="button"
          onClick={onShare}
          className="rounded-lg border border-ink-900/15 bg-white px-2 py-1 text-[11px] font-semibold text-ink-900 hover:bg-[#f8f3ea]"
          title="مشاركة العرض"
        >
          مشاركة
        </button>
        <button
          type="button"
          onClick={onToggleFavorite}
          className={`rounded-lg border px-2 py-1 text-[11px] font-semibold ${
            favorite
              ? "border-gold-400 bg-gold-400/20 text-ink-900"
              : "border-ink-900/15 bg-white text-ink-900 hover:bg-[#f8f3ea]"
          }`}
          title={favorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
          aria-pressed={favorite}
        >
          {favorite ? "★ مفضلة" : "☆ تفضيل"}
        </button>
        {hint ? <span className="w-full basis-full text-[10px] text-brand-400">{hint}</span> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCopy}
          className="rounded-xl border border-ink-900/15 bg-[#f8f3ea] px-4 py-2 text-sm font-semibold text-ink-900 hover:border-gold-400/50"
        >
          نسخ الرابط
        </button>
        <button
          type="button"
          onClick={onShare}
          className="rounded-xl border border-ink-900/15 bg-[#f8f3ea] px-4 py-2 text-sm font-semibold text-ink-900 hover:border-gold-400/50"
        >
          مشاركة
        </button>
        <button
          type="button"
          onClick={onToggleFavorite}
          className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
            favorite
              ? "border-gold-400 bg-gold-400/25 text-ink-900"
              : "border-ink-900/15 bg-white text-ink-900 hover:bg-[#f8f3ea]"
          }`}
          aria-pressed={favorite}
        >
          {favorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
        </button>
      </div>
      {hint ? <p className="text-xs font-medium text-brand-500">{hint}</p> : null}
    </div>
  );
}
