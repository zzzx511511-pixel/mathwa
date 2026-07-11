import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/salsabeel/admin-auth";
import { getPlaceStatuses } from "@/lib/salsabeel/place-photos";

export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();
  const statuses = await getPlaceStatuses();
  return NextResponse.json(statuses);
}
