import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import {
  ExerciseLibrary,
  ExerciseLibrarySkeleton,
} from "@/components/exercises/exercise-library";

// The header is static and prerendered. The library reads searchParams and
// fresh API data, so it streams in at request time behind <Suspense>.
export default function ExercisesPage({ searchParams }: PageProps<"/exercises">) {
  return (
    <>
      <PageHeader
        title="Exercise Library"
        description="Browse predefined exercises or add your own."
      />
      <Suspense fallback={<ExerciseLibrarySkeleton />}>
        <ExerciseLibrary searchParams={searchParams} />
      </Suspense>
    </>
  );
}
