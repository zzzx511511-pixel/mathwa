"use client";

import { useState } from "react";

export function ReportPlaceButton({
  placeId,
  placeName,
}: {
  placeId: string;
  placeName: string;
}) {
  const [open, setOpen]             = useState(false);
  const [description, setDescription] = useState("");
  const [sent, setSent]             = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || loading) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "edit_place",
          place_id: placeId,
          place_name: placeName,
          content: { description: description.trim() },
        }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
      setDescription("");
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-center text-sm font-bold text-green-700">
        ✅ وصل بلاغك، شكراً لمساهمتك!
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ink-100 bg-ink-50 p-4">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-2 text-xs font-semibold text-ink-500 hover:text-sal-600 transition"
        >
          🚩 أبلغ عن خطأ أو اقترح تعديل
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-ink-700">🚩 اقتراح تعديل</p>
            <button
              type="button"
              onClick={() => { setOpen(false); setError(false); }}
              className="text-xs text-ink-400 hover:text-ink-600"
            >
              ✕ إلغاء
            </button>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="صف الخطأ أو التعديل المقترح…"
            rows={3}
            maxLength={1000}
            required
            className="w-full rounded-xl border border-sal-200 bg-white px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-sal-500 focus:outline-none resize-none"
          />
          {error && <p className="text-xs font-semibold text-red-600">حدث خطأ، حاول مجددًا</p>}
          <button
            type="submit"
            disabled={!description.trim() || loading}
            className="w-full rounded-xl bg-sal-600 py-2 text-xs font-bold text-white hover:bg-sal-700 disabled:opacity-40 transition"
          >
            {loading ? "جارٍ الإرسال…" : "إرسال البلاغ"}
          </button>
        </form>
      )}
    </div>
  );
}

// One-click wrong-photo button (no modal needed — single tap action)
export function WrongPhotoButton({
  placeId,
  placeName,
  photoIndex,
  photoUrl,
}: {
  placeId: string;
  placeName: string;
  photoIndex: number;
  photoUrl: string;
}) {
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);

  async function report() {
    if (loading || sent) return;
    setLoading(true);
    try {
      await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "wrong_photo",
          place_id: placeId,
          place_name: placeName,
          content: { photoIndex, photoUrl },
        }),
      });
      setSent(true);
    } catch {
      // silently fail — non-critical
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return <span className="text-[11px] font-semibold text-green-600">✓ تم الإبلاغ</span>;
  }

  return (
    <button
      onClick={report}
      disabled={loading}
      className="flex items-center gap-1 text-[11px] font-semibold text-ink-400 hover:text-red-500 transition disabled:opacity-50"
    >
      🚩 {loading ? "…" : `الصورة ${photoIndex + 1} غير صحيحة`}
    </button>
  );
}
