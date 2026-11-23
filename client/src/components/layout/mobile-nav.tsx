"use client";

import { usePathname } from "next/navigation";
import { MobileNavView } from "./nav-views";

/** Bottom tab bar for small screens. Client only to read the current URL. */
export function MobileNav() {
  return <MobileNavView pathname={usePathname()} />;
}
