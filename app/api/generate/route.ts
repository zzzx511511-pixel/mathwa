import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { isAdminAuthed, unauthorized } from "@/lib/salsabeel/admin-auth";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CATEGORY_LABELS: Record<string, string> = {
  cafes:       "مقهى / كافيه",
  restaurants: "مطعم",
  clinics:     "عيادة / مركز طبي",
  salons:      "صالون تجميل",
  malls:       "مول / مجمع تجاري",
};

export async function POST(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY غير مضبوط" }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const name     = String(body.name     ?? "").trim();
  const category = String(body.category ?? "").trim();
  const region   = String(body.region   ?? "").trim();
  const tags     = String(body.tags     ?? "").trim();
  const field    = String(body.field    ?? "description").trim();

  if (!name) {
    return NextResponse.json({ error: "اسم المكان مطلوب" }, { status: 400 });
  }

  const catLabel    = CATEGORY_LABELS[category] ?? category;
  const regionLabel = region ? `${region} الرياض` : "الرياض";

  if (field === "all") {
    const prompt = `أنت مساعد متخصص في كتابة محتوى عربي لتطبيق مواقع الرياض.

المكان: "${name}"
التصنيف: ${catLabel}
المنطقة: ${regionLabel}
${tags ? `الوسوم الحالية: ${tags}` : ""}

أعطني النتيجة بصيغة JSON فقط، بدون أي نص خارج الـ JSON، على هذا الشكل بالضبط:
{
  "description": "وصف موجز وجذاب (جملتان إلى ثلاث) بالعربية الفصحى البسيطة. لا تبدأ باسم المكان. لا تستخدم عبارات مثل 'تجربة فريدة'. اجعله مفيداً للزوار.",
  "opinion": "جملة أو جملتان بالعامية السعودية تمثل رأي زائر حقيقي، إيجابي بشكل طبيعي وغير مبالغ.",
  "tags": ["وسم1", "وسم2", "وسم3", "وسم4", "وسم5"],
  "keywords": ["الاسم بالعربي إذا كان إنجليزي أو بالإنجليزي إذا كان عربي", "مرادف1", "مرادف2", "englishTerm1", "englishTerm2"]
}

تعليمات الوسوم: 3–6 وسوم قصيرة مناسبة للمكان (مثل: عائلي، هادئ، قهوة متخصصة).
تعليمات كلمات البحث: 5–10 كلمات تشمل:
- اسم المكان بالعربية إذا كان الاسم إنجليزياً، أو بالإنجليزية إذا كان الاسم عربياً
- مرادفات عربية وإنجليزية للتصنيف والأنشطة
- أي كلمات يبحث عنها الناس للوصول لهذا المكان
هدفها تحسين نتائج البحث بكلا اللغتين.`;

    try {
      const message = await client.messages.create({
        model: "claude-opus-4-8",
        max_tokens: 600,
        thinking: { type: "adaptive" },
        messages: [{ role: "user", content: prompt }],
      });

      const raw = message.content
        .filter((b) => b.type === "text")
        .map((b) => (b as { type: "text"; text: string }).text)
        .join("")
        .trim();

      // Extract JSON from response (in case model adds surrounding text)
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return NextResponse.json({ error: "لم يتمكن الذكاء الاصطناعي من توليد المحتوى" }, { status: 500 });
      }

      const parsed = JSON.parse(jsonMatch[0]) as {
        description?: string;
        opinion?: string;
        tags?: string[];
        keywords?: string[];
      };

      return NextResponse.json({
        description: parsed.description ?? "",
        opinion:     parsed.opinion     ?? "",
        tags:        Array.isArray(parsed.tags)     ? parsed.tags.join(", ")     : "",
        keywords:    Array.isArray(parsed.keywords) ? parsed.keywords.join(", ") : "",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "خطأ غير معروف";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  // Single-field generation (used from edit form)
  const prompts: Record<string, string> = {
    description: `اكتب وصفاً موجزاً وجذاباً (جملتان إلى ثلاث جمل) بالعربية الفصحى البسيطة لمكان اسمه "${name}" في ${regionLabel}، تصنيفه: ${catLabel}${tags ? `، وسومه: ${tags}` : ""}. لا تبدأ الوصف باسم المكان، ولا تستخدم كليشيهات مثل "يقدم تجربة فريدة". اجعل النص مباشراً ومفيداً للزوار.`,
    opinion:     `اكتب تقييماً موجزاً (جملة أو جملتان) بصيغة "ما يقوله الناس" بالعربية العامية السعودية عن مكان اسمه "${name}" في ${regionLabel}، تصنيفه: ${catLabel}${tags ? `، وسومه: ${tags}` : ""}. اجعله يبدو تلقائياً وواقعياً كأنه رأي زائر حقيقي. يجب أن يكون إيجابياً بشكل معتدل.`,
  };

  const prompt = prompts[field] ?? prompts.description;

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 200,
      thinking: { type: "adaptive" },
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("")
      .trim();

    return NextResponse.json({ text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "خطأ غير معروف";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
