"use client";

import { useState } from "react";

export function SuggestPlaceForm() {
  const [name, setName]       = useState("");
  const [area, setArea]       = useState("");
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || loading) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "suggest_place",
          content: { suggestedName: name.trim(), area: area.trim() || undefined },
        }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
      setName("");
      setArea("");
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
        <p className="text-2xl">✅</p>
        <p className="mt-2 font-bold text-green-800">وصل اقتراحك! شكراً لمساهمتك</p>
        <button
          onClick={() => setSent(false)}
          className="mt-3 text-xs text-green-600 hover:underline"
        >
          اقترح مكان آخر
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-sal-100 bg-white p-6 shadow-sm">
      <h3 className="text-base font-extrabold text-ink-900 mb-1">📍 اقترح منشأة غير موجودة</h3>
      <p className="text-xs text-ink-500 mb-4">مكان مفيد مش موجود في الموقع؟ أخبرنا باسمه وسنضيفه</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسم المنشأة *"
          maxLength={150}
          required
          className="w-full rounded-xl border border-sal-200 bg-sal-50 px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-sal-500 focus:outline-none"
        />
        <input
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="المنطقة أو الحي (اختياري)"
          maxLength={100}
          className="w-full rounded-xl border border-sal-200 bg-sal-50 px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-sal-500 focus:outline-none"
        />
        {error && <p className="text-xs font-semibold text-red-600">حدث خطأ، حاول مجددًا</p>}
        <button
          type="submit"
          disabled={!name.trim() || loading}
          className="w-full rounded-xl bg-sal-600 py-2.5 text-sm font-bold text-white hover:bg-sal-700 disabled:opacity-40 transition"
        >
          {loading ? "جارٍ الإرسال…" : "إرسال الاقتراح"}
        </button>
      </form>
    </div>
  );
}
