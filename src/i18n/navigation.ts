import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Use these instead of next/link and next/navigation in anything rendered
// under src/app/[locale]/** so the current locale prefix is preserved
// automatically. /admin/** and /api/** are outside that segment and keep
// using next/link / next/navigation directly.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
