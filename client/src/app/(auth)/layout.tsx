import { Dumbbell } from "lucide-react";

/** Signed-out pages: centered card, no app navigation. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2 font-semibold">
          <Dumbbell className="size-5 text-primary" />
          Gym Tracker
        </div>
        <div className="rounded-xl border border-border p-6">{children}</div>
      </div>
    </main>
  );
}
