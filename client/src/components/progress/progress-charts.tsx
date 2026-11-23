"use client";

// Client Component: Recharts draws in the browser. Data arrives as props from
// the server; each chart also renders a visually hidden table of its numbers.

import {
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDayMonth, formatKg, formatSets, formatWorkoutDate } from "@/lib/format";
import type { ProgressSession } from "@/lib/types";

// Categorical slots 1 + 2 (dark steps), validated as a pair against the app's
// dark surface (#0a0a0a): CVD ΔE 26.8, normal ΔE 31.8, contrast >= 3:1.
const BLUE = "#3987e5";
const ORANGE = "#d95926";
const DAY = 24 * 60 * 60 * 1000;

type Point = ProgressSession & { t: number };

const axisTick = { fill: "var(--muted-foreground)", fontSize: 11 };

function toPoints(sessions: ProgressSession[]): Point[] {
  return sessions.map((s) => ({ ...s, t: Date.parse(s.date) }));
}

/** Time axis; one session gets a week of padding each side so it isn't on the edge. */
function timeDomain(points: Point[]): [number, number] {
  const ts = points.map((p) => p.t);
  const min = Math.min(...ts);
  const max = Math.max(...ts);
  return min === max ? [min - 7 * DAY, max + 7 * DAY] : [min, max];
}

const dateTick = (t: number) => formatDayMonth(new Date(t).toISOString());

function TooltipCard({
  active,
  payload,
  render,
}: {
  active?: boolean;
  payload?: { payload: Point }[];
  render: (p: Point) => React.ReactNode;
}) {
  const p = payload?.[0]?.payload;
  if (!active || !p) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="text-muted-foreground">
        {formatWorkoutDate(p.date)} · {p.workoutName}
      </p>
      <div className="mt-1 space-y-0.5 tabular-nums">{render(p)}</div>
    </div>
  );
}

function Swatch({ color, dashed }: { color: string; dashed?: boolean }) {
  return (
    <svg width="16" height="8" aria-hidden className="mr-1.5 inline-block align-middle">
      <line x1="0" y1="4" x2="16" y2="4" stroke={color} strokeWidth="2" strokeDasharray={dashed ? "4 3" : undefined} />
    </svg>
  );
}

/** Direct label on the last point only (selective labelling). Text uses ink, not series color. */
function endLabel(count: number, text: string) {
  // eslint-disable-next-line react/display-name
  return (props: { x?: number | string; y?: number | string; index?: number }) => {
    if (props.index !== count - 1) return null;
    return (
      <text x={Number(props.x) + 8} y={Number(props.y) + 4} fontSize={11} fill="var(--foreground)">
        {text}
      </text>
    );
  };
}

function ChartFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <figure className="rounded-lg border border-border p-4">
      <figcaption className="mb-3 text-sm font-medium">{title}</figcaption>
      {children}
    </figure>
  );
}

/** Top-set weight (solid) and estimated 1RM (dashed) on one kg axis. */
export function StrengthChart({ sessions }: { sessions: ProgressSession[] }) {
  const points = toPoints(sessions);
  const last = points.at(-1)!;

  return (
    <ChartFrame title="Strength over time (kg)">
      <div className="h-56" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 64, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={timeDomain(points)}
              tickFormatter={dateTick}
              tick={axisTick}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
            />
            <YAxis
              tick={axisTick}
              tickLine={false}
              axisLine={false}
              width={32}
              domain={["auto", "auto"]}
            />
            <Tooltip
              isAnimationActive={false}
              cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
              content={
                <TooltipCard
                  render={(p) => (
                    <>
                      <p className="text-foreground">
                        <Swatch color={BLUE} />
                        Top set {p.topWeight} kg × {p.topWeightReps}
                      </p>
                      <p className="text-foreground">
                        <Swatch color={ORANGE} dashed />
                        Est. 1RM {p.best1RM} kg
                      </p>
                    </>
                  )}
                />
              }
            />
            <Legend
              verticalAlign="top"
              align="left"
              height={28}
              content={() => (
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span><Swatch color={BLUE} />Top set weight</span>
                  <span><Swatch color={ORANGE} dashed />Estimated 1RM</span>
                </div>
              )}
            />
            <Line
              dataKey="topWeight"
              stroke={BLUE}
              strokeWidth={2}
              dot={{ r: 4, fill: BLUE, stroke: "var(--background)", strokeWidth: 2 }}
              activeDot={{ r: 5, stroke: "var(--background)", strokeWidth: 2 }}
              isAnimationActive={false}
            >
              <LabelList content={endLabel(points.length, `${last.topWeight} kg`)} />
            </Line>
            <Line
              dataKey="best1RM"
              stroke={ORANGE}
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={{ r: 4, fill: ORANGE, stroke: "var(--background)", strokeWidth: 2 }}
              activeDot={{ r: 5, stroke: "var(--background)", strokeWidth: 2 }}
              isAnimationActive={false}
            >
              {/* Same end value as the top set: one label is enough. */}
              {last.best1RM !== last.topWeight && (
                <LabelList content={endLabel(points.length, `${last.best1RM} kg`)} />
              )}
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>
      <DataTable
        caption="Strength per session"
        head={["Date", "Top set", "Estimated 1RM"]}
        rows={points.map((p) => [formatWorkoutDate(p.date), `${p.topWeight} kg × ${p.topWeightReps}`, `${p.best1RM} kg`])}
      />
    </ChartFrame>
  );
}

/** One metric per session as a single line (volume, or reps for bodyweight). */
export function SessionMetricChart({
  sessions,
  metric,
  title,
}: {
  sessions: ProgressSession[];
  metric: "volume" | "totalReps";
  title: string;
}) {
  const points = toPoints(sessions);
  const format = (v: number) => (metric === "volume" ? formatKg(v) : `${v} reps`);

  return (
    <ChartFrame title={title}>
      <div className="h-44" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={timeDomain(points)}
              tickFormatter={dateTick}
              tick={axisTick}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
            />
            <YAxis
              tick={axisTick}
              tickLine={false}
              axisLine={false}
              width={44}
              allowDecimals={false}
              domain={[0, "auto"]}
            />
            <Tooltip
              isAnimationActive={false}
              cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
              content={
                <TooltipCard
                  render={(p) => (
                    <>
                      <p className="font-medium text-foreground">{format(p[metric])}</p>
                      <p className="text-muted-foreground">{formatSets(p.sets)}</p>
                    </>
                  )}
                />
              }
            />
            <Line
              dataKey={metric}
              stroke={BLUE}
              strokeWidth={2}
              dot={{ r: 4, fill: BLUE, stroke: "var(--background)", strokeWidth: 2 }}
              activeDot={{ r: 5, stroke: "var(--background)", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <DataTable
        caption={title}
        head={["Date", title]}
        rows={points.map((p) => [formatWorkoutDate(p.date), format(p[metric])])}
      />
    </ChartFrame>
  );
}

function DataTable({ caption, head, rows }: { caption: string; head: string[]; rows: string[][] }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}
