import type { NextRequest } from 'next/server'

import { authMiddleware } from "@propelauth/nextjs/server/app-router";
 
// This function can be marked `async` if using `await` inside
export function proxy(request: NextRequest) {
    return authMiddleware(request);
}
 
export const config = {
    matcher: [
      // Match all API routes except Inngest, and all v2 routes
      "/(v1|api/(?!inngest).*)",
      // OPTIONAL: Don't match any static assets or OAuth callback pages
      "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
  };
  