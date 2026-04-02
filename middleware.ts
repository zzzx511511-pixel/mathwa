import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const pathname = request.nextUrl.pathname;
  requestHeaders.set("x-mw-pathname", pathname);
  return NextResponse.next({
    request: { headers: requestHeaders }
  });
}

export const config = {
  // يضبط المسار لـ returnTo عند إعادة التوجيه من لوحة الموظفين (تسجيل الدخول).
  matcher: ["/employee/:path*", "/finance/:path*"]
};
