"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

type StatusData = {
  total: number;
  with_coords: number;
  without_coords: number;
  google_key_set: boolean;
};

type BatchResult = {
  done: boolean;
  processed: number;
  updated: number;
  failed: number;
  skipped: number;
  next_offset: number;
  total_pending: number;
  remaining: number;
};

// ── PasswordGate ──────────────────────────────────────────────────────────────
function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw]           = useState("");
  const [error, setError]     = useState(false);
  const [loading, setLoading] = useState(false);

  async function tryLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) { onAuth(); } else { setError(true); setPw(""); }
    } catch { setError(true); setPw(""); } finally { setLoading(false); }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sal-50 px-4">
      <div className="w-full max-w-sm rounded-3xl border border-sal-100 bg-white p-8 shadow-xl space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-sal-100 text-3xl">🔒</div>
          <h1 className="text-xl font-extrabold text-ink-900">لوحة التحكم</h1>
          <p className="mt-1 text-sm text-ink-600">أدخل كلمة المرور للمتابعة</p>
        </div>
        <form onSubmit={tryLogin} className="space-y-4">
          <input type="password" value={pw}
            onChange={(e) => { setPw(e.target.value); setError(false); }}
            placeholder="كلمة المرور" autoFocus
            className={`w-full rounded-2xl border px-4 py-3 text-sm text-center tracking-widest focus:outline-none ${error ? "border-red-400 bg-red-50" : "border-sal-200 focus:border-sal-500"}`}
          />
          {error && <p className="text-center text-xs font-semibold text-red-600">كلمة المرور غير صحيحة</p>}
          <button type="submit" disabled={loading}
            className="w-full rounded-2xl bg-sal-600 py-3 text-sm font-bold text-white hover:bg-sal-700 transition disabled:opacity-60">
            {loading ? "جاري التحقق…" : "دخول"}
          </button>
        </form>
        <div className="text-center">
          <Link href="/admin" className="text-xs text-ink-500 hover:text-sal-600">← لوحة التحكم الرئيسية</Link>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
function BatchGeocodeDashboard() {
  const [status, setStatus]       = useState<StatusData | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Run state
  const [running, setRunning]     = useState(false);
  const [done, setDone]           = useState(false);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [totalUpdated, setTotalUpdated]     = useState(0);
  const [totalFailed, setTotalFailed]       = useState(0);
  const [offset, setOffset]                 = useState(0);
  const [totalPending, setTotalPending]     = useState(0);
  const [error, setError]                   = useState<string | null>(null);

  const abortRef = useRef(false);

  useEffect(() => {
    fetch("/api/admin/batch-geocode")
      .then((r) => r.json())
      .then((d: StatusData) => setStatus(d))
      .catch(() => {})
      .finally(() => setStatusLoading(false));
  }, []);

  async function runBatch(startOffset: number) {
    abortRef.current = false;
    setRunning(true);
    setDone(false);
    setError(null);

    let currentOffset = startOffset;
    let cumProcessed  = totalProcessed;
    let cumUpdated    = totalUpdated;
    let cumFailed     = totalFailed;

    while (true) {
      if (abortRef.current) break;

      try {
        const res = await fetch("/api/admin/batch-geocode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ offset: currentOffset, limit: 30 }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string };
          setError(body.error ?? `HTTP ${res.status}`);
          break;
        }

        const data: BatchResult = await res.json();
        cumProcessed += data.processed;
        cumUpdated   += data.updated;
        cumFailed    += data.failed;
        currentOffset = data.next_offset;

        setTotalProcessed(cumProcessed);
        setTotalUpdated(cumUpdated);
        setTotalFailed(cumFailed);
        setTotalPending(data.total_pending);
        setOffset(currentOffset);

        if (data.done || abortRef.current) {
          setDone(true);
          break;
        }
      } catch (err) {
        setError((err as Error).message);
        break;
      }
    }

    setRunning(false);
  }

  function startRun() {
    setTotalProcessed(0);
    setTotalUpdated(0);
    setTotalFailed(0);
    setOffset(0);
    setDone(false);
    runBatch(0);
  }

  function stopRun() {
    abortRef.current = true;
  }

  const pct = totalPending > 0 ? Math.round((totalProcessed / totalPending) * 100) : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10" dir="rtl">
      <nav className="flex items-center gap-2 text-sm text-ink-600">
        <Link href="/admin" className="hover:text-sal-600">لوحة التحكم</Link>
        <span>/</span>
        <span className="font-medium text-ink-900">جلب الإحداثيات تلقائيًا</span>
      </nav>

      <div className="rounded-2xl border border-sal-100 bg-white p-6 shadow-sm space-y-4">
        <h1 className="text-2xl font-extrabold text-ink-900">📍 جلب الإحداثيات تلقائيًا</h1>
        <p className="text-sm text-ink-600 leading-relaxed">
          هذه الأداة تمر على كل المنشآت بدون إحداثيات (lat/lng)، تبحث عن كل منشأة في Google Places،
          وتحفظ موقعها الجغرافي تلقائيًا. العملية تأخذ حوالي <strong>3-5 دقائق</strong> لكل الـ1,384 منشأة.
        </p>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          ⚠️ <strong>تكلفة Google Places:</strong> ~$0.017 للطلب × عدد المنشآت = ~$23 مرة واحدة فقط.
          الإحداثيات تُحفظ نهائيًا ولا تُعاد جلبها.
        </div>
      </div>

      {/* Status card */}
      <div className="rounded-2xl border border-sal-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-extrabold text-ink-900">الحالة الحالية</h2>
        {statusLoading ? (
          <p className="text-sm text-ink-500">جاري التحميل…</p>
        ) : status ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-sal-50 p-4 text-center">
              <p className="text-2xl font-extrabold text-sal-700">{status.total.toLocaleString()}</p>
              <p className="text-xs font-semibold text-ink-600 mt-1">إجمالي المنشآت</p>
            </div>
            <div className="rounded-xl bg-green-50 p-4 text-center">
              <p className="text-2xl font-extrabold text-green-700">{status.with_coords.toLocaleString()}</p>
              <p className="text-xs font-semibold text-ink-600 mt-1">لديها إحداثيات ✓</p>
            </div>
            <div className="rounded-xl bg-orange-50 p-4 text-center">
              <p className="text-2xl font-extrabold text-orange-700">{status.without_coords.toLocaleString()}</p>
              <p className="text-xs font-semibold text-ink-600 mt-1">بدون إحداثيات</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-red-600">فشل تحميل الحالة</p>
        )}
        {status && !status.google_key_set && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-semibold">
            ✗ GOOGLE_PLACES_API_KEY غير مضبوط — لا يمكن تشغيل الجلب
          </div>
        )}
      </div>

      {/* Run controls */}
      <div className="rounded-2xl border border-sal-100 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-extrabold text-ink-900">تشغيل الجلب</h2>

        {!running && !done && (
          <button
            onClick={startRun}
            disabled={!status?.google_key_set || status?.without_coords === 0}
            className="w-full rounded-2xl bg-sal-600 py-3 text-sm font-bold text-white hover:bg-sal-700 transition disabled:opacity-40"
          >
            {status?.without_coords === 0
              ? "✓ كل المنشآت لديها إحداثيات"
              : `بدء جلب إحداثيات ${status?.without_coords.toLocaleString() ?? "..."} منشأة`}
          </button>
        )}

        {running && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-semibold">
                <span>جاري المعالجة…</span>
                <span>{totalProcessed.toLocaleString()} / {totalPending.toLocaleString()} ({pct}%)</span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-4 rounded-full bg-sal-500 transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div className="rounded-xl bg-green-50 px-3 py-2">
                <p className="text-lg font-extrabold text-green-700">{totalUpdated}</p>
                <p className="text-xs text-green-600">تم حفظها</p>
              </div>
              <div className="rounded-xl bg-red-50 px-3 py-2">
                <p className="text-lg font-extrabold text-red-700">{totalFailed}</p>
                <p className="text-xs text-red-600">فشلت</p>
              </div>
              <div className="rounded-xl bg-gray-50 px-3 py-2">
                <p className="text-lg font-extrabold text-ink-700">{totalPending - totalProcessed}</p>
                <p className="text-xs text-ink-500">متبقية</p>
              </div>
            </div>
            <button
              onClick={stopRun}
              className="w-full rounded-2xl border border-red-200 bg-red-50 py-2.5 text-sm font-bold text-red-700 hover:bg-red-100 transition"
            >
              إيقاف
            </button>
          </div>
        )}

        {done && (
          <div className="space-y-4">
            <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-4 space-y-3">
              <p className="font-extrabold text-green-700">✓ اكتملت العملية</p>
              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                <div>
                  <p className="text-xl font-extrabold text-green-700">{totalUpdated}</p>
                  <p className="text-xs text-green-600">تم حفظ إحداثياتها</p>
                </div>
                <div>
                  <p className="text-xl font-extrabold text-red-600">{totalFailed}</p>
                  <p className="text-xs text-red-500">لم تُوجَد في Google</p>
                </div>
                <div>
                  <p className="text-xl font-extrabold text-ink-700">{totalProcessed}</p>
                  <p className="text-xs text-ink-500">إجمالي المعالجة</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setDone(false); window.location.reload(); }}
                className="flex-1 rounded-2xl border border-sal-200 bg-sal-50 py-2.5 text-sm font-bold text-sal-700 hover:bg-sal-100 transition"
              >
                تحديث الحالة
              </button>
              {totalFailed > 0 && (
                <button
                  onClick={() => { setDone(false); runBatch(offset); }}
                  className="flex-1 rounded-2xl bg-amber-500 py-2.5 text-sm font-bold text-white hover:bg-amber-600 transition"
                >
                  إعادة المحاولة للفاشلة
                </button>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            ✗ خطأ: {error}
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="rounded-2xl border border-sal-100 bg-white p-6 shadow-sm space-y-3">
        <h2 className="text-lg font-extrabold text-ink-900">آلية العمل</h2>
        <ol className="space-y-2 text-sm text-ink-700 list-none">
          {[
            "تجمع كل المنشآت بدون place.lat/lng من قاعدة البيانات",
            "لكل منشأة: تبني استعلامًا من (الاسم + الحي + العنوان + الرياض)",
            "ترسل الاستعلام لـ Google Places findplacefromtext",
            "إذا وُجدت النتيجة: تحفظ lat/lng + googlePlaceId في Supabase",
            "تنتظر 120ms بين كل طلب (حد Google: 10 طلب/ثانية)",
            "الإحداثيات تُحفظ مرة واحدة فقط — لا تُعاد جلبها لاحقًا",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sal-100 text-xs font-bold text-sal-700">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="text-center">
        <Link href="/admin" className="text-sm text-ink-500 hover:text-sal-600">
          ← العودة للوحة التحكم
        </Link>
      </div>
    </div>
  );
}

// ── Page entry ────────────────────────────────────────────────────────────────
export default function BatchGeocodePage() {
  const [authed, setAuthed]   = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch("/api/admin-auth")
      .then((r) => r.json())
      .then((d: { authed?: boolean }) => { if (d.authed) setAuthed(true); })
      .catch(() => {})
      .finally(() => setChecked(true));
  }, []);

  if (!checked) return null;
  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />;
  return <BatchGeocodeDashboard />;
}
