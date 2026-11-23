import { cn } from "cn";

const DAY = 24 * 60 * 60 * 1000;
const LETTERS = ["M", "T", "W", "T", "F", "S", "S"];
const NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** Mon–Sun row: filled = trained that day, ring = today. Server-rendered. */
export function WeekStrip({
  weekStart,
  trainedDays,
  today,
}: {
  weekStart: string;
  trainedDays: string[];
  today: string;
}) {
  const start = new Date(`${weekStart}T00:00:00.000Z`).getTime();
  const trained = new Set(trainedDays);

  return (
    <ol className="grid grid-cols-7 gap-1" aria-label="This week">
      {LETTERS.map((letter, i) => {
        const day = new Date(start + i * DAY).toISOString().slice(0, 10);
        const done = trained.has(day);
        const isToday = day === today;
        return (
          <li key={day} className="flex flex-col items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground" aria-hidden>
              {letter}
            </span>
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-xs tabular-nums",
                done ? "bg-[#3987e5] font-medium text-white" : "bg-muted/50 text-muted-foreground",
                isToday && "ring-2 ring-foreground/70 ring-offset-2 ring-offset-background"
              )}
            >
              {Number(day.slice(8))}
            </span>
            <span className="sr-only">
              {NAMES[i]}
              {isToday ? " (today)" : ""}: {done ? "trained" : "rest"}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
