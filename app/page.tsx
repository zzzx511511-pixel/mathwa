import Link from "next/link";
import type { Route } from "next";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  footerContactLines,
  footerQuickLinks,
  footerWorkingHoursLines,
  heroBackgroundImagePath,
  metrics,
  suggestedGeneralImages,
  suggestedIndustrialImages
} from "@/lib/site/public-site-config";
import {
  commercialWorkersSamples,
  industrialSamples,
  landsSamples,
  residentialSamples,
  type SampleCard
} from "@/lib/site/sample-offer-demos";
import { completedProjects, projectsSectionIntro } from "@/lib/site/completed-projects";
import { OfferPublicToolbar } from "@/components/offers/offer-public-toolbar";
import { SampleOfferCard } from "@/components/offers/sample-offer-card";
import { OccupancyBar } from "@/components/projects/occupancy-bar";
import { filterPublicVacantOffers } from "@/lib/site/public-vacant-offers";
import { showIndustrialRiskBadge } from "@/lib/marketing/listing-form-constants";
import {
  mapListingRowToUnifiedOffer,
  mapPropertyRowToUnifiedOffer,
  offersForHomeCategory,
  type ListingRow,
  type PropertyOfferRow,
  type UnifiedPublicOffer
} from "@/lib/site/marketing-listings-public";
import type { OfferSectionKey } from "@/lib/marketing/offer-section";

export const dynamic = "force-dynamic";

type OfferRow = {
  id: string | null;
  title: string | null;
  summary: string | null;
  property_type: string | null;
  price: number | null;
  city: string | null;
  district: string | null;
  occupancy_status?: string | null;
  status?: string | null;
  property_status?: string | null;
};

export default async function PublicHomePage() {
  let allOffers: UnifiedPublicOffer[] = [];
  try {
    const supabase = getSupabaseServerClient();
    const [{ data: rpcData }, { data: listingData }] = await Promise.all([
      supabase.rpc("get_public_property_offers", { p_limit: 48 }),
      supabase.from("listings").select("*").eq("status", "published").order("created_at", { ascending: false }).limit(48)
    ]);
    const propertyRows = filterPublicVacantOffers((rpcData ?? []) as OfferRow[]) as PropertyOfferRow[];
    const listingRows = (listingData ?? []) as ListingRow[];
    const fromRpc = propertyRows.map((r, i) => mapPropertyRowToUnifiedOffer(r, i));
    const fromListings = listingRows.map((r, i) => mapListingRowToUnifiedOffer(r, i));
    const seen = new Set<string>();
    for (const o of [...fromListings, ...fromRpc]) {
      if (seen.has(o.id)) continue;
      seen.add(o.id);
      allOffers.push(o);
    }
  } catch {
    /* لا نسقط الصفحة كاملة إذا تعذّر Supabase */
  }

  const topIndustrial = takeWithFallback(
    offersForHomeCategory(allOffers, "industrial" as OfferSectionKey, /مصنع|مستودع|ورشة|حوش|صناعي|أرض صناعية/i),
    allOffers,
    3
  );
  const topCommercialWorkers = takeWithFallback(
    offersForHomeCategory(
      allOffers,
      "commercial-workers" as OfferSectionKey,
      /تجاري|سكن عمال|عمائر|مكاتب|مكتب|عمارة|محل/i
    ),
    allOffers,
    3
  );
  const topResidential = takeWithFallback(
    offersForHomeCategory(allOffers, "residential" as OfferSectionKey, /سكني|شقة|فيلا|دور|دوبلكس|تاون|قصر/i),
    allOffers,
    3
  );
  const topLands = takeWithFallback(
    offersForHomeCategory(allOffers, "lands" as OfferSectionKey, /أرض|اراضي|الأراضي|زراعية/i),
    allOffers,
    3
  );

  return (
    <div id="top" className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-gold-400/30 px-6 py-20 text-white lg:px-14">
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${heroBackgroundImagePath}')` }}
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-[#2f160f]/40 via-[#2f160f]/50 to-[#2f160f]/82"
        />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h1 className="mt-2 text-5xl font-extrabold leading-tight">مثوى</h1>
          <p className="mt-3 text-2xl font-semibold text-gold-500">للتطوير والتسويق العقاري</p>
          <p className="mt-2 text-base text-white/85">
            نقودك إلى عقارك المناسب بخبرة سعودية ورؤية استثمارية دقيقة.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a href="/login" className="rounded-xl bg-gold-400 px-6 py-3 font-bold text-ink-900 hover:bg-gold-500">
              تسجيل الدخول
            </a>
            <a href="/employee/login" className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 font-semibold hover:bg-white/20">
              بوابة الموظفين
            </a>
          </div>
        </div>
      </section>

      <section
        aria-label="إنجازات مثوى"
        className="rounded-2xl border border-gold-400/25 bg-gradient-to-b from-white to-[#f8f3ea] px-5 py-8 shadow-sm"
      >
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
          {metrics.map((m) => (
            <div key={m.label} className="text-center">
              <p className="text-2xl font-extrabold text-brand-400 sm:text-3xl md:text-4xl">{m.value}</p>
              <p className="mt-1.5 text-xs font-semibold text-ink-900/70 sm:text-sm">{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="our-projects"
        className="scroll-mt-24 rounded-2xl border border-gold-400/25 bg-gradient-to-b from-[#faf6ef] to-white px-5 py-10 shadow-sm"
      >
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold text-ink-900">مشاريعنا</h2>
          <p className="mt-3 text-sm leading-7 text-ink-900/75">{projectsSectionIntro}</p>
          <Link
            href="/projects"
            prefetch
            className="mt-4 inline-block rounded-xl border border-brand-400/40 bg-white px-5 py-2.5 text-sm font-bold text-brand-500 shadow-sm transition hover:border-gold-400 hover:bg-gold-400/10"
          >
            استعرض كل المشاريع والتفاصيل
          </Link>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {completedProjects.map((project) => (
            <article
              key={project.slug}
              className="flex flex-col overflow-hidden rounded-2xl border border-ink-900/10 bg-white shadow-sm"
            >
              <div
                className="h-44 bg-cover bg-center"
                style={{ backgroundImage: `url('${project.coverImage}')` }}
              />
              <div className="flex flex-1 flex-col p-5">
                <p className="text-xs font-medium text-brand-500">{project.city}</p>
                <h3 className="mt-1 text-xl font-extrabold text-ink-900">{project.title}</h3>
                <p className="mt-2 text-sm text-ink-900/75">{project.summary}</p>
                <div className="mt-4">
                  <OccupancyBar percent={project.occupancyPercent} />
                </div>
                <Link
                  href={`/projects/${project.slug}` as Route}
                  prefetch
                  className="mt-4 inline-block rounded-lg bg-brand-500 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-brand-400"
                >
                  عرض المشروع والعروض المرتبطة
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <CategorySection
        id="industrial"
        title="المصانع والمستودعات"
        subtitle="ورش، مصانع، أحواش، ومستودعات - بيع وتأجير"
        offers={topIndustrial}
        images={suggestedIndustrialImages}
        showRisk
        sampleCards={industrialSamples}
      />

      <CategorySection
        id="commercial-workers"
        title="التجارية وسكن العمال"
        subtitle="عقارات تجارية وسكن عمال - بيع وتأجير"
        offers={topCommercialWorkers}
        images={suggestedGeneralImages}
        sampleCards={commercialWorkersSamples}
      />

      <CategorySection
        id="residential"
        title="السكني"
        subtitle="شقق وفلل ووحدات سكنية - بيع وتأجير"
        offers={topResidential}
        images={suggestedGeneralImages}
        sampleCards={residentialSamples}
      />

      <CategorySection
        id="lands"
        title="الأراضي"
        subtitle="أراضٍ سكنية وتجارية وصناعية - بيع وتأجير"
        offers={topLands}
        images={suggestedGeneralImages}
        sampleCards={landsSamples}
      />

      <section id="about" className="rounded-2xl bg-white p-8">
        <h3 className="text-center text-3xl font-extrabold text-ink-900">من نحن</h3>
        <p className="mx-auto mt-3 max-w-3xl text-center text-sm text-ink-900/75">
          مثوى للتطوير والتسويق العقاري، نقدم حلولاً عقارية متكاملة بخبرة سعودية
          ورؤية استثمارية دقيقة.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <InfoCard
            title="من نحن"
            text="منصة عقارية تركز على عرض الفرص بوضوح وتسهيل رحلة الباحث عن عقار."
            icon="⌂"
            href="#about-us-detail"
            cta="المحتوى الكامل"
          />
          <InfoCard
            title="رؤيتنا"
            text="أن نكون الوجهة الأولى للفرص العقارية النوعية في السوق السعودي."
            icon="◌"
            href="#vision-detail"
            cta="المحتوى الكامل"
          />
          <InfoCard
            title="خدماتنا"
            text="تسويق عقاري، تطوير فرص استثمارية، ودعم العملاء حتى إتمام القرار."
            icon="↗"
            href="/services"
            cta="ادخل صفحة الخدمات"
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article id="about-us-detail" className="rounded-2xl border border-ink-900/10 bg-[#f8f3ea] p-8">
          <h3 className="text-2xl font-extrabold text-ink-900">من نحن</h3>
          <p className="mt-3 text-sm leading-9 text-ink-900/80">
            مثوى للتطوير والتسويق العقاري كيان وطني يعمل بخبرة ميدانية ممتدة في إدارة
            الأصول العقارية وتسويقها وتقديم الحلول المناسبة للملاك والعملاء والمستثمرين.
            نعتمد على منهج واضح يبدأ بتحليل احتياج العميل بشكل دقيق، ثم تقديم خيارات
            مدروسة تراعي الموقع والقيمة التشغيلية وفرص النمو، مع متابعة مستمرة لكل
            مرحلة حتى تكتمل الخدمة بجودة عالية. كما نؤمن بأن نجاح أي خدمة عقارية لا
            يعتمد فقط على عرض العقار، بل على جودة التنفيذ والانضباط في المتابعة
            والالتزام بالشفافية في المعلومات، ولهذا نحرص على بناء تجربة متوازنة تجمع
            بين المهنية والوضوح وسرعة الاستجابة.
          </p>
        </article>

        <article id="vision-detail" className="rounded-2xl border border-ink-900/10 bg-[#f8f3ea] p-8">
          <h3 className="text-2xl font-extrabold text-ink-900">رؤيتنا</h3>
          <p className="mt-3 text-sm leading-9 text-ink-900/80">
            رؤيتنا في مثوى تقوم على أن نكون مرجعًا موثوقًا في القطاع العقاري من خلال
            الوضوح الكامل في كل ما نقدمه، سواء في وصف العروض أو شروط الخدمة أو آلية
            التواصل والمتابعة. نلتزم بروح رؤية المملكة في تطوير جودة الخدمات ورفع
            كفاءة السوق العقاري وتمكين الحلول الذكية التي تحسن تجربة العميل وتدعم
            قراره الاستثماري بثقة. لذلك نعمل بأسلوب مهذب ومسؤول، ونضع الدقة والشفافية
            أساسًا لكل خطوة، مع الحرص على تقديم قيمة حقيقية طويلة الأمد لا تقتصر على
            البيع أو التأجير فقط، بل تمتد إلى بناء علاقة مهنية مستدامة مع كل عميل.
          </p>
        </article>
      </section>

      <section className="rounded-2xl border border-ink-900/10 bg-[#f8f3ea] p-8">
        <h3 className="text-2xl font-extrabold text-ink-900">أوقات الدوام</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <WorkingHourRow day="الأحد" time="8:00 ص - 5:00 م" />
          <WorkingHourRow day="الاثنين" time="8:00 ص - 5:00 م" />
          <WorkingHourRow day="الثلاثاء" time="8:00 ص - 5:00 م" />
          <WorkingHourRow day="الأربعاء" time="8:00 ص - 5:00 م" />
          <WorkingHourRow day="الخميس" time="8:00 ص - 5:00 م" />
          <WorkingHourRow day="الجمعة / السبت" time="مغلق" />
        </div>
      </section>

      <footer id="contact" className="rounded-2xl bg-[#2f160f] px-6 py-10 text-white">
        <div className="grid gap-6 md:grid-cols-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-white/95 px-3 py-1.5 text-ink-900">
              <div className="h-5 w-5 rounded bg-[#d4a14f]" />
              <span className="font-extrabold">مثوى</span>
            </div>
            <p className="mt-3 text-sm text-white/75">
              شركة رائدة في مجال التطوير العقاري والاستثمار في المملكة العربية السعودية.
            </p>
          </div>
          <FooterQuickLinks title="روابط سريعة" links={footerQuickLinks} />
          <FooterCol title="معلومات التواصل" lines={footerContactLines} />
          <FooterCol title="أوقات العمل" lines={footerWorkingHoursLines} />
        </div>
      </footer>
    </div>
  );
}

function CategorySection({
  id,
  title,
  subtitle,
  offers,
  images,
  showRisk,
  sampleCards
}: {
  id: string;
  title: string;
  subtitle: string;
  offers: UnifiedPublicOffer[];
  images: string[];
  showRisk?: boolean;
  sampleCards?: SampleCard[];
}) {
  const cards = sampleCards ?? [];

  return (
    <section id={id} className="rounded-2xl border border-ink-900/10 bg-white p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-3xl font-extrabold text-ink-900">{title}</h3>
          <p className="text-sm text-ink-900/70">{subtitle}</p>
        </div>
        <a href={`/offers?section=${id}`} className="rounded-lg border border-ink-900/20 px-4 py-2 text-sm font-semibold text-ink-900 hover:bg-brand-50">
          عرض كل العروض
        </a>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {cards.length > 0
          ? cards.map((card) => (
              <SampleOfferCard
                key={`${id}-${card.slug}`}
                card={card}
                showRisk={showRisk}
              />
            ))
          : offers.map((offer, idx) => (
              <OfferCard
                key={`${id}-${offer.id}`}
                offer={offer}
                imageUrl={images[idx % images.length]}
                showRisk={showRisk}
              />
            ))}
      </div>
      <div className="mt-5 text-center">
        <a href={`/offers?section=${id}`} className="text-sm font-semibold text-brand-400 hover:underline">
          عودة إلى العروض
        </a>
      </div>
    </section>
  );
}

function takeWithFallback(primary: UnifiedPublicOffer[], all: UnifiedPublicOffer[], count: number) {
  if (primary.length >= count) return primary.slice(0, count);
  const used = new Set(primary.map((item) => item.id));
  const fill = all.filter((item) => !used.has(item.id)).slice(0, Math.max(0, count - primary.length));
  return [...primary, ...fill];
}

function OfferCard({
  offer,
  imageUrl,
  showRisk
}: {
  offer: UnifiedPublicOffer;
  imageUrl: string;
  showRisk?: boolean;
}) {
  const detailHref = `/offers/${offer.id}` as Route;
  const heroUrl = offer.imageUrl || imageUrl;
  const riskLabel =
    offer.risk === "high"
      ? "خطورة عالية"
      : offer.risk === "medium"
      ? "خطورة متوسطة"
      : "خطورة منخفضة";
  const riskClass =
    offer.risk === "high"
      ? "bg-red-600 text-white"
      : offer.risk === "medium"
      ? "bg-blue-600 text-white"
      : "bg-emerald-600 text-white";

  const showRiskBadge = showIndustrialRiskBadge(offer.type);

  return (
    <article className="overflow-hidden rounded-xl border border-ink-900/10 bg-white p-0">
      <Link
        href={detailHref}
        prefetch
        className="relative block h-36 bg-cover bg-center focus-visible:outline focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2"
        style={{ backgroundImage: `url('${heroUrl}')` }}
        aria-label={`فتح تفاصيل: ${offer.title}`}
      >
        <span className="pointer-events-none absolute left-2 top-2 rounded-md bg-black/65 px-2 py-1 text-[11px] font-bold text-white">
          {offer.modeLabel}
        </span>
        {showRiskBadge ? (
          <span className={`pointer-events-none absolute right-2 top-2 rounded-md px-2 py-1 text-[11px] font-bold ${riskClass}`}>
            {riskLabel}
          </span>
        ) : null}
      </Link>
      <div className="space-y-2 p-4">
        <Link href={detailHref} prefetch className="block rounded-lg py-1 hover:bg-[#f8f3ea]/60">
          <h4 className="font-bold text-ink-900">{offer.title}</h4>
          <p className="text-xs text-ink-900/75">{offer.details}</p>
          <p className="text-xs text-ink-900/70">📍 {offer.area}</p>
          <p className="text-sm font-extrabold text-brand-400">{offer.price}</p>
        </Link>
        <div className="mt-2">
          <OfferPublicToolbar
            compact
            path={`/offers/${offer.id}`}
            title={offer.title}
            kind="offer"
          />
        </div>
        <Link
          href={detailHref}
          prefetch
          className="mt-1 block rounded-lg border border-ink-900/15 px-3 py-2 text-center text-xs font-semibold text-ink-900 hover:bg-[#f8f3ea]"
        >
          عرض التفاصيل والصور
        </Link>
        <a
          href={`/login?mode=signup&role=client&returnTo=${encodeURIComponent(`/offers/${offer.id}`)}`}
          className="mt-2 block rounded-lg bg-brand-500 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-brand-400"
        >
          تواصل مع المسؤول عن العرض
        </a>
      </div>
    </article>
  );
}

function InfoCard({
  title,
  text,
  icon,
  href,
  cta
}: {
  title: string;
  text: string;
  icon: string;
  href: string;
  cta: string;
}) {
  return (
    <article className="rounded-xl border border-ink-900/10 bg-[#f8f3ea] p-5 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4a14f]/90 text-lg text-white">
        {icon}
      </div>
      <h4 className="mt-3 text-xl font-bold text-ink-900">{title}</h4>
      <p className="mt-2 text-sm text-ink-900/70">{text}</p>
      <a
        href={href}
        className="mt-3 inline-block rounded-lg border border-ink-900/15 bg-white px-3 py-1.5 text-sm font-semibold text-brand-400 hover:border-gold-400 hover:bg-gold-400/10"
      >
        {cta}
      </a>
    </article>
  );
}

function WorkingHourRow({ day, time }: { day: string; time: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-ink-900/10 bg-white px-4 py-3">
      <span className="font-semibold text-ink-900">{day}</span>
      <span className="text-sm text-brand-400">{time}</span>
    </div>
  );
}

function FooterCol({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div>
      <h5 className="mb-2 text-lg font-bold text-gold-500">{title}</h5>
      <ul className="space-y-1 text-sm text-white/80">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

function FooterQuickLinks({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h5 className="mb-2 text-lg font-bold text-gold-500">{title}</h5>
      <ul className="space-y-1.5 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <a href={link.href} className="text-white/80 transition hover:text-gold-500 hover:underline">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
