import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { WorkoutForm } from "@/components/workouts/workout-form";
import { ListSkeleton } from "@/components/workouts/skeletons";
import { exercisesApi } from "@/lib/api";
import { loadWorkoutOr404 } from "@/lib/load-workout";
import { draftFromWorkout } from "@/lib/workout-draft";

async function EditWorkout({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [workout, exercises] = await Promise.all([loadWorkoutOr404(id), exercisesApi.list({}, "include")]);
  return (
    <>
      <Link href={`/workouts/${id}`} className={buttonVariants({ variant: "ghost", size: "sm", className: "mb-4 -ml-2" })}>
        <ChevronLeft /> Back
      </Link>
      <PageHeader title="Edit workout" description={workout.name} />
      <WorkoutForm exercises={exercises} workoutId={id} initial={draftFromWorkout(workout)} />
    </>
  );
}

export default function EditWorkoutPage({ params }: PageProps<"/workouts/[id]/edit">) {
  return (
    <Suspense fallback={<ListSkeleton rows={3} label="Loading workout" />}>
      <EditWorkout params={params} />
    </Suspense>
  );
}
