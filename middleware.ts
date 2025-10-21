import { NextRequest, NextResponse } from "next/server";

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";

const intlMiddleware = createMiddleware({
  locales: ["en", "zh"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

const isProtectedRoute = createRouteMatcher(["/console(.*)", "/jobs/create(.*)", "/jobs/edit(.*)"]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Skip Clerk for API routes - let them through directly
  if (req.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Apply internationalization for non-API routes
  const intlResponse = intlMiddleware(req);

  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  return intlResponse;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
