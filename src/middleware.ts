import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

const publicPaths = [
  "/",
  "/login",
  "/auth/callback",
  "/docs",
  "/terms",
  "/privacy",
  "/_next/static",
  "/favicon.ico",
  "/dobbies.png",
];

function isPublicPath(path: string): boolean {
  return publicPaths.some((p) => (p === "/" ? path === "/" : path.startsWith(p)));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes without auth check
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Check auth for protected routes (/dashboard, /api, etc.)
  const { supabaseResponse, user } = await updateSession(request);

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
