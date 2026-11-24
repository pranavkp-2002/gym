import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { RoutineForm } from "@/components/routines/routine-form";
import { ListSkeleton } from "@/components/workouts/skeletons";
import { exercisesApi } from "@/lib/api";

async function NewRoutine() {
  const exercises = await exercisesApi.list({}, "include");
  return <RoutineForm exercises={exercises} />;
}

export default function NewRoutinePage() {
  return (
    <>
      <Link href="/routines" className={buttonVariants({ variant: "ghost", size: "sm", className: "mb-4 -ml-2" })}>
        <ChevronLeft /> Routines
      </Link>
      <PageHeader title="New routine" description="Pick the exercises for this day, in order." />
      <Suspense fallback={<ListSkeleton rows={3} label="Loading" />}>
        <NewRoutine />
      </Suspense>
    </>
  );
}
