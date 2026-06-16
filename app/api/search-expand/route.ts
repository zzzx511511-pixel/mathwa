import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Simple in-process cache so the same query doesn't hit Claude twice
const cache = new Map<string, string[]>();

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ terms: [] });
  }

  let q: string;
  try {
    const body = await req.json() as { q?: string };
    q = (body.q ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ terms: [] });
  }

  if (!q || q.length < 2) return NextResponse.json({ terms: [] });

  if (cache.has(q)) return NextResponse.json({ terms: cache.get(q) });

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 150,
      messages: [
        {
          role: "user",
          content: `أنت محرك بحث ثنائي اللغة للرياض. للاستعلام: "${q}"، أعطني 5-8 مصطلحات بحث مرتبطة بالعربية والإنجليزية (ترجمات، مرادفات، تهجئة شائعة). أعد مصفوفة JSON فقط بدون أي نص آخر. مثال لـ "coffee": ["coffee","قهوة","كافيه","كافية","مقهى","كوفي","cafe"]`,
        },
      ],
    });

    const raw = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("")
      .trim();

    const match = raw.match(/\[[\s\S]*?\]/);
    const terms: string[] = match ? (JSON.parse(match[0]) as string[]) : [q];

    cache.set(q, terms);
    // Evict old entries to prevent unbounded growth
    if (cache.size > 500) cache.delete(cache.keys().next().value!);

    return NextResponse.json({ terms });
  } catch {
    return NextResponse.json({ terms: [q] });
  }
}
