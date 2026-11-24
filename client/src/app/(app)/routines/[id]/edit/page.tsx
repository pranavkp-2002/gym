import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDeleteButton } from "@/components/form/confirm-delete-button";
import { RoutineForm } from "@/components/routines/routine-form";
import { ListSkeleton } from "@/components/workouts/skeletons";
import { deleteRoutine } from "@/lib/actions/routines";
import { exercisesApi } from "@/lib/api";
import { loadRoutineOr404 } from "@/lib/load-workout";

async function EditRoutine({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [routine, exercises] = await Promise.all([
    loadRoutineOr404(id),
    exercisesApi.list({}, "include"),
  ]);
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Edit routine" description={routine.name} />
        <ConfirmDeleteButton
          action={deleteRoutine}
          id={routine.id}
          title="Delete routine?"
          confirmMessage={`"${routine.name}" will be deleted. Workouts you logged from it are kept.`}
          label="Delete"
          showLabel
        />
      </div>
      <RoutineForm
        exercises={exercises}
        routineId={routine.id}
        initial={{
          name: routine.name,
          notes: routine.notes,
          // Deleted exercises drop out; saving removes them from the routine.
          exerciseIds: routine.exercises.flatMap((e) => (e.exercise ? [e.exercise.id] : [])),
        }}
      />
    </>
  );
}

export default function EditRoutinePage({ params }: PageProps<"/routines/[id]/edit">) {
  return (
    <>
      <Link href="/routines" className={buttonVariants({ variant: "ghost", size: "sm", className: "mb-4 -ml-2" })}>
        <ChevronLeft /> Routines
      </Link>
      <Suspense fallback={<ListSkeleton rows={3} label="Loading routine" />}>
        <EditRoutine params={params} />
      </Suspense>
    </>
  );
}
