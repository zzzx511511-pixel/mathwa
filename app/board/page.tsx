import type { Metadata } from "next";
import { boardMembers } from "@/lib/site/public-site-config";
import { BackButton } from "@/components/layout/back-button";

export const metadata: Metadata = {
  title: "مجلس الإدارة | مثوى العقارية",
  description: "فريق القيادة في شركة مثوى للتطوير والتسويق العقاري."
};

export default function BoardPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-ink-900/10 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-500">فريق القيادة</span>
            <h1 className="mt-2 text-3xl font-extrabold text-ink-900 md:text-4xl">مجلس الإدارة</h1>
            <p className="mt-2 max-w-2xl text-sm text-ink-900/75">
              تعرّف على أعضاء مجلس إدارة مثوى للتطوير والتسويق العقاري.
            </p>
          </div>
          <BackButton fallbackHref="/" />
        </div>
      </section>

      <section className="rounded-2xl bg-[#efe8dc] p-6 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {boardMembers.map((member) => (
            <article
              key={member.name}
              className="rounded-xl border border-ink-900/10 bg-white p-5 text-center"
            >
              <img
                src={member.imageUrl}
                alt={member.name}
                className="mx-auto h-20 w-20 rounded-full border border-gold-400/60 object-cover"
              />
              <p className="mt-3 text-xl font-bold text-ink-900">{member.name}</p>
              <p className="text-sm font-semibold text-brand-400">{member.role}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
