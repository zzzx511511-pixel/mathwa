import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { completedProjects, projectsSectionIntro } from "@/lib/site/completed-projects";
import { OccupancyBar } from "@/components/projects/occupancy-bar";
import { BackButton } from "@/components/layout/back-button";

export const metadata: Metadata = {
  title: "مشاريعنا | مثوى العقارية",
  description: "مشاريع منجزة أو أنشئت أو سُوّقت عبر مثوى للتطوير والتسويق العقاري."
};

export default function ProjectsIndexPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-ink-900/10 bg-white p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-500">مشاريع مثوى</span>
            <h1 className="mt-2 text-3xl font-extrabold text-ink-900 md:text-4xl">مشاريعنا</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-900/75">{projectsSectionIntro}</p>
          </div>
          <BackButton fallbackHref="/" />
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {completedProjects.map((project) => (
          <article
            key={project.slug}
            className="flex flex-col overflow-hidden rounded-2xl border border-ink-900/10 bg-[#faf6ef] shadow-sm transition hover:border-gold-400/40"
          >
            <div
              className="h-48 bg-cover bg-center"
              style={{ backgroundImage: `url('${project.coverImage}')` }}
            />
            <div className="flex flex-1 flex-col p-5">
              <p className="text-xs font-semibold text-brand-500">{project.city}</p>
              <h2 className="mt-1 text-xl font-extrabold text-ink-900">{project.title}</h2>
              <p className="mt-2 flex-1 text-sm text-ink-900/75">{project.summary}</p>
              <div className="mt-4">
                <OccupancyBar percent={project.occupancyPercent} />
              </div>
              <Link
                href={`/projects/${project.slug}` as Route}
                prefetch
                className="mt-4 inline-block rounded-xl bg-brand-500 px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-brand-400"
              >
                الدخول إلى المشروع والعروض
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
