import Link from "next/link";
import { cn } from "cn";
import { RANGES, progressHref, type RangeKey } from "./ranges";

export function RangeTabs({
  exercise,
  range,
  muscleGroup,
}: {
  exercise: string;
  range: RangeKey;
  muscleGroup?: string;
}) {
  return (
    <nav aria-label="Time range" className="inline-flex rounded-lg border border-border p-0.5">
      {RANGES.map((r) => (
        <Link
          key={r.key}
          href={progressHref({ exercise, range: r.key, muscleGroup })}
          aria-current={r.key === range ? "page" : undefined}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs tabular-nums transition-colors",
            r.key === range
              ? "bg-secondary font-medium text-secondary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {r.label}
        </Link>
      ))}
    </nav>
  );
}
