import { NextRequest, NextResponse } from "next/server";

// Instagram oEmbed API — free, no API key required.
// Works only with specific post URLs: https://www.instagram.com/p/CODE/
const OEMBED = "https://api.instagram.com/oembed/";

export async function GET(req: NextRequest) {
  const postsParam = req.nextUrl.searchParams.get("posts") ?? "";
  if (!postsParam) return NextResponse.json({ photos: [] });

  const postUrls = postsParam.split(",").slice(0, 5).map((u) => u.trim()).filter(Boolean);

  const results = await Promise.all(
    postUrls.map(async (url) => {
      try {
        const res = await fetch(
          `${OEMBED}?url=${encodeURIComponent(url)}&hidecaption=true`,
          { signal: AbortSignal.timeout(6000) }
        );
        if (!res.ok) return null;
        const data = await res.json();
        return (data.thumbnail_url as string) ?? null;
      } catch {
        return null;
      }
    })
  );

  const photos = results.filter(Boolean) as string[];
  return NextResponse.json({ photos }, {
    headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
  });
}
