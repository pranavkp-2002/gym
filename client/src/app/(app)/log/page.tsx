import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { WorkoutForm } from "@/components/workouts/workout-form";
import { ListSkeleton } from "@/components/workouts/skeletons";
import { exercisesApi } from "@/lib/api";

// Server Component: loads the exercise list on the server and hands it to the
// client-side logger, so the picker is ready immediately.
async function LogWorkout() {
  // Include hidden ones so a restored draft still shows their names;
  // the form leaves them out of its picker.
  const exercises = await exercisesApi.list({}, "include");
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
