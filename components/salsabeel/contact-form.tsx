"use client";

import { useState } from "react";

export function ContactForm() {
  const [form, setForm]   = useState({ name: "", email: "", type: "", message: "" });
  const [sent, setSent]   = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.type || !form.message) return;

    setLoading(true);
    setError("");

    const W3F_URL = "https://api.web3forms.com/submit";
    console.log("[Contact] Submitting to:", W3F_URL);
    try {
      const res = await fetch(W3F_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: "b7ff20af-56b7-4a2b-84f5-693a643ba6f7",
          name: form.name,
          email: form.email,
          replyto: form.email,
          subject: `[سلسبيل] رسالة جديدة: ${form.type}`,
          message: `نوع التواصل: ${form.type}\n\nالرسالة:\n${form.message}`,
          botcheck: "",
        }),
      });
      console.log("[Contact] Response status:", res.status);
      let data: { success?: boolean; message?: string } = {};
      try { data = await res.json(); } catch { /* non-JSON response */ }
      console.log("[Contact] Response body:", data);
      if (!res.ok || !data.success) {
        setError(data.message ?? `خطأ ${res.status} — حاول مرة أخرى.`);
      } else {
        setSent(true);
        setForm({ name: "", email: "", type: "", message: "" });
        setTimeout(() => setSent(false), 5000);
      }
    } catch (err) {
      console.error("[Contact] Network error:", err);
      setError("تعذّر الاتصال بالخادم، تحقق من الاتصال وأعد المحاولة.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-sal-100 bg-sal-50 px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-sal-500 focus:outline-none transition";

  return (
    <div
      className="rounded-3xl p-8 shadow-lg"
      style={{
        background: "#fff",
        border: "1px solid #e0f2fe",
        boxShadow: "0 20px 60px rgba(14,165,233,0.08)",
      }}
    >
      <h3 className="text-2xl font-black text-ink-900">أرسل لنا رسالة</h3>
      <p className="mt-1 text-sm text-ink-600">سنرد عليك في أقرب وقت ممكن</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-ink-800">الاسم</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="اسمك الكريم"
            className={inputCls}
            maxLength={100}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-ink-800">البريد الإلكتروني</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="بريدك الإلكتروني"
            className={inputCls}
            maxLength={200}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-ink-800">نوع التواصل</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className={inputCls}
          >
            <option value="">اختر...</option>
            <option>إضافة مكان</option>
            <option>اقتراح أو فكرة تطوير</option>
            <option>إعلان ومؤسسة</option>
            <option>ملاحظة أو رأي</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-ink-800">رسالتك</label>
          <textarea
            rows={4}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="اكتب رسالتك هنا..."
            className={`${inputCls} resize-none`}
            maxLength={2000}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-xl py-3.5 text-base font-black text-white transition hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: "linear-gradient(135deg,#38bdf8 0%,#0ea5e9 55%,#0369a1 100%)",
            boxShadow: "0 6px 20px rgba(56,189,248,0.35)",
          }}
        >
          {loading ? "جاري الإرسال..." : "إرسال الرسالة ✦"}
        </button>

        {sent && (
          <div className="rounded-xl bg-green-50 px-4 py-3 text-center text-sm font-bold text-green-700">
            ✓ تم إرسال رسالتك بنجاح!
          </div>
        )}
        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-bold text-red-600">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
