import { NextRequest, NextResponse } from "next/server";

function isTokenValid(token: string): boolean {
  try {
    // Basic JWT structure check (3 base64 parts separated by dots)
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    // Check if token is expired
    if (payload.exp && payload.exp * 1000 < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const publicPaths = ["/login", "/signup"];
  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p));

  const hasValidToken = token && isTokenValid(token);

  if (!hasValidToken && !isPublicPath && pathname !== "/") {
    // Clear invalid token if it exists
    const response = NextResponse.redirect(new URL("/login", request.url));
    if (token) response.cookies.set("token", "", { maxAge: 0, path: "/" });
    return response;
  }

  if (hasValidToken && isPublicPath) {
    return NextResponse.redirect(new URL("/discover", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
