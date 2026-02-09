import { NextRequest, NextResponse } from "next/server";

function parseToken(token: string): { valid: boolean; onboardingComplete?: boolean } {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return { valid: false };
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) return { valid: false };
    return { valid: true, onboardingComplete: payload.onboardingComplete };
  } catch {
    return { valid: false };
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const publicPaths = ["/login", "/signup"];
  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p));
  const isOnboarding = pathname.startsWith("/onboarding");

  const tokenInfo = token ? parseToken(token) : { valid: false };

  if (!tokenInfo.valid && !isPublicPath && pathname !== "/") {
    const response = NextResponse.redirect(new URL("/login", request.url));
    if (token) response.cookies.set("token", "", { maxAge: 0, path: "/" });
    return response;
  }

  if (tokenInfo.valid) {
    // User hasn't completed onboarding — force them to /onboarding
    if (!tokenInfo.onboardingComplete && !isOnboarding && !isPublicPath) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    // Completed onboarding — don't let them visit signup/login or onboarding again
    if (tokenInfo.onboardingComplete && (isPublicPath || isOnboarding)) {
      return NextResponse.redirect(new URL("/discover", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
