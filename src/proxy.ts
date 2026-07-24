import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

// Next.js 16 renamed the middleware.ts file convention to proxy.ts (the
// exported function/module can still be called "middleware" internally —
// next-intl's own export is unaffected — only the file name matters here).
export default createMiddleware(routing);

export const config = {
  // Run on everything except API routes, the non-localized /admin area,
  // Next internals, and static assets.
  matcher: ["/((?!api|admin|_next|_vercel|.*\\..*).*)"],
};
