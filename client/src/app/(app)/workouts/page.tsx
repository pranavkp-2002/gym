import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { WorkoutHistory } from "@/components/workouts/workout-history";
import { ListSkeleton } from "@/components/workouts/skeletons";
import { WorkoutDraftCard } from "@/components/workouts/workout-draft-card";
import { exercisesApi } from "@/lib/api";

/** Server Component: supplies exercise names (incl. hidden ones) to the draft card. */
async function WorkoutDraft() {
  const exercises = await exercisesApi.list({}, "include");
  const names = Object.fromEntries(exercises.map((e) => [e.id, e.name]));
  return <WorkoutDraftCard exerciseNames={names} />;
}

export default function WorkoutsPage({ searchParams }: PageProps<"/workouts">) {
  return (
    <>
      <PageHeader title="Workouts" description="Your workout history." />
      <Suspense fallback={null}>
        <div className="mb-4 empty:hidden">
          <WorkoutDraft />
        </div>
      </Suspense>
      <Suspense fallback={<ListSkeleton label="Loading workouts" />}>
        <WorkoutHistory searchParams={searchParams} />
      </Suspense>
    </>
  );
}
