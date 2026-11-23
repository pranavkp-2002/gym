import { cn } from "cn";

/**
 * A styled native <select>. Native selects work in Server Components and in
 * plain GET forms without any client JavaScript, and are best on mobile.
 */
export function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none dark:bg-input/30",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        "[&>option]:bg-popover [&>option]:text-popover-foreground",
        className
      )}
      {...props}
    />
  );
}
