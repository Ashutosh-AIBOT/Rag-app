import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-otp"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value || request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
