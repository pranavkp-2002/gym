// Presentational nav markup. Server-safe: takes the pathname as a prop so the
// same markup can render as a static fallback (pathname = null, no highlight)
// and, once the URL is known, from the client wrappers with the active link.

import Link from "next/link";
import { Dumbbell, Settings } from "lucide-react";
import { cn } from "cn";
import { LogoutButton } from "@/components/auth/logout-button";
import { NAV_ITEMS, SETTINGS_ITEM, isActive, type NavItem } from "./nav-items";

function SidebarLink({ item, pathname }: { item: NavItem; pathname: string | null }) {
  const active = pathname !== null && isActive(pathname, item);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
      )}
    >
      <Icon className="size-4" />
      {item.label}
    </Link>
  );
}

export function SidebarView({ pathname }: { pathname: string | null }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
      <div className="flex h-16 items-center gap-2 px-6 font-semibold">
        <Dumbbell className="size-5 text-primary" />
        <span>Gym Tracker</span>
      </div>
      <nav className="flex flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => (
          <SidebarLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-1 px-3 pb-4">
        <SidebarLink item={SETTINGS_ITEM} pathname={pathname} />
        <LogoutButton className="w-full" />
      </div>
    </aside>
  );
}

export function MobileNavView({ pathname }: { pathname: string | null }) {
  return (
    <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-background/95 backdrop-blur">
      {NAV_ITEMS.map((item) => {
        const { href, label, icon: Icon } = item;
        const active = pathname !== null && isActive(pathname, item);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-w-0 flex-col items-center gap-1 py-2 text-[11px]",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Mobile only: app name and a Settings link (Settings isn't a tab). Static. */
export function MobileTopBar() {
  return (
    <header className="flex h-12 items-center justify-between border-b border-border px-4 md:hidden">
      <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
        <Dumbbell className="size-4 text-primary" />
        Gym Tracker
      </Link>
      <Link
        href={SETTINGS_ITEM.href}
        aria-label="Settings"
        className="-mr-2 rounded-md p-2 text-muted-foreground hover:text-foreground"
      >
        <Settings className="size-5" />
      </Link>
    </header>
  );
}
