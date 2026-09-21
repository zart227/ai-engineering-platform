import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC = new Set(["/login", "/register", "/api/health"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }
  if (PUBLIC.has(pathname) || pathname === "/") {
    return NextResponse.next();
  }
  if (pathname.startsWith("/api/health")) {
    return NextResponse.next();
  }
  const session = request.cookies.get("aep_session")?.value;
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const proxyConfig = {
  matcher: ["/((?!_next/static|_next/image|.*\\.svg$).*)"],
};
