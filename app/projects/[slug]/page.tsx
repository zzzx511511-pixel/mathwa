import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { getCompletedProject } from "@/lib/site/completed-projects";
import { getSampleCardsBySlugs } from "@/lib/site/sample-offer-demos";
import { OccupancyBar } from "@/components/projects/occupancy-bar";
import { SampleOfferCard } from "@/components/offers/sample-offer-card";
import { BackButton } from "@/components/layout/back-button";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getCompletedProject(params.slug);
  if (!p) return { title: "مشروع غير موجود" };
  return {
    title: `${p.title} | مثوى العقارية`,
    description: p.summary
  };
}

export default function ProjectDetailPage({ params }: Props) {
  const project = getCompletedProject(params.slug);
  if (!project) notFound();

  const cards = getSampleCardsBySlugs(project.offerSlugs);
  const returnTo = encodeURIComponent(`/projects/${project.slug}`);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl border border-ink-900/10 bg-white shadow-sm">
        <div
          className="h-52 bg-cover bg-center md:h-64"
          style={{ backgroundImage: `url('${project.coverImage}')` }}
        />
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-brand-500">{project.city}</p>
              <h1 className="mt-1 text-3xl font-extrabold text-ink-900 md:text-4xl">{project.title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-900/80">{project.summary}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <BackButton fallbackHref="/projects" />
              <Link
                href={`/login?mode=signup&role=client&returnTo=${returnTo}`}
                className="rounded-lg border border-gold-400/50 bg-[#f8f3ea] px-3 py-1.5 text-sm font-semibold text-ink-900 hover:bg-gold-400/15"
              >
                استفسار عن المشروع
              </Link>
            </div>
          </div>
          <div className="mt-6 max-w-xl rounded-xl border border-ink-900/10 bg-[#faf6ef] p-4">
            <OccupancyBar percent={project.occupancyPercent} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gold-400/25 bg-[#faf6ef] p-6 md:p-8">
        <h2 className="text-2xl font-extrabold text-ink-900">عروض مرتبطة بالمشروع</h2>
        <p className="mt-2 text-sm text-ink-900/75">
          نماذج توضيحية بنفس أسلوب عروض الموقع؛ التفاصيل الكاملة للمعاينة عند النقر على أي بطاقة.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <SampleOfferCard key={card.slug} card={card} showRisk={/صناعي|مصنع|مستودع|ورشة/i.test(card.typeBadge)} />
          ))}
        </div>
      </section>

      <p className="text-center text-sm text-ink-900/75">
        <Link href={"/projects" as Route} prefetch className="font-semibold text-brand-500 hover:underline">
          ← العودة لقائمة المشاريع
        </Link>
      </p>
    </div>
  );
}
