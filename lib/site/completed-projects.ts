import { samplePhotos } from "@/lib/site/sample-photos";

export type CompletedProject = {
  slug: string;
  title: string;
  /** وصف قصير يظهر في بطاقات القائمة */
  summary: string;
  city: string;
  /** نسبة الوحدات المشغولة (بيع أو إيجار) */
  occupancyPercent: number;
  coverImage: string;
  /** مفاتيح عروض النماذج من `sample-offer-demos` */
  offerSlugs: string[];
};

/**
 * مشاريع منجزة أو أنشئت/سُوّقت عبر مثوى — يُحدَّث المحتوى هنا دون تعديل الصفحات.
 */
export const completedProjects: CompletedProject[] = [
  {
    slug: "mathwa-riyadh-residential",
    title: "مشروع مثوى الرياض السكني",
    summary: "مجمعات سكنية بإدارة وتسويق مثوى، مع متابعة تشغيلية للوحدات.",
    city: "الرياض",
    occupancyPercent: 78,
    coverImage: samplePhotos.villaExterior,
    offerSlugs: ["residential-villa-malqa", "residential-apartment-narjis", "residential-floor-yasmin"]
  },
  {
    slug: "mathwa-east-logistics",
    title: "مجمع مثوى اللوجستي — الشرقية",
    summary: "منشأة تخزين وتشغيل ساهمنا في تخطيط المسار التسويقي والتشغيلي لها.",
    city: "الدمام",
    occupancyPercent: 65,
    coverImage: samplePhotos.warehouse,
    offerSlugs: ["industrial-cold-storage-sulay", "industrial-workshop-sinaiyah", "industrial-factory-2nd-zone"]
  },
  {
    slug: "mathwa-north-plaza",
    title: "بلازا مثوى الشمال التجاري",
    summary: "واجهات تجارية ووحدات مكتبية ضمن إدارة أملاك وتسويق مستمر.",
    city: "الرياض",
    occupancyPercent: 52,
    coverImage: samplePhotos.retailStreet,
    offerSlugs: ["commercial-tower-olaya", "commercial-offices-king-fahd", "commercial-labor-sulay"]
  }
];

export const projectsSectionIntro =
  "نجاحات نفتخر بها — مشاريع أنجزناها أو ساهمنا في إنشائها وتشغيلها وتسويقها.";

export function getCompletedProject(slug: string): CompletedProject | undefined {
  return completedProjects.find((p) => p.slug === slug);
}
