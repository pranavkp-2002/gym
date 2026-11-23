"use client";

// Client Component: Recharts measures and draws in the browser. The data comes
// from the server as props; a visually hidden table carries the same numbers.

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDayMonth, formatKg } from "@/lib/format";
import type { WeekStat } from "@/lib/types";

// Single series -> categorical slot 1 (blue), dark step. Validated against
// the app's dark surface (#0a0a0a): lightness, chroma, contrast >= 3:1 pass.
const SERIES = "#3987e5";

type Row = WeekStat & { label: string };

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: Row }[] }) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="text-muted-foreground">Week of {row.label}</p>
      <p className="mt-1 font-medium text-foreground tabular-nums">
        {row.workouts} workout{row.workouts === 1 ? "" : "s"}
      </p>
      <p className="text-muted-foreground tabular-nums">{formatKg(row.volume)}</p>
    </div>
  );
}

export function WeeklyChart({ weeks }: { weeks: WeekStat[] }) {
  const data: Row[] = weeks.map((w) => ({ ...w, label: formatDayMonth(w.weekStart) }));

  return (
    <figure>
      <figcaption className="mb-2 text-xs text-muted-foreground">
        Workouts per week, last {weeks.length} weeks
      </figcaption>
      <div className="h-44" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickMargin={8}
              minTickGap={20}
            />
            <YAxis
              allowDecimals={false}
              domain={[0, (max: number) => Math.max(3, max)]}
              tickLine={false}
              axisLine={false}
              width={24}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: "var(--muted)", opacity: 0.5 }}
              isAnimationActive={false}
            />
            <Bar dataKey="workouts" fill={SERIES} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>Workouts per week</caption>
        <thead>
          <tr>
            <th scope="col">Week of</th>
            <th scope="col">Workouts</th>
            <th scope="col">Volume</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r) => (
            <tr key={r.weekStart}>
              <td>{r.label}</td>
              <td>{r.workouts}</td>
              <td>{formatKg(r.volume)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
