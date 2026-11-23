"use client";

// Client Component only to show the API's error inline via useActionState.
// Used for reversible actions (hide / show again), so no confirm() prompt.

import { useActionState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { ExerciseActionState } from "@/lib/actions/exercises";

type Action = (prev: ExerciseActionState, formData: FormData) => Promise<ExerciseActionState>;

export function ExerciseActionButton({
  action,
  id,
  label,
  icon,
  showLabel = false,
}: {
  /** A Server Action that reads `id` from the form data. */
  action: Action;
  id: string;
  /** Accessible name; also shown as text when `showLabel` is set. */
  label: string;
  icon: ReactNode;
  showLabel?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex items-center gap-2">
      {state.error && (
        <p role="alert" className="max-w-48 text-right text-xs text-destructive">
          {state.error}
        </p>
      )}
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        variant="ghost"
        size={showLabel ? "sm" : "icon-sm"}
        disabled={pending}
        aria-label={showLabel ? undefined : label}
        title={label}
      >
        {icon}
        {showLabel && label}
      </Button>
    </form>
  );
}
