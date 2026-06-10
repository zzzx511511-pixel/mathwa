import type { Category, Place } from "./types";

export const PLACES: Place[] = [
  // ── كافيهات ──────────────────────────────────────────────────────────
  {
    id: "c1",
    name: "قهوة بن الأصيل",
    category: "cafes",
    description:
      "كافيه سعودي أصيل يقدم أجود أنواع القهوة العربية مع أجواء دافئة وتراثية تعيدك لزمن الكرم.",
    rating: 4.8,
    visits: 12450,
    gradient: "from-amber-800 to-amber-600",
    tags: ["قهوة عربية", "تراثي", "فطور"],
    branches: [
      { id: "c1-b1", name: "فرع الملقا", address: "طريق أنس بن مالك، الملقا", city: "الرياض", phone: "0114567890", openingHours: "7ص – 12م" },
      { id: "c1-b2", name: "فرع العليا", address: "طريق العليا، قرب برج المملكة", city: "الرياض", phone: "0114567891", openingHours: "7ص – 1ص" },
      { id: "c1-b3", name: "فرع النخيل", address: "مول النخيل، الدور الثاني", city: "الرياض", phone: "0114567892", openingHours: "9ص – 11م" },
    ],
    createdAt: "2024-01-10",
  },
  {
    id: "c2",
    name: "فيلدز كافيه",
    category: "cafes",
    description:
      "تجربة قهوة مختصة متميزة بأجواء خضراء طبيعية وقوائم موسمية تتجدد كل شهر.",
    rating: 4.6,
    visits: 9870,
    gradient: "from-green-700 to-emerald-500",
    tags: ["مختص", "خضري", "موسمي"],
    branches: [
      { id: "c2-b1", name: "فرع السفارات", address: "حي السفارات، شارع العروبة", city: "الرياض", phone: "0115001234" },
      { id: "c2-b2", name: "فرع التحلية", address: "شارع التحلية، جدة", city: "جدة", phone: "0125001234" },
    ],
    createdAt: "2024-02-15",
  },
  {
    id: "c3",
    name: "صدى للقهوة المختصة",
    category: "cafes",
    description:
      "باريستا معتمدون وحبوب مختارة من أجود المناشئ العالمية — تجربة تتكرر.",
    rating: 4.9,
    visits: 7650,
    gradient: "from-stone-700 to-stone-500",
    tags: ["مختص", "باريستا", "أجواء هادئة"],
    branches: [
      { id: "c3-b1", name: "فرع النزهة", address: "طريق الأمير محمد بن عبدالعزيز، النزهة", city: "الرياض", phone: "0116001234" },
    ],
    createdAt: "2024-03-01",
  },
  {
    id: "c4",
    name: "ريحان كافيه",
    category: "cafes",
    description: "مزيج رائع بين القهوة المختصة والإطلالات المميزة في أحياء الرياض.",
    rating: 4.5,
    visits: 6100,
    gradient: "from-teal-700 to-cyan-600",
    tags: ["إطلالة", "رومانسي", "هادئ"],
    branches: [
      { id: "c4-b1", name: "فرع حي الياسمين", address: "شارع الياسمين", city: "الرياض", phone: "0117100234" },
      { id: "c4-b2", name: "فرع البلفار", address: "بلفار الرياض", city: "الرياض", phone: "0117100235" },
    ],
    createdAt: "2024-03-20",
  },
  // ── مطاعم ────────────────────────────────────────────────────────────
  {
    id: "r1",
    name: "نخبة الفحم",
    category: "restaurants",
    description:
      "أشهى المشويات والمندي والكبسة على الحطب بنكهة تراثية أصيلة تصل لكل المدن.",
    rating: 4.7,
    visits: 18900,
    gradient: "from-red-800 to-orange-600",
    tags: ["مشويات", "مندي", "تراثي"],
    branches: [
      { id: "r1-b1", name: "الرياض – التخصصي", address: "طريق الملك فهد، التخصصي", city: "الرياض", phone: "0118001234" },
      { id: "r1-b2", name: "جدة – السلامة", address: "طريق الكورنيش، السلامة", city: "جدة", phone: "0128001234" },
      { id: "r1-b3", name: "الدمام – الملك فيصل", address: "شارع الملك فيصل", city: "الدمام", phone: "0138001234" },
      { id: "r1-b4", name: "المدينة – طريق الهجرة", address: "طريق الهجرة", city: "المدينة المنورة", phone: "0148001234" },
    ],
    createdAt: "2023-11-20",
  },
  {
    id: "r2",
    name: "مسك السوشي",
    category: "restaurants",
    description:
      "سوشي ياباني أصيل بلمسة سعودية فريدة — رولات حصرية وساشيمي طازج يومياً.",
    rating: 4.5,
    visits: 11200,
    gradient: "from-pink-700 to-rose-500",
    tags: ["ياباني", "سوشي", "بحري"],
    branches: [
      { id: "r2-b1", name: "فرع الملقا", address: "طريق أنس بن مالك", city: "الرياض", phone: "0119001234" },
      { id: "r2-b2", name: "فرع العليا", address: "شارع العليا", city: "الرياض", phone: "0119001235" },
    ],
    createdAt: "2024-01-05",
  },
  {
    id: "r3",
    name: "بيت اللحم",
    category: "restaurants",
    description:
      "تشكيلة واسعة من اللحوم المشوية والأطباق الرئيسية السعودية والعالمية لعشاق اللحوم.",
    rating: 4.4,
    visits: 15300,
    gradient: "from-amber-900 to-red-700",
    tags: ["لحوم", "مشويات", "عائلي"],
    branches: [
      { id: "r3-b1", name: "فرع القيروان", address: "طريق القيروان", city: "الرياض", phone: "0117001234" },
      { id: "r3-b2", name: "فرع حطين", address: "طريق حطين", city: "الرياض", phone: "0117001235" },
    ],
    createdAt: "2024-02-10",
  },
  {
    id: "r4",
    name: "مطعم الصفوة",
    category: "restaurants",
    description: "أطباق سعودية وخليجية أصيلة في أجواء عائلية دافئة ومريحة.",
    rating: 4.6,
    visits: 13700,
    gradient: "from-yellow-700 to-amber-600",
    tags: ["سعودي", "خليجي", "عائلي"],
    branches: [
      { id: "r4-b1", name: "فرع العزيزية", address: "حي العزيزية", city: "الرياض", phone: "0112001234" },
    ],
    createdAt: "2024-01-30",
  },
  // ── عيادات ───────────────────────────────────────────────────────────
  {
    id: "cl1",
    name: "عيادة الدكتور فيصل للأسنان",
    category: "clinics",
    description:
      "عيادة أسنان متخصصة بأحدث التقنيات وطاقم متميز من أطباء الأسنان المعتمدين دولياً.",
    rating: 4.9,
    visits: 3200,
    gradient: "from-blue-700 to-cyan-500",
    tags: ["أسنان", "تجميل", "تقويم"],
    branches: [
      { id: "cl1-b1", name: "العيادة الرئيسية – العليا", address: "شارع التخصصي، حي العليا", city: "الرياض", phone: "0114441234", openingHours: "9ص – 9م" },
      { id: "cl1-b2", name: "فرع الملز", address: "شارع الإمام الشافعي", city: "الرياض", phone: "0114441235", openingHours: "9ص – 6م" },
    ],
    createdAt: "2023-09-15",
  },
  {
    id: "cl2",
    name: "مركز رعاية الجلد",
    category: "clinics",
    description:
      "عيادة متخصصة في الأمراض الجلدية والعلاجات التجميلية غير الجراحية بأحدث الأجهزة.",
    rating: 4.7,
    visits: 2800,
    gradient: "from-teal-700 to-cyan-500",
    tags: ["جلدية", "تجميل", "ليزر"],
    branches: [
      { id: "cl2-b1", name: "الفرع الرئيسي", address: "طريق الملك عبدالعزيز", city: "الرياض", phone: "0115551234", openingHours: "10ص – 8م" },
    ],
    createdAt: "2024-01-20",
  },
  {
    id: "cl3",
    name: "مركز الحياة الطبي",
    category: "clinics",
    description: "مركز صحي متكامل يضم تخصصات متعددة مع نظام حجز إلكتروني سهل.",
    rating: 4.5,
    visits: 4100,
    gradient: "from-indigo-700 to-blue-600",
    tags: ["عام", "متعدد التخصصات", "حجز إلكتروني"],
    branches: [
      { id: "cl3-b1", name: "فرع شمال الرياض", address: "طريق الملك سلمان", city: "الرياض", phone: "0116661234" },
      { id: "cl3-b2", name: "فرع الدمام", address: "طريق الملك خالد، الدمام", city: "الدمام", phone: "0136661234" },
    ],
    createdAt: "2024-02-28",
  },
  // ── صالونات ──────────────────────────────────────────────────────────
  {
    id: "s1",
    name: "بيوتي هاوس",
    category: "salons",
    description:
      "صالون نسائي فاخر يقدم خدمات التجميل الكاملة من قص وصبغ وعناية بالبشرة بأيدي خبيرات.",
    rating: 4.8,
    visits: 8900,
    gradient: "from-pink-600 to-rose-400",
    tags: ["شعر", "بشرة", "مكياج"],
    isWomenOnly: true,
    branches: [
      { id: "s1-b1", name: "فرع الياسمين", address: "طريق أنس بن مالك، الياسمين", city: "الرياض", phone: "0501234567", openingHours: "10ص – 10م" },
      { id: "s1-b2", name: "فرع الورود", address: "شارع التحلية، الورود", city: "الرياض", phone: "0501234568", openingHours: "10ص – 10م" },
      { id: "s1-b3", name: "فرع جدة", address: "طريق التحلية، البوليفارد", city: "جدة", phone: "0551234567", openingHours: "11ص – 11م" },
    ],
    createdAt: "2023-12-01",
  },
  {
    id: "s2",
    name: "لمسة إيليت",
    category: "salons",
    description:
      "خدمات تجميلية متكاملة بأيدي خبيرات معتمدات مع أحدث أجهزة العناية بالبشرة والشعر.",
    rating: 4.6,
    visits: 6700,
    gradient: "from-purple-600 to-pink-500",
    tags: ["إيليت", "باديكير", "مانيكير"],
    isWomenOnly: true,
    branches: [
      { id: "s2-b1", name: "فرع النزهة", address: "طريق الأمير سلمان", city: "الرياض", phone: "0502345678" },
      { id: "s2-b2", name: "فرع السليمانية", address: "شارع العليا", city: "الرياض", phone: "0502345679" },
    ],
    createdAt: "2024-01-25",
  },
  {
    id: "s3",
    name: "غلاسا سبا",
    category: "salons",
    description:
      "سبا نسائي متكامل يوفر جلسات استرخاء ومساج وعلاجات فاخرة للعناية الشاملة.",
    rating: 4.9,
    visits: 5400,
    gradient: "from-fuchsia-700 to-purple-500",
    tags: ["سبا", "مساج", "استرخاء"],
    isWomenOnly: true,
    branches: [
      { id: "s3-b1", name: "فرع العليا", address: "شارع العليا، البرج", city: "الرياض", phone: "0503456789", openingHours: "10ص – 11م" },
    ],
    createdAt: "2024-02-01",
  },
  // ── مجمعات ───────────────────────────────────────────────────────────
  {
    id: "m1",
    name: "بلفار الرياض",
    category: "malls",
    description:
      "وجهة ترفيهية وتسوقية متكاملة تضم أكثر من 200 محل وعشرات المطاعم والكافيهات.",
    rating: 4.5,
    visits: 45000,
    gradient: "from-emerald-700 to-teal-500",
    tags: ["تسوق", "ترفيه", "مطاعم"],
    branches: [
      { id: "m1-b1", name: "بلفار الرياض الشمالي", address: "طريق الملك سلمان", city: "الرياض", phone: "0112001234" },
    ],
    createdAt: "2024-04-01",
  },
  {
    id: "m2",
    name: "الرياض بارك",
    category: "malls",
    description:
      "مركز تسوق بمساحة 153,000 م² مع أكبر دار سينما في المملكة وأبرز ماركات العالم.",
    rating: 4.7,
    visits: 62000,
    gradient: "from-indigo-700 to-purple-600",
    tags: ["تسوق", "سينما", "عائلي"],
    branches: [
      { id: "m2-b1", name: "المبنى الرئيسي", address: "طريق الملك فهد، الرياض", city: "الرياض", phone: "0113001234" },
    ],
    createdAt: "2023-08-15",
  },
  {
    id: "m3",
    name: "مول العرب",
    category: "malls",
    description:
      "مجمع تجاري عصري يجمع بين التسوق والترفيه والمطاعم في قلب المدينة.",
    rating: 4.3,
    visits: 38000,
    gradient: "from-sky-700 to-blue-600",
    tags: ["تسوق", "ترفيه", "مطاعم"],
    branches: [
      { id: "m3-b1", name: "جدة – طريق الملك عبدالعزيز", address: "طريق الملك عبدالعزيز", city: "جدة", phone: "0126001234" },
    ],
    createdAt: "2023-10-10",
  },
];

export function getTopRated(limit = 6): Place[] {
  return [...PLACES].sort((a, b) => b.rating - a.rating).slice(0, limit);
}

export function getMostVisited(limit = 6): Place[] {
  return [...PLACES].sort((a, b) => b.visits - a.visits).slice(0, limit);
}

export function getByCategory(category: Category, limit?: number): Place[] {
  const filtered = PLACES.filter((p) => p.category === category);
  return limit ? filtered.slice(0, limit) : filtered;
}

export function getPlaceById(id: string): Place | undefined {
  return PLACES.find((p) => p.id === id);
}
