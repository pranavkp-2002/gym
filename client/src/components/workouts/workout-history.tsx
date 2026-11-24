import Link from "next/link";
import { ChevronLeft, ChevronRight, ListChecks, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "cn";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatKg, formatWorkoutDate } from "@/lib/format";
import { routinesApi, workoutsApi } from "@/lib/api";

type SearchParams = Record<string, string | string[] | undefined>;

const isCalendarDate = (v: unknown): v is string =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

type Filters = { from?: string; to?: string; routine?: string };

function pageHref({ from, to, routine }: Filters, page: number) {
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  if (routine) qs.set("routine", routine);
  if (page > 1) qs.set("page", String(page));
  const s = qs.toString();
  return s ? `/workouts?${s}` : "/workouts";
}

/** Server Component: date filter is a GET form; routine chips and pagination are plain links. */
export async function WorkoutHistory({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const from = isCalendarDate(params.from) ? params.from : undefined;
  const to = isCalendarDate(params.to) ? params.to : undefined;
  const routine = typeof params.routine === "string" && /^[a-f0-9]{24}$/.test(params.routine) ? params.routine : undefined;
  const page = Math.max(1, Number(params.page) || 1);
  const filters = { from, to, routine };

  const [{ items, total, pages }, routines] = await Promise.all([
    workoutsApi.list({ ...filters, page: page > 1 ? page : undefined }),
    routinesApi.list(),
  ]);
  const filtered = Boolean(from || to || routine);
  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-3 py-1 text-xs transition-colors",
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border text-muted-foreground hover:text-foreground"
    );

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
        {routine && <input type="hidden" name="routine" value={routine} />}
        <Button type="submit" variant="secondary">Filter</Button>
        {filtered && (
          <Link href="/workouts" className={buttonVariants({ variant: "ghost" })}>Clear</Link>
        )}
      </form>

      {routines.length > 0 && (
        <nav aria-label="Filter by routine" className="flex flex-wrap gap-2">
          <Link href={pageHref({ from, to }, 1)} aria-current={!routine ? "page" : undefined} className={chip(!routine)}>
            All
          </Link>
          {routines.map((r) => (
            <Link
              key={r.id}
              href={pageHref({ from, to, routine: r.id }, 1)}
              aria-current={routine === r.id ? "page" : undefined}
              className={chip(routine === r.id)}
            >
              {r.name}
            </Link>
          ))}
        </nav>
      )}

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {filtered ? "No workouts match these filters." : "No workouts yet."}
          </p>
          {!filtered && (
            <Link href="/routines" className={cn(buttonVariants(), "mt-4")}>
              <Plus /> Start your first workout
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
                    <p className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-medium">{w.name}</span>
                      {w.routine && w.routine.name !== w.name && (
                        <Badge variant="outline" className="shrink-0" title="Routine">
                          <ListChecks /> {w.routine.name}
                        </Badge>
                      )}
                      {w.routine && w.routine.name === w.name && (
                        <ListChecks className="size-3.5 shrink-0 text-muted-foreground" aria-label="From routine" />
                      )}
                    </p>
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
            <Link href={pageHref(filters, page - 1)} className={buttonVariants({ variant: "ghost" })}>
              <ChevronLeft /> Newer
            </Link>
          ) : <span />}
          <span className="text-xs text-muted-foreground">Page {page} of {pages}</span>
          {page < pages ? (
            <Link href={pageHref(filters, page + 1)} className={buttonVariants({ variant: "ghost" })}>
              Older <ChevronRight />
            </Link>
          ) : <span />}
        </nav>
      )}
    </div>
  );
}
