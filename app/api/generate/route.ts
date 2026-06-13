import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CATEGORY_LABELS: Record<string, string> = {
  cafes:       "مقهى / كافيه",
  restaurants: "مطعم",
  clinics:     "عيادة / مركز طبي",
  salons:      "صالون تجميل",
  malls:       "مول / مجمع تجاري",
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
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
  const tags     = String(body.tags     ?? "").trim();
  const field    = String(body.field    ?? "description").trim(); // "description" | "opinion"

  if (!name) {
    return NextResponse.json({ error: "اسم المكان مطلوب" }, { status: 400 });
  }

  const catLabel = CATEGORY_LABELS[category] ?? category;

  const prompts: Record<string, string> = {
    description: `اكتب وصفاً موجزاً وجذاباً (جملتان إلى ثلاث جمل) بالعربية الفصحى البسيطة لمكان اسمه "${name}" في الرياض، تصنيفه: ${catLabel}${tags ? `، وسومه: ${tags}` : ""}. لا تبدأ الوصف باسم المكان، ولا تستخدم كليشيهات مثل "يقدم تجربة فريدة". اجعل النص مباشراً ومفيداً للزوار.`,
    opinion:     `اكتب تقييماً موجزاً (جملة أو جملتان) بصيغة "ما يقوله الناس" بالعربية العامية السعودية عن مكان اسمه "${name}" في الرياض، تصنيفه: ${catLabel}${tags ? `، وسومه: ${tags}` : ""}. اجعله يبدو تلقائياً وواقعياً كأنه رأي زائر حقيقي. يجب أن يكون إيجابياً بشكل معتدل.`,
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
