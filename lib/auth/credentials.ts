import { createHash, timingSafeEqual } from "crypto";

export function normalizeUsername(input: unknown): string {
  return String(input ?? "").trim().toLowerCase();
}

export function normalizeAccessCode(input: unknown): string {
  const raw = String(input ?? "");
  const westernized = raw
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776));
  return westernized.replace(/\D/g, "").slice(0, 6);
}

export function hashPassword(password: string): string {
  return createHash("sha256").update(password, "utf8").digest("hex");
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const a = hashPassword(password);
  if (a.length !== storedHash.length) return false;
  return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(storedHash, "utf8"));
}
