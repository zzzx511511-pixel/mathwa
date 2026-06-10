import { notFound } from "next/navigation";
import { BackButton } from "@/components/layout/back-button";
import { OfferPublicToolbar } from "@/components/offers/offer-public-toolbar";
import { getSampleOfferDetail } from "@/lib/site/sample-offer-demos";

export const dynamic = "force-dynamic";

export default function SampleOfferDemoPage({
  params
}: {
  params: { slug: string };
}) {
  const slug = decodeURIComponent(params.slug ?? "").trim();
  const detail = getSampleOfferDetail(slug);
  if (!detail) notFound();

  const videoSources = (detail.videoSources?.length ? detail.videoSources : detail.videoUrl ? [detail.videoUrl] : [])
    .filter(Boolean) as string[];
  const returnTo = encodeURIComponent(`/offers/demo/${slug}`);
  const riskLabel =
    detail.risk === "high"
      ? "خطورة عالية"
      : detail.risk === "medium"
        ? "خطورة متوسطة"
        : detail.risk === "low"
          ? "خطورة منخفضة"
          : null;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-ink-900/10 bg-white p-6">
        <div className="mb-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-500">
                نموذج تجريبي للعرض
              </span>
              <h1 className="mt-2 text-3xl font-extrabold text-ink-900">{detail.title}</h1>
            </div>
            <BackButton fallbackHref="/" />
          </div>
          <OfferPublicToolbar path={`/offers/demo/${slug}`} title={detail.title} kind="demo" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-ink-900/10 bg-[#ece8e0]">
            <img
              src={detail.image}
              alt={detail.title}
              className="h-72 w-full object-contain object-center"
              loading="eager"
            />
          </div>
          <article className="rounded-xl border border-ink-900/10 bg-white p-5">
            <p className="text-sm text-ink-900/70">التصنيف</p>
            <p className="text-lg font-bold text-ink-900">{detail.typeBadge}</p>
            <p className="mt-3 text-sm text-ink-900/70">الموقع العام</p>
            <p className="text-base font-semibold text-ink-900">{detail.location}</p>
            <p className="mt-3 text-sm text-ink-900/70">السعر</p>
            <p className="text-xl font-extrabold text-brand-400">{detail.price}</p>
            <p className="mt-2 text-sm text-ink-900/70">الحالة</p>
            <p className="font-semibold text-ink-900">{detail.modeLabel}</p>
            {riskLabel ? (
              <p className="mt-2 text-sm text-ink-900/70">
                خطورة التصنيف: <span className="font-bold text-ink-900">{riskLabel}</span>
              </p>
            ) : null}
            <p className="mt-4 text-sm leading-8 text-ink-900/80">{detail.longDesc}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {detail.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-[#f5efe6] px-2 py-1 text-[11px] text-ink-900/80"
                >
                  {tag}
                </span>
              ))}
            </div>
            <a
              href={`/login?mode=signup&role=client&returnTo=${returnTo}`}
              className="mt-4 inline-block rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-400"
            >
              تواصل مع المسؤول عن العرض
            </a>
          </article>
        </div>
      </section>

      <section className="rounded-2xl bg-[#efe8dc] p-6">
        <h2 className="text-2xl font-bold text-ink-900">صور إضافية</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {detail.gallery.map((src, idx) => (
            <img
              key={`${src}-${idx}`}
              src={src}
              alt={`صورة ${idx + 1}`}
              className="h-40 w-full rounded-lg border border-ink-900/10 object-contain bg-[#f5f1eb]"
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-ink-900/10 bg-white p-6">
        <h2 className="text-2xl font-bold text-ink-900">فيديو العرض (نموذج)</h2>
        <p className="mt-2 text-sm text-ink-900/70">
          فيديو تجريبي للمعاينة؛ يمكن استبداله لاحقًا بفيديوهاتكم الفعلية.
        </p>
        {videoSources.length > 0 ? (
          <>
            <video
              controls
              playsInline
              preload="metadata"
              className="mt-4 h-auto max-h-[420px] w-full rounded-xl border border-ink-900/10 bg-black"
            >
              {videoSources.map((src) => (
                <source key={src} src={src} type="video/mp4" />
              ))}
            </video>
            <p className="mt-2 text-xs text-ink-900/65">
              إن لم يبدأ التشغيل تلقائياً،{" "}
              <a
                href={videoSources[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand-500 underline"
              >
                افتح الفيديو في تبويب جديد
              </a>
              .
            </p>
          </>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-ink-900/20 bg-[#f8f3ea] p-5 text-sm text-ink-900/75">
            لا يوجد فيديو مرفق لهذا العرض حاليًا.
          </div>
        )}
      </section>
    </div>
  );
}
