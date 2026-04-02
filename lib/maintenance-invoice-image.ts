/** مساعدات مشتركة لعرض صور فواتير الصيانة من Storage / DB */

export function extractInvoicesPathFromStorageUrl(href: string): string | null {
  try {
    const u = new URL(href);
    const p = u.pathname;
    const m =
      p.match(/\/storage\/v1\/object\/public\/invoices\/(.+)$/) ||
      p.match(/\/storage\/v1\/object\/sign\/invoices\/(.+)$/);
    if (!m?.[1]) return null;
    return decodeURIComponent(m[1].replace(/\+/g, " "));
  } catch {
    return null;
  }
}

/** رابط يفتح معاينة الصورة (HTML آمن من نفس النطاق) */
export function getInvoiceImageViewerHref(row: Record<string, unknown>): string | null {
  const pathCandidates = [row.image_path, row.storage_path, row.invoice_image_path, row.attachment_path];
  for (const candidate of pathCandidates) {
    const p = String(candidate ?? "").trim();
    if (p) {
      return `/api/employee/maintenance-invoices/image?path=${encodeURIComponent(p)}&format=html`;
    }
  }
  const urlCandidates = [
    row.image_url,
    row.receipt_image_url,
    row.receipt_url,
    row.invoice_image_url,
    row.attachment_url,
    row.image,
    row.photo_url
  ];
  for (const candidate of urlCandidates) {
    const s = String(candidate ?? "").trim();
    if (!s) continue;
    if (s.startsWith("http://") || s.startsWith("https://")) {
      const extracted = extractInvoicesPathFromStorageUrl(s);
      if (extracted) {
        return `/api/employee/maintenance-invoices/image?path=${encodeURIComponent(extracted)}&format=html`;
      }
      return s;
    }
  }
  return null;
}

export function invoiceRowId(row: Record<string, unknown>): string {
  return String(row?.id ?? row?.request_id ?? row?.uuid ?? "");
}
