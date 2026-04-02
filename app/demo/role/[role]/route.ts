import { NextResponse } from "next/server";

const allowedRoles = new Set([
  "visitor",
  "client",
  "tenant",
  "owner",
  "employee",
  "collector",
  "manager",
  "super_admin"
]);

export async function GET(
  request: Request,
  { params }: { params: { role: string } }
) {
  const role = allowedRoles.has(params.role) ? params.role : "employee";
  const response = NextResponse.redirect(new URL("/demo", request.url));
  response.cookies.set("demo_role", role, {
    path: "/",
    httpOnly: false,
    sameSite: "lax"
  });
  return response;
}

