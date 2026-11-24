"use client";

// Client Component: starting a routine writes the logger's draft to
// localStorage (where /log reads it), asking first if that would replace
// unsaved work.

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/form/confirm-dialog";
import { readDraftRaw, subscribeDraft, writeDraft } from "@/components/workouts/draft-storage";
import { draftFromRoutine, isDraftEmpty, localToday, parseStoredDraft } from "@/lib/workout-draft";
import type { Routine } from "@/lib/types";

export function StartRoutineButton({
  routine,
  label = "Start",
  size = "sm",
}: {
  routine: Routine;
  label?: string;
  size?: "sm" | "default" | "lg";
}) {
  const router = useRouter();
  const raw = useSyncExternalStore(subscribeDraft, readDraftRaw, () => null);
  const existing = parseStoredDraft(raw);
  const hasDraft = existing !== null && !isDraftEmpty(existing);
  const empty = routine.exercises.every((e) => !e.exercise);

  const start = () => {
    writeDraft(draftFromRoutine(routine, localToday()));
    router.push("/log");
  };

  const button = (
    <Button type="button" size={size} disabled={empty} onClick={hasDraft ? undefined : start}>
      <Play /> {label}
    </Button>
  );

  if (!hasDraft) return button;
  return (
    <ConfirmDialog
      trigger={button}
      title="Replace your unsaved workout?"
      description={`You have an unsaved workout${existing.name.trim() ? ` ("${existing.name.trim()}")` : ""}. Starting "${routine.name}" will replace it.`}
      confirmLabel="Start routine"
      onConfirm={start}
    />
  );
}
