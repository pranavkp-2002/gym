import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "cn";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatKg, formatWorkoutDate } from "@/lib/format";
import { workoutsApi } from "@/lib/api";

type SearchParams = Record<string, string | string[] | undefined>;

const isCalendarDate = (v: unknown): v is string =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

function pageHref(from: string | undefined, to: string | undefined, page: number) {
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  if (page > 1) qs.set("page", String(page));
  const s = qs.toString();
  return s ? `/workouts?${s}` : "/workouts";
}

/** Server Component: date filter is a GET form, pagination is plain links. */
export async function WorkoutHistory({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const from = isCalendarDate(params.from) ? params.from : undefined;
  const to = isCalendarDate(params.to) ? params.to : undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const { items, total, pages } = await workoutsApi.list({ from, to, page: page > 1 ? page : undefined });
  const filtered = Boolean(from || to);

  return (
    <div className="space-y-4">
      <form action="/workouts" className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor="from" className="text-xs text-muted-foreground">From</Label>
          <Input id="from" name="from" type="date" defaultValue={from} className="w-auto" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="to" className="text-xs text-muted-foreground">To</Label>
          <Input id="to" name="to" type="date" defaultValue={to} className="w-auto" />
        </div>
        <Button type="submit" variant="secondary">Filter</Button>
        {filtered && (
          <Link href="/workouts" className={buttonVariants({ variant: "ghost" })}>Clear</Link>
        )}
      </form>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {filtered ? "No workouts in this date range." : "No workouts yet."}
          </p>
          {!filtered && (
            <Link href="/log" className={cn(buttonVariants(), "mt-4")}>
              <Plus /> Log your first workout
            </Link>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {total} workout{total === 1 ? "" : "s"}
          </p>
          <ul className="space-y-2">
            {items.map((w) => (
              <li key={w.id}>
                <Link
                  href={`/workouts/${w.id}`}
                  className="block rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate font-medium">{w.name}</p>
                    <time dateTime={w.date.slice(0, 10)} className="shrink-0 text-xs text-muted-foreground">
                      {formatWorkoutDate(w.date)}
                    </time>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {w.exerciseNames.join(", ")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                    {w.exerciseCount} exercise{w.exerciseCount === 1 ? "" : "s"} · {w.setCount} set
                    {w.setCount === 1 ? "" : "s"} · {formatKg(w.volume)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between">
          {page > 1 ? (
            <Link href={pageHref(from, to, page - 1)} className={buttonVariants({ variant: "ghost" })}>
              <ChevronLeft /> Newer
            </Link>
          ) : <span />}
          <span className="text-xs text-muted-foreground">Page {page} of {pages}</span>
          {page < pages ? (
            <Link href={pageHref(from, to, page + 1)} className={buttonVariants({ variant: "ghost" })}>
              Older <ChevronRight />
            </Link>
          ) : <span />}
        </nav>
      )}
    </div>
  );
}
