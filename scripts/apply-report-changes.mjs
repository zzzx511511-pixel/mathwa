import { readFileSync, writeFileSync } from "fs";

const filePath = new URL("../lib/salsabeel/data.ts", import.meta.url).pathname;
let content = readFileSync(filePath, "utf8");
const lines = content.split("\n");

// ─── Helper ──────────────────────────────────────────────────────────────────
function updateRegion(lines, nameMatch, newRegion) {
  let changed = false;
  const result = lines.map((line) => {
    if (!line.includes(nameMatch)) return line;
    // Replace region:"X" with region:"newRegion"
    const updated = line.replace(/region:"[^"]*"/, `region:"${newRegion}"`);
    if (updated !== line) { changed = true; console.log(`  ✅ region → ${newRegion}: ${nameMatch}`); }
    return updated;
  });
  if (!changed) console.log(`  ⚠️  NOT FOUND: ${nameMatch}`);
  return result;
}

function deleteLine(lines, nameMatch) {
  let deleted = false;
  const result = lines.filter((line) => {
    if (line.includes(nameMatch)) { deleted = true; return false; }
    return true;
  });
  if (deleted) console.log(`  🗑️  DELETED: ${nameMatch}`);
  else console.log(`  ⚠️  NOT FOUND to delete: ${nameMatch}`);
  return result;
}

let L = lines;

// ═══════════════════════════════════════════════════════════════════════════════
// 🔴 DELETE — مغلق نهائياً
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n🔴 Deleting closed places...");
L = deleteLine(L, '"r286"');   // قصر النيل
L = deleteLine(L, '"r315"');   // الريف اللبناني
L = deleteLine(L, '"r334"');   // فيلزي Felzy Lounge
L = deleteLine(L, '"r143"');   // ريد شيلي
L = deleteLine(L, '"r280"');   // زعفران الهندي - تركي سكوير

// ═══════════════════════════════════════════════════════════════════════════════
// 🔵 DELETE — درايف ثرو
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n🔵 Deleting drive-thru places...");
L = deleteLine(L, '"c377"');   // إيفري داي EveryDay
L = deleteLine(L, '"c28"');    // إنفيوز INFUSE
L = deleteLine(L, '"c95"');    // هاف مليون - العارض

// ═══════════════════════════════════════════════════════════════════════════════
// 🟠 UPDATE REGION — تصحيح المنطقة
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n🟠 Updating regions...");

// Cafes
L = updateRegion(L, "Ba'a Bakehouse",       "غرب");
L = updateRegion(L, "باء بيك هاوس",         "غرب");
L = updateRegion(L, "أندارينا",             "شرق");
L = updateRegion(L, "سيرب - الرمال",        "شرق");
L = updateRegion(L, 'name:"سيرب',           "شرق");  // سيرب بدون الرمال
L = updateRegion(L, "CU كافيه",             "شرق");
L = updateRegion(L, "سطر (Satar)",          "شرق");
L = updateRegion(L, "كوفي شيريز",           "شرق");
L = updateRegion(L, "توق (Tawaq)",          "شرق");
L = updateRegion(L, "غصن (Ghassan)",        "شرق");
L = updateRegion(L, 'name:"كور (CORE)',     "شرق");
L = updateRegion(L, "ويزدوم (Wisdom)",      "شرق");
L = updateRegion(L, "جازان (Jazean",        "غرب");
L = updateRegion(L, "تروث (TRUTH)",         "شرق");
L = updateRegion(L, "إكزيت (Exzit)",        "جنوب");
L = updateRegion(L, "أورغو (Orgo)",         "شرق");
L = updateRegion(L, "الخيمة",              "وسط");  // بيكس - الخيمة
L = updateRegion(L, "بريهانت (Breehant)",   "شمال");
L = updateRegion(L, "ROASTREE",            "شمال");
L = updateRegion(L, 'name:"قاف (Qaf)',     "وسط");
L = updateRegion(L, "هزّة",               "وسط");
L = updateRegion(L, "لوم كوفي",            "شمال");
L = updateRegion(L, "حكاية (Hikayah)",     "شمال");
L = updateRegion(L, "سو نايس (So Nice)",   "شمال");
L = updateRegion(L, "كافيه تيل",           "شمال");
L = updateRegion(L, "إيدمي (IDMI)",        "جنوب");
L = updateRegion(L, "كوفي آدرس",           "وسط");
L = updateRegion(L, "سايبرس (Cypress)",    "شمال");
L = updateRegion(L, "إليكسير بن (Elixir Bunn) - النخيل", "شمال");
L = updateRegion(L, "ناتشرال لايف",        "شمال");
L = updateRegion(L, "هدب (Hadab)",         "شرق");
L = updateRegion(L, "ثري بين (3Bean)",     "شمال");
L = updateRegion(L, 'name:"إير (AIR)',     "شمال");
L = updateRegion(L, "أشجار - العقيق",      "شمال");
L = updateRegion(L, "سولالات (Sulalat)",   "شرق");
L = updateRegion(L, "يونسورسو (UNSORSO)",  "شمال");
L = updateRegion(L, "ذا كوفي تيبل",       "غرب");
L = updateRegion(L, "هوم بيكري (Home Bakery)", "غرب");
L = updateRegion(L, "واكافيه (WACAFE)",    "غرب");
L = updateRegion(L, "أورث كافيه",          "غرب");
L = updateRegion(L, "L'OCCITANE",          "غرب");
L = updateRegion(L, "شيمينيه (Cheminee)", "غرب");
L = updateRegion(L, "سيركل 3",             "غرب");
L = updateRegion(L, "31DEC",               "شمال");
L = updateRegion(L, "ناينث ستريت",         "شمال");
L = updateRegion(L, "كافيينيشن",           "غرب");
L = updateRegion(L, "كيرنل (KERNEL)",      "شمال");
L = updateRegion(L, "سوشيابل (Sociable)", "شمال");
L = updateRegion(L, "سلالة (Sulalat)",     "شرق");
L = updateRegion(L, "إليكسير بن (Elixir Bunn)\"",  "شمال"); // without النخيل suffix
L = updateRegion(L, "أشجار الربيع (Ashjar)", "شمال");
L = updateRegion(L, 'name:"رو (ROW)',      "شمال");
L = updateRegion(L, "باشا (Bacha Coffee)", "شمال");
L = updateRegion(L, "سبيشالتي كوفيز",     "شمال");
L = updateRegion(L, "إنسبيريشن (Inspiration)", "شرق");
L = updateRegion(L, "سكولبتشر كافيه",     "شمال");
L = updateRegion(L, "شوفل روستري (Shovel)", "شمال");
L = updateRegion(L, "خلاصة المرسلات",     "شمال");
L = updateRegion(L, "أداب كافيه (ADAB)",  "شرق");
L = updateRegion(L, "مليحة الرائد",       "شمال");
L = updateRegion(L, "جيفن (Given)",       "شرق");
L = updateRegion(L, "قوام (Qawwam)",      "جنوب");
L = updateRegion(L, "مهجة (Muhjah)",      "شرق");
L = updateRegion(L, "ديبلاب (Diplab)",    "شرق");
L = updateRegion(L, "كالزي (Calzey)",     "شرق");
L = updateRegion(L, 'name:"بيكس (PEAKS)"', "شمال"); // التعاون - not الخيمة
L = updateRegion(L, "ذا كوفي سكالبتر",   "شرق");
L = updateRegion(L, "عينة (Eina)",        "جنوب");
L = updateRegion(L, "مفاز (Mafaz)",       "غرب");
L = updateRegion(L, "باليت (PALET)",      "شمال");
L = updateRegion(L, "فلتر روستري (Filter Roastery)", "غرب");
L = updateRegion(L, "تامبر (Tamper)",     "شرق");
L = updateRegion(L, "فلتر - ظهرة لبن",   "غرب");
L = updateRegion(L, "جديل (Jadeel)",      "غرب");
L = updateRegion(L, "هابي لاند ماتشا",    "غرب");
L = updateRegion(L, "قيدر (Qedar)",       "غرب");

// Restaurants
L = updateRegion(L, "كريزي بيتزا",         "وسط");
L = updateRegion(L, "مطبخ أميمتي",         "شرق");
L = updateRegion(L, "طوكيو (Tokyo)",        "وسط");
L = updateRegion(L, "سيرافينا",             "شمال");
L = updateRegion(L, "يرمين (Yrmin)",        "جنوب");
L = updateRegion(L, "في قلبك",              "شمال");
L = updateRegion(L, "تيبل تو (Table To)",   "شمال");
L = updateRegion(L, "برايم كُت",            "شمال");
L = updateRegion(L, "ماديو (Madeo)",        "غرب");

writeFileSync(filePath, L.join("\n"), "utf8");
console.log(`\n✅ Done — file written back.`);
