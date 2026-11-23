"use client";

import { usePathname } from "next/navigation";
import { SidebarView } from "./nav-views";

/** Desktop navigation (md and up). Client only to read the current URL. */
export function Sidebar() {
  return <SidebarView pathname={usePathname()} />;
}
