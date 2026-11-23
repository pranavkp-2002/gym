// Presentational nav markup. Server-safe: takes the pathname as a prop so the
// same markup can render as a static fallback (pathname = null, no highlight)
// and, once the URL is known, from the client wrappers with the active link.

import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { cn } from "cn";
import { NAV_ITEMS, isActive } from "./nav-items";

// Settings is left out of the bottom bar to keep tap targets large.
const MOBILE_ITEMS = NAV_ITEMS.filter((item) => item.href !== "/settings");

export function SidebarView({ pathname }: { pathname: string | null }) {
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex h-16 items-center gap-2 px-6 font-semibold">
        <Dumbbell className="size-5 text-primary" />
        <span>Gym Tracker</span>
      </div>
      <nav className="flex flex-col gap-1 px-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname !== null && isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function MobileNavView({ pathname }: { pathname: string | null }) {
  return (
    <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-background/95 backdrop-blur">
      {MOBILE_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname !== null && isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-1 py-2 text-[11px]",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="size-5" />
            {label.replace(" Workout", "")}
          </Link>
        );
      })}
    </nav>
  );
}
