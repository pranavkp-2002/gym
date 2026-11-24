import { Suspense } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { Dashboard, DashboardSkeleton } from "@/components/dashboard/dashboard";
import { StartRoutineButton } from "@/components/routines/start-routine-button";
import { routinesApi } from "@/lib/api";
import { upNext } from "@/lib/routines";

const chooseButton = (
  <Link href="/routines" className={buttonVariants({ size: "lg" })}>
    <Play /> Start workout
  </Link>
);

/** One tap to the routine that's up next; without routines, pick one on /routines. */
async function StartNext() {
  const next = upNext(await routinesApi.list());
  if (!next) return chooseButton;
  return (
    <div className="flex flex-col items-end gap-1">
      <StartRoutineButton routine={next} label={`Start: ${next.name}`} size="lg" />
      <Link href="/routines" className="text-xs text-muted-foreground hover:text-foreground">
        or choose another
      </Link>
    </div>
  );
}

// The header is static (prerendered); the start button and stats depend on
// fresh data and the user's timezone cookie, so they stream in.
export default function DashboardPage() {
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Dashboard" description="Your training at a glance." />
        <Suspense fallback={chooseButton}>
          <StartNext />
        </Suspense>
      </div>
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard />
      </Suspense>
    </>
  );
}
