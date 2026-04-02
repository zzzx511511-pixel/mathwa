import { NextResponse } from "next/server";

/** مواصفة مثوى — GET عقود العميل (بوابة C). */
export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      message: "واجهة JSON للعميل قيد الربط مع /tenant/contracts و RLS."
    },
    { status: 501 }
  );
}
