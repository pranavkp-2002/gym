import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import { statsApi } from "@/lib/api";
import { getUserToday } from "@/lib/today";
import { StatTiles } from "./stat-tiles";
import { WeekStrip } from "./week-strip";
import { WeeklyChart } from "./weekly-chart";
import { RecentWorkouts } from "./recent-workouts";

function Panel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg border border-border p-4", className)}>
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

/** Server Component: one API call, everything rendered on the server but the chart. */
export async function Dashboard() {
  const today = await getUserToday();
  const stats = await statsApi.dashboard(today);

  if (stats.totals.workouts === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center">
        <p className="font-medium">No workouts yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Log your first workout and your stats will show up here.
        </p>
        <Link href="/log" className={cn(buttonVariants(), "mt-4")}>
          <Plus /> Log a workout
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StatTiles stats={stats} />
      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <Panel title="Weekly activity">
          <WeekStrip
            weekStart={stats.thisWeek.weekStart}
            trainedDays={stats.thisWeek.trainedDays}
            today={stats.today}
          />
          <div className="mt-6">
            <WeeklyChart weeks={stats.weekly} />
          </div>
        </Panel>
        <Panel
          title="Recent workouts"
          action={
            <Link href="/workouts" className="text-xs text-muted-foreground hover:text-foreground">
              View all
            </Link>
          }
        >
          <RecentWorkouts workouts={stats.recent} />
        </Panel>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-[84px] animate-pulse rounded-lg bg-muted/60" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <div className="h-80 animate-pulse rounded-lg bg-muted/60" />
        <div className="h-80 animate-pulse rounded-lg bg-muted/60" />
      </div>
    </div>
  );
}
