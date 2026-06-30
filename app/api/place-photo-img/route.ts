import { NextRequest, NextResponse } from "next/server";
import { fetchGooglePhotoUri } from "@/lib/salsabeel/google-photos";

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref") ?? "";
  if (!ref) return new NextResponse(null, { status: 400 });

  const uri = await fetchGooglePhotoUri(ref);
  if (!uri) return new NextResponse(null, { status: 404 });

  return NextResponse.redirect(uri);
}
