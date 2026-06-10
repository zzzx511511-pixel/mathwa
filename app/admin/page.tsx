"use client";

import { useState } from "react";
import Link from "next/link";
import { PLACES as INITIAL_PLACES } from "@/lib/salsabeel/data";
import { CATEGORIES, getCategoryMeta } from "@/lib/salsabeel/categories";
import { RatingStars } from "@/components/salsabeel/rating-stars";
import type { Place, Category } from "@/lib/salsabeel/types";

type EditState = Omit<Partial<Place>, "tags"> & { id: string; tags?: string | string[] };

export default function AdminPage() {
  const [places, setPlaces]         = useState<Place[]>(INITIAL_PLACES);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editForm, setEditForm]     = useState<EditState | null>(null);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [filterCat, setFilterCat]   = useState<string>("all");
  const [tab, setTab]               = useState<"places" | "add">("places");

  // ── Add form state ──────────────────────────────────────────────────
  const [newForm, setNewForm] = useState({
    name: "",
    category: "cafes" as Category,
    description: "",
    rating: "4.5",
    visits: "0",
    tags: "",
    isWomenOnly: false,
  });

  // ── Edit helpers ────────────────────────────────────────────────────
  function startEdit(place: Place) {
    setEditingId(place.id);
    setEditForm({
      id: place.id,
      name: place.name,
      category: place.category,
      description: place.description,
      rating: place.rating,
      tags: place.tags,
      isWomenOnly: place.isWomenOnly,
    });
  }

  function saveEdit() {
    if (!editForm) return;
    setPlaces((prev) =>
      prev.map((p) =>
        p.id === editForm.id
          ? {
              ...p,
              name: editForm.name ?? p.name,
              category: editForm.category ?? p.category,
              description: editForm.description ?? p.description,
              rating: Number(editForm.rating ?? p.rating),
              isWomenOnly: editForm.isWomenOnly,
              tags: typeof editForm.tags === "string"
                ? (editForm.tags as string).split(",").map((t) => t.trim()).filter(Boolean)
                : editForm.tags ?? p.tags,
            }
          : p
      )
    );
    setEditingId(null);
    setEditForm(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  // ── Delete helpers ──────────────────────────────────────────────────
  function confirmDelete(id: string) { setDeleteId(id); }
  function doDelete() {
    if (deleteId) setPlaces((prev) => prev.filter((p) => p.id !== deleteId));
    setDeleteId(null);
  }
  function cancelDelete() { setDeleteId(null); }

  // ── Add helpers ─────────────────────────────────────────────────────
  function handleAdd() {
    if (!newForm.name.trim()) return;
    const gradients = [
      "from-sal-700 to-teal-500",
      "from-amber-700 to-amber-500",
      "from-pink-600 to-rose-400",
    ];
    const newPlace: Place = {
      id: `custom-${Date.now()}`,
      name: newForm.name.trim(),
      category: newForm.category,
      description: newForm.description.trim(),
      rating: Math.min(5, Math.max(0, Number(newForm.rating) || 4.5)),
      visits: Math.max(0, Number(newForm.visits) || 0),
      gradient: gradients[Math.floor(Math.random() * gradients.length)],
      tags: newForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
      isWomenOnly: newForm.isWomenOnly,
      branches: [],
      createdAt: new Date().toISOString().split("T")[0],
    };
    setPlaces((prev) => [newPlace, ...prev]);
    setNewForm({ name: "", category: "cafes", description: "", rating: "4.5", visits: "0", tags: "", isWomenOnly: false });
    setTab("places");
  }

  // ── Filtered list ───────────────────────────────────────────────────
  const filtered = filterCat === "all"
    ? places
    : places.filter((p) => p.category === filterCat);

  return (
    <div className="mx-auto max-w-screen-xl space-y-6 px-5 py-10">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">لوحة التحكم</h1>
          <p className="text-sm text-ink-600">{places.length} مكان مسجّل</p>
        </div>
        <Link href="/" className="rounded-xl border border-sal-200 bg-white px-4 py-2 text-sm font-semibold text-sal-700 hover:bg-sal-50 transition">
          ← العودة للموقع
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {CATEGORIES.map((cat) => {
          const count = places.filter((p) => p.category === cat.slug).length;
          return (
            <div
              key={cat.slug}
              className="rounded-2xl p-4 text-center"
              style={{ background: cat.bg }}
            >
              <p className="text-2xl">{cat.icon}</p>
              <p className="mt-1 text-xl font-extrabold" style={{ color: cat.color }}>{count}</p>
              <p className="text-xs font-medium opacity-70" style={{ color: cat.color }}>{cat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("places")}
          className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${
            tab === "places"
              ? "bg-sal-600 text-white shadow"
              : "border border-sal-200 bg-white text-sal-700 hover:bg-sal-50"
          }`}
        >
          📋 قائمة الأماكن
        </button>
        <button
          onClick={() => setTab("add")}
          className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${
            tab === "add"
              ? "bg-gold-500 text-sal-900 shadow"
              : "border border-sal-200 bg-white text-sal-700 hover:bg-sal-50"
          }`}
        >
          ➕ إضافة مكان
        </button>
      </div>

      {/* ── ADD TAB ──────────────────────────────────────────────────── */}
      {tab === "add" && (
        <div className="rounded-2xl border border-sal-100 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-extrabold text-ink-900">إضافة مكان جديد</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-700">اسم المكان *</label>
              <input
                value={newForm.name}
                onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                className="w-full rounded-xl border border-sal-200 px-4 py-2.5 text-sm focus:border-sal-500 focus:outline-none"
                placeholder="مثال: كافيه الورد"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-700">التصنيف *</label>
              <select
                value={newForm.category}
                onChange={(e) => setNewForm({ ...newForm, category: e.target.value as Category })}
                className="w-full rounded-xl border border-sal-200 px-4 py-2.5 text-sm focus:border-sal-500 focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.icon} {c.label}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-ink-700">الوصف</label>
              <textarea
                value={newForm.description}
                onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                rows={3}
                className="w-full rounded-xl border border-sal-200 px-4 py-2.5 text-sm focus:border-sal-500 focus:outline-none resize-none"
                placeholder="وصف مختصر عن المكان..."
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-700">التقييم (0–5)</label>
              <input
                type="number"
                min={0}
                max={5}
                step={0.1}
                value={newForm.rating}
                onChange={(e) => setNewForm({ ...newForm, rating: e.target.value })}
                className="w-full rounded-xl border border-sal-200 px-4 py-2.5 text-sm focus:border-sal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-700">عدد الزيارات</label>
              <input
                type="number"
                min={0}
                value={newForm.visits}
                onChange={(e) => setNewForm({ ...newForm, visits: e.target.value })}
                className="w-full rounded-xl border border-sal-200 px-4 py-2.5 text-sm focus:border-sal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-700">الوسوم (مفصولة بفاصلة)</label>
              <input
                value={newForm.tags}
                onChange={(e) => setNewForm({ ...newForm, tags: e.target.value })}
                className="w-full rounded-xl border border-sal-200 px-4 py-2.5 text-sm focus:border-sal-500 focus:outline-none"
                placeholder="مثال: قهوة, عائلي, هادئ"
              />
            </div>
            {newForm.category === "salons" && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="womenOnly"
                  checked={newForm.isWomenOnly}
                  onChange={(e) => setNewForm({ ...newForm, isWomenOnly: e.target.checked })}
                  className="h-4 w-4 accent-pink-600"
                />
                <label htmlFor="womenOnly" className="text-sm font-medium text-ink-700">نسائية فقط</label>
              </div>
            )}
          </div>
          <div className="mt-5 flex gap-3">
            <button
              onClick={handleAdd}
              disabled={!newForm.name.trim()}
              className="rounded-xl bg-sal-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-sal-700 disabled:opacity-40 transition"
            >
              ✓ حفظ المكان
            </button>
            <button
              onClick={() => setTab("places")}
              className="rounded-xl border border-sal-200 px-6 py-2.5 text-sm font-semibold text-sal-700 hover:bg-sal-50 transition"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* ── PLACES TAB ───────────────────────────────────────────────── */}
      {tab === "places" && (
        <div className="space-y-4">
          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterCat("all")}
              className={`rounded-xl px-4 py-1.5 text-sm font-semibold transition ${
                filterCat === "all"
                  ? "bg-sal-600 text-white"
                  : "border border-sal-200 bg-white text-sal-700 hover:bg-sal-50"
              }`}
            >
              الكل ({places.length})
            </button>
            {CATEGORIES.map((cat) => {
              const count = places.filter((p) => p.category === cat.slug).length;
              return (
                <button
                  key={cat.slug}
                  onClick={() => setFilterCat(cat.slug)}
                  className={`rounded-xl px-4 py-1.5 text-sm font-semibold transition ${
                    filterCat === cat.slug
                      ? "text-white shadow"
                      : "border bg-white hover:opacity-90"
                  }`}
                  style={
                    filterCat === cat.slug
                      ? { background: cat.color }
                      : { borderColor: cat.color + "40", color: cat.color, background: cat.bg }
                  }
                >
                  {cat.icon} {cat.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-sal-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sal-100 bg-sal-50 text-xs font-bold text-ink-700">
                  <th className="px-4 py-3 text-right">المكان</th>
                  <th className="hidden px-4 py-3 text-right sm:table-cell">التصنيف</th>
                  <th className="hidden px-4 py-3 text-right md:table-cell">التقييم</th>
                  <th className="hidden px-4 py-3 text-right md:table-cell">الزيارات</th>
                  <th className="hidden px-4 py-3 text-right lg:table-cell">الفروع</th>
                  <th className="px-4 py-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((place) => {
                  const cat = getCategoryMeta(place.category);
                  const isEditing = editingId === place.id;

                  return (
                    <tr key={place.id} className={`border-b border-sal-50 last:border-0 transition ${isEditing ? "bg-sal-50" : "hover:bg-gray-50"}`}>
                      {isEditing && editForm ? (
                        <>
                          {/* Inline edit row */}
                          <td className="px-4 py-3" colSpan={5}>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-xs font-semibold text-ink-700">الاسم</label>
                                <input
                                  value={editForm.name ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                  className="w-full rounded-xl border border-sal-300 px-3 py-2 text-sm focus:border-sal-500 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-semibold text-ink-700">التصنيف</label>
                                <select
                                  value={editForm.category ?? "cafes"}
                                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value as Category })}
                                  className="w-full rounded-xl border border-sal-300 px-3 py-2 text-sm focus:border-sal-500 focus:outline-none"
                                >
                                  {CATEGORIES.map((c) => (
                                    <option key={c.slug} value={c.slug}>{c.icon} {c.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="sm:col-span-2">
                                <label className="mb-1 block text-xs font-semibold text-ink-700">الوصف</label>
                                <textarea
                                  value={editForm.description ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                  rows={2}
                                  className="w-full rounded-xl border border-sal-300 px-3 py-2 text-sm focus:border-sal-500 focus:outline-none resize-none"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-semibold text-ink-700">التقييم</label>
                                <input
                                  type="number" min={0} max={5} step={0.1}
                                  value={editForm.rating ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm, rating: Number(e.target.value) })}
                                  className="w-full rounded-xl border border-sal-300 px-3 py-2 text-sm focus:border-sal-500 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-semibold text-ink-700">الوسوم (مفصولة بفاصلة)</label>
                                <input
                                  value={Array.isArray(editForm.tags) ? editForm.tags.join(", ") : editForm.tags ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                                  className="w-full rounded-xl border border-sal-300 px-3 py-2 text-sm focus:border-sal-500 focus:outline-none"
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={saveEdit}
                                className="rounded-xl bg-sal-600 px-4 py-2 text-xs font-bold text-white hover:bg-sal-700 transition"
                              >
                                ✓ حفظ
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="rounded-xl border border-sal-200 px-4 py-2 text-xs font-semibold text-sal-700 hover:bg-sal-50 transition"
                              >
                                إلغاء
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3">
                            <div>
                              <Link href={`/places/${place.id}`} className="font-bold text-ink-900 hover:text-sal-600 transition">
                                {place.name}
                              </Link>
                              {place.isWomenOnly && (
                                <span className="mr-2 rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-bold text-pink-700">
                                  نسائية
                                </span>
                              )}
                              <p className="mt-0.5 line-clamp-1 text-xs text-ink-600">{place.description}</p>
                            </div>
                          </td>
                          <td className="hidden px-4 py-3 sm:table-cell">
                            {cat && (
                              <span
                                className="rounded-lg px-2 py-1 text-xs font-semibold"
                                style={{ background: cat.bg, color: cat.color }}
                              >
                                {cat.icon} {cat.label}
                              </span>
                            )}
                          </td>
                          <td className="hidden px-4 py-3 md:table-cell">
                            <RatingStars rating={place.rating} />
                          </td>
                          <td className="hidden px-4 py-3 text-xs text-ink-600 md:table-cell">
                            {place.visits.toLocaleString("ar-SA")}
                          </td>
                          <td className="hidden px-4 py-3 text-xs text-ink-600 lg:table-cell">
                            {place.branches.length} {place.branches.length === 1 ? "فرع" : "فروع"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              {/* Edit button — independent per row */}
                              <button
                                onClick={() => startEdit(place)}
                                className="rounded-lg border border-sal-200 bg-sal-50 px-3 py-1.5 text-xs font-bold text-sal-700 hover:border-sal-400 hover:bg-sal-100 transition"
                                title="تعديل"
                              >
                                ✏️ تعديل
                              </button>
                              {/* Delete button — independent per row */}
                              <button
                                onClick={() => confirmDelete(place.id)}
                                className="rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:border-red-300 hover:bg-red-100 transition"
                                title="حذف"
                              >
                                🗑️ حذف
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-ink-600">
                      لا توجد أماكن في هذا التصنيف
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Dialog ─────────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl">
              🗑️
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-ink-900">تأكيد الحذف</h3>
              <p className="mt-1 text-sm text-ink-600">
                هل أنت متأكد من حذف{" "}
                <span className="font-bold text-ink-900">
                  {places.find((p) => p.id === deleteId)?.name}
                </span>
                ؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={doDelete}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition"
              >
                نعم، احذف
              </button>
              <button
                onClick={cancelDelete}
                className="flex-1 rounded-xl border border-sal-200 py-2.5 text-sm font-semibold text-ink-700 hover:bg-sal-50 transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
