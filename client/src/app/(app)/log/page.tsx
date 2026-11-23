import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { WorkoutForm } from "@/components/workouts/workout-form";
import { ListSkeleton } from "@/components/workouts/skeletons";
import { exercisesApi } from "@/lib/api";

// Server Component: loads the exercise list on the server and hands it to the
// client-side logger, so the picker is ready immediately.
async function LogWorkout() {
  const exercises = await exercisesApi.list();
  return <WorkoutForm exercises={exercises} />;
}

export default function LogWorkoutPage() {
  return (
    <>
      <PageHeader title="Log Workout" description="Add exercises and record your sets." />
      <Suspense fallback={<ListSkeleton rows={3} label="Loading" />}>
        <LogWorkout />
      </Suspense>
    </>
  );
}
