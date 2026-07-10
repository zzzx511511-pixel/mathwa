import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE = "sal_admin";
const SECRET = process.env.ADMIN_SECRET ?? "";

/** Returns true when the request carries a valid admin session cookie.
 *  When ADMIN_SECRET is not configured (dev/staging), all requests pass through. */
export function isAdminAuthed(req: NextRequest): boolean {
  if (!SECRET) return true; // no secret set → open access (dev mode)
  const cookie = req.cookies.get(COOKIE);
  return cookie?.value === SECRET;
}

/** Server-component helper (reads cookies() from the Next.js store). */
export async function isAdminAuthedServer(): Promise<boolean> {
  if (!SECRET) return true;
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
