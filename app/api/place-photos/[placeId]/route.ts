import { NextRequest, NextResponse } from "next/server";
import { getPlacePhotos } from "@/lib/salsabeel/place-photos";

// Client-side endpoint: PlaceCard calls this for lazy-loaded card images.
// ?name=PlaceName&nbh=Neighborhood
export async function GET(
  req: NextRequest,
  { params }: { params: { placeId: string } }
) {
  const { placeId } = params;
  const name = req.nextUrl.searchParams.get("name") ?? "";
  const nbh  = req.nextUrl.searchParams.get("nbh") ?? undefined;

  if (!name || !placeId)
    return NextResponse.json({ photos: [] });

  const photos = await getPlacePhotos(placeId, name, nbh, 2);

  return NextResponse.json(
    { photos },
    { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } }
  );
}
