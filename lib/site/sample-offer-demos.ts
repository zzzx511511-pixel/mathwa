import { buildSampleGallery, samplePhotos } from "@/lib/site/sample-photos";

export type SampleCard = {
  slug: string;
  title: string;
  desc: string;
  location: string;
  tags: string[];
  modeLabel: "للبيع" | "للإيجار";
  risk?: "high" | "medium" | "low";
  price: string;
  image: string;
  typeBadge: string;
};

/** نص أطول يظهر في صفحة تفاصيل النموذج فقط */
export type SampleOfferDetail = SampleCard & {
  longDesc: string;
  gallery: string[];
  /** فيديو تجريبي (يمكن استبداله لاحقًا بملفاتكم في التخزين) */
  videoUrl?: string | null;
  /** بدائل إذا فشل أول مصدر */
  videoSources?: string[];
};

/** عدة مصادر؛ بعض الشبكات تحظر روابط معيّنة، فيُجرّب المتصفح التالي تلقائياً */
export const demoVideoSources: string[] = [
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  "https://www.w3schools.com/html/mov_bbb.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
];

const demoVideo = demoVideoSources[0];

export const industrialSamples: SampleCard[] = [
  {
    slug: "industrial-workshop-sinaiyah",
    title: "ورشة صيانة سيارات في حي الصناعية",
    desc: "ورشة مجهزة بالكامل لميكانيكا وإصلاح السيارات مع معدات تشغيل حديثة.",
    location: "حي الصناعية، الرياض",
    tags: ["معدات فحص", "رافعات", "مكتب إداري"],
    modeLabel: "للبيع",
    risk: "low",
    price: "850,000 ر.س",
    image: samplePhotos.autoWorkshop,
    typeBadge: "ورشة"
  },
  {
    slug: "industrial-cold-storage-sulay",
    title: "مستودع تبريد مجهز في السلي",
    desc: "مستودع بسعة كبيرة مع أنظمة تبريد حديثة وبيئة تشغيل آمنة.",
    location: "حي السلي، الرياض",
    tags: ["تبريد مركزي", "أنظمة إطفاء", "أرصفة تحميل"],
    modeLabel: "للإيجار",
    risk: "medium",
    price: "180,000 ر.س / سنويًا",
    image: samplePhotos.warehouse,
    typeBadge: "مستودع"
  },
  {
    slug: "industrial-factory-2nd-zone",
    title: "مصنع متكامل في المنطقة الصناعية الثانية",
    desc: "مصنع جاهز للتشغيل بمساحة واسعة وخطوط إنتاج ومرافق إدارية.",
    location: "المنطقة الصناعية الثانية، الرياض",
    tags: ["خطوط إنتاج", "مكاتب", "مواقف شاحنات"],
    modeLabel: "للإيجار",
    risk: "high",
    price: "250,000 ر.س / سنويًا",
    image: samplePhotos.factoryLine,
    typeBadge: "مصنع"
  }
];

export const commercialWorkersSamples: SampleCard[] = [
  {
    slug: "commercial-tower-olaya",
    title: "عمارة تجارية متعددة الاستخدام",
    desc: "عمارة تجارية على شارع رئيسي تصلح للمكاتب والعيادات.",
    location: "حي العليا، الرياض",
    tags: ["موقع رئيسي", "تشطيبات", "مواقف"],
    modeLabel: "للبيع",
    price: "5,200,000 ر.س",
    image: samplePhotos.officeTower,
    typeBadge: "تجاري"
  },
  {
    slug: "commercial-labor-sulay",
    title: "مبنى سكن عمال مجهز بالكامل",
    desc: "سكن عمال مجهز بغرف وخدمات تشغيل مع اشتراطات سلامة مكتملة.",
    location: "حي السلي، الرياض",
    tags: ["غرف متعددة", "مطبخ", "اشتراطات مكتملة"],
    modeLabel: "للإيجار",
    price: "420,000 ر.س / سنويًا",
    image: samplePhotos.workersDorm,
    typeBadge: "سكن عمال"
  },
  {
    slug: "commercial-offices-king-fahd",
    title: "مكاتب تجارية جاهزة للتشغيل",
    desc: "مكاتب حديثة قابلة للتقسيم في برج تجاري.",
    location: "طريق الملك فهد، الرياض",
    tags: ["واجهة زجاجية", "مصاعد", "أمن"],
    modeLabel: "للإيجار",
    price: "190,000 ر.س / سنويًا",
    image: samplePhotos.modernOffice,
    typeBadge: "تجاري"
  }
];

export const residentialSamples: SampleCard[] = [
  {
    slug: "residential-villa-malqa",
    title: "فيلا فاخرة في حي الملقا",
    desc: "فيلا بتصميم حديث مع حديقة ومواقف خاصة.",
    location: "حي الملقا، الرياض",
    tags: ["4 غرف", "مجلس", "مواقف"],
    modeLabel: "للبيع",
    price: "2,350,000 ر.س",
    image: samplePhotos.villaExterior,
    typeBadge: "سكني"
  },
  {
    slug: "residential-apartment-narjis",
    title: "شقة عائلية في حي النرجس",
    desc: "شقة قريبة من الخدمات والمدارس.",
    location: "حي النرجس، الرياض",
    tags: ["3 غرف", "مطبخ", "صالة"],
    modeLabel: "للإيجار",
    price: "58,000 ر.س / سنويًا",
    image: samplePhotos.apartmentInterior,
    typeBadge: "سكني"
  },
  {
    slug: "residential-floor-yasmin",
    title: "دور سكني مستقل",
    desc: "دور علوي مستقل بمدخل خاص وتشطيب ممتاز.",
    location: "حي الياسمين، الرياض",
    tags: ["مدخل خاص", "تشطيب فاخر", "قريب خدمات"],
    modeLabel: "للإيجار",
    price: "72,000 ر.س / سنويًا",
    image: samplePhotos.townhouse,
    typeBadge: "سكني"
  }
];

export const landsSamples: SampleCard[] = [
  {
    slug: "lands-investment-north",
    title: "أرض استثمارية شمال الرياض",
    desc: "أرض مناسبة لمشروع تجاري/سكني بموقع حيوي.",
    location: "طريق الملك فهد، الرياض",
    tags: ["واجهة عريضة", "موقع رئيسي", "قريبة خدمات"],
    modeLabel: "للبيع",
    price: "5,100,000 ر.س",
    image: samplePhotos.landOpen,
    typeBadge: "أرض تجارية"
  },
  {
    slug: "lands-residential-narjis",
    title: "أرض سكنية في حي النرجس",
    desc: "أرض سكنية في مخطط مكتمل الخدمات.",
    location: "حي النرجس، الرياض",
    tags: ["قابلة للبناء", "قريبة مدارس", "شارع 20م"],
    modeLabel: "للبيع",
    price: "1,050,000 ر.س",
    image: samplePhotos.landSubdivision,
    typeBadge: "أرض سكنية"
  },
  {
    slug: "lands-industrial-city",
    title: "أرض صناعية في المدينة الصناعية",
    desc: "مساحة مناسبة لإنشاء ورش أو مستودعات.",
    location: "المدينة الصناعية، الرياض",
    tags: ["مساحة واسعة", "قريبة طرق رئيسية", "تصنيف صناعي"],
    modeLabel: "للإيجار",
    price: "220,000 ر.س / سنويًا",
    image: samplePhotos.landIndustrialPlot,
    typeBadge: "أرض صناعية"
  }
];

function buildDetail(card: SampleCard): SampleOfferDetail {
  return {
    ...card,
    longDesc: `${card.desc} يمكنكم الاطلاع أدناه على صور توضيحية وفيديو نموذجي للمعاينة. الموقع الدقيق لا يُعرض للزوار ويُشارك بعد التواصل مع المسؤول.`,
    gallery: buildSampleGallery(card.image, card.slug, 5),
    videoUrl: demoVideo,
    videoSources: demoVideoSources
  };
}

const allCards: SampleCard[] = [
  ...industrialSamples,
  ...commercialWorkersSamples,
  ...residentialSamples,
  ...landsSamples
];

export const sampleOfferDetailsBySlug: Record<string, SampleOfferDetail> =
  Object.fromEntries(allCards.map((c) => [c.slug, buildDetail(c)]));

export function getSampleOfferDetail(slug: string): SampleOfferDetail | null {
  return sampleOfferDetailsBySlug[slug] ?? null;
}

export function getAllSampleOfferSlugs(): string[] {
  return Object.keys(sampleOfferDetailsBySlug);
}

/** لربط عروض نماذج موجودة بمشاريع مكتملة */
export function getSampleCardsBySlugs(slugs: string[]): SampleCard[] {
  const out: SampleCard[] = [];
  for (const slug of slugs) {
    const row = sampleOfferDetailsBySlug[slug];
    if (!row) continue;
    out.push({
      slug: row.slug,
      title: row.title,
      desc: row.desc,
      location: row.location,
      tags: row.tags,
      modeLabel: row.modeLabel,
      risk: row.risk,
      price: row.price,
      image: row.image,
      typeBadge: row.typeBadge
    });
  }
  return out;
}
