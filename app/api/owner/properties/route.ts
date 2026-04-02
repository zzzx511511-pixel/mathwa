import { NextResponse } from "next/server";

/** مواصفة مثوى — GET عقارات المالك (بوابة B). ربط بـ RLS لاحقاً. */
export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      message: "واجهة JSON للمالك قيد الربط مع صفحات /owner/* وقواعد RLS."
    },
    { status: 501 }
  );
}
