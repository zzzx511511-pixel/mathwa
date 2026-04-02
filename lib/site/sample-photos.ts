/**
 * صور نموذجية للمعاينة (Unsplash — صور عامة).
 * لاحقاً: ضعوا ملفاتكم في /public أو اربطوا public_image_url من Supabase واستبدلوا هذه الروابط.
 */
const q = "auto=format&fit=crop&w=1400&q=82";

export const samplePhotos = {
  autoWorkshop: `https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?${q}`,
  warehouse: `https://images.unsplash.com/photo-1553413077-190dd305871c?${q}`,
  factoryLine: `https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?${q}`,
  industrialYard: `https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?${q}`,

  officeTower: `https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?${q}`,
  retailStreet: `https://images.unsplash.com/photo-1441986300917-64674bd600d8?${q}`,
  modernOffice: `https://images.unsplash.com/photo-1497366216548-37526070297c?${q}`,
  workersDorm: `https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?${q}`,

  villaExterior: `https://images.unsplash.com/photo-1613490493576-7fde63acd811?${q}`,
  apartmentInterior: `https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?${q}`,
  townhouse: `https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?${q}`,
  residentialBlock: `https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?${q}`,

  landOpen: `https://images.unsplash.com/photo-1500382017468-9049fed747ef?${q}`,
  landSubdivision: `https://images.unsplash.com/photo-1505691938895-1758d7feb511?${q}`,
  landIndustrialPlot: `https://images.unsplash.com/photo-1513828583688-c52646db42da?${q}`
} as const;

/** تدوير الصور في صفحة العروض عندما لا يوجد صورة من قاعدة البيانات */
export const industrialPhotoRotation = [
  samplePhotos.autoWorkshop,
  samplePhotos.warehouse,
  samplePhotos.factoryLine,
  samplePhotos.industrialYard
];

export const generalPhotoRotation = [
  samplePhotos.officeTower,
  samplePhotos.villaExterior,
  samplePhotos.landOpen,
  samplePhotos.modernOffice
];

const industrialGallery = [
  samplePhotos.autoWorkshop,
  samplePhotos.warehouse,
  samplePhotos.factoryLine,
  samplePhotos.industrialYard,
  samplePhotos.factoryLine
];

const commercialGallery = [
  samplePhotos.officeTower,
  samplePhotos.retailStreet,
  samplePhotos.modernOffice,
  samplePhotos.workersDorm,
  samplePhotos.officeTower
];

const residentialGallery = [
  samplePhotos.villaExterior,
  samplePhotos.apartmentInterior,
  samplePhotos.townhouse,
  samplePhotos.residentialBlock,
  samplePhotos.apartmentInterior
];

const landsGallery = [
  samplePhotos.landOpen,
  samplePhotos.landSubdivision,
  samplePhotos.landIndustrialPlot,
  samplePhotos.landOpen,
  samplePhotos.landSubdivision
];

export type SampleGalleryKey = "industrial" | "commercial" | "residential" | "lands";

export function galleryPoolForSlug(slug: string): string[] {
  if (slug.startsWith("industrial-")) return [...industrialGallery];
  if (slug.startsWith("commercial-")) return [...commercialGallery];
  if (slug.startsWith("residential-")) return [...residentialGallery];
  if (slug.startsWith("lands-")) return [...landsGallery];
  return [...generalPhotoRotation];
}

export function buildSampleGallery(mainImage: string, slug: string, max = 5): string[] {
  const pool = galleryPoolForSlug(slug);
  const rest = pool.filter((u) => u !== mainImage);
  const combined = [mainImage, ...rest];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of combined) {
    if (!seen.has(url) && out.length < max) {
      seen.add(url);
      out.push(url);
    }
  }
  return out;
}
