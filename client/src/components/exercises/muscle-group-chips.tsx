import Link from "next/link";
import { cn } from "cn";
import { humanize } from "@/lib/format";

/**
 * Server Component: "All" + one link chip per muscle group. The filter lives in
 * the URL, so each chip is a plain link built by `hrefFor`.
 */
export function MuscleGroupChips({
  groups,
  active,
  hrefFor,
}: {
  groups: string[];
  active?: string;
  /** URL for a chip; `undefined` is the "All" chip. */
  hrefFor: (group: string | undefined) => string;
}) {
  return (
    <nav aria-label="Filter by muscle group" className="flex flex-wrap gap-1.5">
      {[undefined, ...groups].map((group) => {
        const isActive = active === group;
        return (
          <Link
            key={group ?? "all"}
            href={hrefFor(group)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {group ? humanize(group) : "All"}
          </Link>
        );
      })}
    </nav>
  );
}
