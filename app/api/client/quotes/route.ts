import { NextResponse } from "next/server";

/** مواصفة مثوى — عروض PDF المرسلة للعميل. */
export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      message: "واجهة عروض الأسعار قيد الربط مع وحدة التسويق و PDF."
    },
    { status: 501 }
  );
}
