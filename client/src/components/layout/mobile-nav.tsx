"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { NAV_ITEMS, isActive } from "./nav-items";

// Settings is left out of the bottom bar to keep tap targets large.
const MOBILE_ITEMS = NAV_ITEMS.filter((item) => item.href !== "/settings");

/** Bottom tab bar for small screens. */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-background/95 backdrop-blur">
      {MOBILE_ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex flex-col items-center gap-1 py-2 text-[11px]",
            isActive(pathname, href) ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Icon className="size-5" />
          {label.replace(" Workout", "")}
        </Link>
      ))}
    </nav>
  );
}
