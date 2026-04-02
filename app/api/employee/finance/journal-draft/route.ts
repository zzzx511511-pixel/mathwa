import { NextResponse } from "next/server";
import { isPreviewMode } from "@/lib/demo/is-preview-mode";
import { envBool } from "@/lib/env/env-bool";

export async function POST(req: Request) {
  let body: { entryType?: unknown; amount?: unknown; description?: unknown; reference?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const entryType = String(body?.entryType ?? "").trim();
  const description = String(body?.description ?? "").trim();
  if (!description) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }
  if (!["memo", "expense", "revenue"].includes(entryType)) {
    return NextResponse.json({ ok: false, error: "invalid_entry_type" }, { status: 400 });
  }

  const amountStr = String(body?.amount ?? "").trim();
  if (amountStr && (Number.isNaN(Number(amountStr)) || Number(amountStr) < 0)) {
    return NextResponse.json({ ok: false, error: "invalid_amount" }, { status: 400 });
  }

  if (isPreviewMode() || envBool("NEXT_PUBLIC_EMPLOYEE_PORTAL_OPEN")) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json(
    {
      ok: false,
      error: "live_mode_not_configured: يلزم جدول قيود محاسبية وربط الموظف قبل الحفظ الفعلي."
    },
    { status: 501 }
  );
}
