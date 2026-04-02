# دليل تعديل واجهة مثوى بسرعة

هذا الدليل لتعديل الواجهة بدون لمس منطق الصفحة.

## 1) تغيير خلفية الهيرو
- الملف: `lib/site/public-site-config.ts`
- عدّل قيمة:
  - `heroBackgroundImagePath`
- مثال:
  - `"/hero-riyadh.png?v=4"`
- ضع الصورة داخل مجلد `public/`.

## 2) تعديل روابط الشريط العلوي
- الملف: `lib/site/public-site-config.ts`
- المصفوفة:
  - `topNavLinks`

## 3) تعديل روابط قائمة الأقسام (Drawer)
- الملف: `lib/site/public-site-config.ts`
- المصفوفة:
  - `sidebarLinks`

## 4) تعديل صور العروض
- الملف: `lib/site/public-site-config.ts`
- المصفوفتان:
  - `suggestedIndustrialImages`
  - `suggestedGeneralImages`
- ارفع الصور داخل `public/` ثم عدّل المسارات.

## 5) تعديل أعضاء مجلس الإدارة
- الملف: `lib/site/public-site-config.ts`
- المصفوفة:
  - `boardMembers`

## 6) تعديل أرقام الإنجاز
- الملف: `lib/site/public-site-config.ts`
- المصفوفة:
  - `metrics`

## 7) تعديل بيانات الفوتر
- الملف: `lib/site/public-site-config.ts`
- القوائم:
  - `footerQuickLinks`
  - `footerContactLines`
  - `footerWorkingHoursLines`

## ملاحظة مهمة
- بعد أي تعديل بصري، نفّذ تحديث قوي في المتصفح:
  - `Ctrl + F5`
