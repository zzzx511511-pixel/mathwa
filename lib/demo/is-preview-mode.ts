/**
 * معاينة قبل التفعيل: بيانات وهمية + دخول موظف بدون اتصال Supabase حقيقي.
 * أي من المتغيرين يكفي؛ عطّلهما معًا عند التشغيل الفعلي مع مفاتيح Supabase.
 */
export function isPreviewMode(): boolean {
  return (
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
    process.env.NEXT_PUBLIC_PREVIEW_UNTIL_LIVE === "true"
  );
}
