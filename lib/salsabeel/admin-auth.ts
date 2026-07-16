import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE = "sal_admin";
const SECRET = process.env.ADMIN_SECRET ?? "";

if (!SECRET) {
  console.error(
    "[admin-auth] CRITICAL: ADMIN_SECRET is not set — all admin routes are LOCKED. " +
    "Set ADMIN_SECRET in your environment variables."
  );
}

export function isAdminAuthed(req: NextRequest): boolean {
  if (!SECRET) return false; // no secret → deny everything, never open
  const cookie = req.cookies.get(COOKIE);
  return cookie?.value === SECRET;
}

export async function isAdminAuthedServer(): Promise<boolean> {
  if (!SECRET) return false;
  const store = await cookies();
  return store.get(COOKIE)?.value === SECRET;
}

/** Sets the admin session cookie. Call from the auth API route only. */
export function setAdminCookie(res: NextResponse): void {
  res.cookies.set(COOKIE, SECRET, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 8, // 8 hours
    path: "/",
  });
}

/** Clears the admin session cookie. */
export function clearAdminCookie(res: NextResponse): void {
  res.cookies.delete(COOKIE);
}

export function unauthorized() {
  return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
}
