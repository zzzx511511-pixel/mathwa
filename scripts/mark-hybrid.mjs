import { readFileSync, writeFileSync } from "fs";

const filePath = new URL("../lib/salsabeel/data.ts", import.meta.url).pathname;
let content = readFileSync(filePath, "utf8");

// All hybrid place IDs (restaurant + cafe combined)
const HYBRID_IDS = new Set([
  // ─── Cafes that also serve full restaurant menu ───
  "c2",   // 74 لاونج
  "c8",   // برانش آند كيك KAFD
  "c15",  // سستوريا
  "c16",  // باء بيك هاوس
  "c17",  // شَبتر
  "c18",  // شيستنت بيكري
  "c20",  // ذا بريكفاست كلوب
  "c83",  // سكولبتشر كافيه
  "c85",  // سطر
  "c105", // دوف
  "c128", // بريو 92
  "c144", // داتش برنش
  "c209", // أرتشي
  "c235", // كافيه باتيل
  "c237", // كوفا
  "c249", // سيريوس
  "c298", // ميدتاون ستريت
  "c299", // إليون بيكري
  "c302", // هوم بيكري
  "c304", // أورث كافيه
  "c306", // شيمينيه
  "c313", // غولدن بوت
  "c325", // سوشيابل
  "c343", // سكولبتشر العقيق
  "c373", // بيكس التعاون
  "c376", // إنسبيريشن بيكري
  "c406", // باليت
  "c423", // جديل
  // ─── Restaurants that also serve specialty coffee ───
  "r4",   // جونز ذا غروسر
  "r5",   // إيه أو كيتشن
  "r38",  // لي لي
  "r39",  // سادل هاوس
  "r74",  // أفيندار
  "r119", // ميز ذا هاوس
  "r130", // وايت غاردن
  "r156", // إيريك قيصر
  "r173", // لوفت
  "r232", // لو غرونييه
  "r239", // أنجلينا
  "r240", // سارابيث
  "r247", // ليزي كات
  "r248", // صم + ثينغز
  "r249", // ناك
  "r256", // نووا
  "r271", // أتاشيه
  "r296", // ذا مانشن
  "r302", // ياواتشا
  "r323", // واتر ليمون
  "r333", // فلور آند فايروود
  "r335", // ستيلا سكاي
  "r336", // V ريستوران
  "r338", // نوريا
  "r345", // نيو باي نوماد
]);

let marked = 0;
let skipped = 0;

const lines = content.split("\n").map((line) => {
  const idMatch = line.match(/\{id:"([^"]+)"/);
  if (!idMatch) return line;
  const id = idMatch[1];
  if (!HYBRID_IDS.has(id)) return line;
  if (line.includes("isHybrid:true")) { skipped++; return line; }
  // Insert isHybrid:true right after the category field
  const updated = line.replace(/(category:"[^"]+")/, '$1,isHybrid:true');
  if (updated !== line) { marked++; console.log(`  ✅ ${id}`); }
  return updated;
});

writeFileSync(filePath, lines.join("\n"), "utf8");
console.log(`\nDone: ${marked} marked, ${skipped} already set.`);
