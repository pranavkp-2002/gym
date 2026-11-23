import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { WorkoutHistory } from "@/components/workouts/workout-history";
import { ListSkeleton } from "@/components/workouts/skeletons";

export default function WorkoutsPage({ searchParams }: PageProps<"/workouts">) {
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Workouts" description="Your workout history." />
        <Link href="/log" className={buttonVariants()}>
          <Plus /> Log workout
        </Link>
      </div>
      <Suspense fallback={<ListSkeleton label="Loading workouts" />}>
        <WorkoutHistory searchParams={searchParams} />
      </Suspense>
    </>
  );
}
