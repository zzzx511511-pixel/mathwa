import Link from "next/link";
import type { Route } from "next";
import type { SampleCard } from "@/lib/site/sample-offer-demos";
import { OfferPublicToolbar } from "@/components/offers/offer-public-toolbar";

export function SampleOfferCard({ card, showRisk }: { card: SampleCard; showRisk?: boolean }) {
  const detailHref = `/offers/demo/${card.slug}` as Route;
  const riskLabel =
    card.risk === "high"
      ? "خطورة عالية"
      : card.risk === "medium"
        ? "خطورة متوسطة"
        : card.risk === "low"
          ? "خطورة منخفضة"
          : "";
  const riskClass =
    card.risk === "high"
      ? "bg-red-600 text-white"
      : card.risk === "medium"
        ? "bg-blue-600 text-white"
        : "bg-emerald-600 text-white";

  return (
    <article className="overflow-hidden rounded-xl border border-ink-900/10 bg-white">
      <Link
        href={detailHref}
        prefetch
        className="relative block h-44 bg-cover bg-center focus-visible:outline focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2"
        style={{ backgroundImage: `url('${card.image}')` }}
        aria-label={`فتح تفاصيل النموذج: ${card.title}`}
      >
        <span className="pointer-events-none absolute right-2 top-2 rounded-md bg-black/65 px-2 py-1 text-[11px] font-bold text-white">
          {card.typeBadge}
        </span>
        <span className="pointer-events-none absolute left-2 top-2 rounded-md bg-blue-600 px-2 py-1 text-[11px] font-bold text-white">
          {card.modeLabel}
        </span>
        {showRisk && card.risk ? (
          <span className={`pointer-events-none absolute bottom-2 right-2 rounded-md px-2 py-1 text-[11px] font-bold ${riskClass}`}>
            {riskLabel}
          </span>
        ) : null}
      </Link>
      <div className="space-y-2 p-4">
        <Link href={detailHref} prefetch className="block rounded-lg py-1 hover:bg-[#f8f3ea]/60">
          <h4 className="text-xl font-bold text-ink-900">{card.title}</h4>
          <p className="text-sm text-ink-900/75">{card.desc}</p>
          <p className="text-sm text-ink-900/70">📍 {card.location}</p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {card.tags.map((tag) => (
              <span key={tag} className="rounded-md bg-[#f5efe6] px-2 py-1 text-[11px] text-ink-900/80">
                {tag}
              </span>
            ))}
          </div>
          <p className="pt-1 text-lg font-extrabold text-brand-400">{card.price}</p>
        </Link>
        <div className="mt-2">
          <OfferPublicToolbar
            compact
            path={`/offers/demo/${card.slug}`}
            title={card.title}
            kind="demo"
          />
        </div>
        <Link
          href={detailHref}
          prefetch
          className="mt-1 block rounded-lg border border-ink-900/15 px-3 py-2 text-center text-xs font-semibold text-ink-900 hover:bg-[#f8f3ea]"
        >
          عرض التفاصيل والصور والفيديو
        </Link>
        <a
          href={`/login?mode=signup&role=client&returnTo=${encodeURIComponent(`/offers/demo/${card.slug}`)}`}
          className="mt-2 block rounded-lg bg-brand-500 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-brand-400"
        >
          تواصل مع المسؤول عن العرض
        </a>
      </div>
    </article>
  );
}
