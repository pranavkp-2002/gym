"use client";

// Client Component: after clearing the cookie it does a full page load, so no
// React state (or a hidden page Next keeps mounted) from this user survives.

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { cn } from "cn";
import { logout } from "@/lib/actions/auth";
import { DRAFT_STORAGE_KEY } from "@/lib/workout-draft";

export function LogoutButton({ className }: { className?: string }) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await logout();
          try {
            localStorage.removeItem(DRAFT_STORAGE_KEY);
          } catch {}
          // Full reload (not router.push), per Next's auth guidance for logout:
          // discards every hidden <Activity> page and all client state.
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional full reload
          window.location.href = "/login";
        })
      }
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-foreground disabled:opacity-50",
        className
      )}
    >
      <LogOut className="size-4" />
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
