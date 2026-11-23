"use client";

// Client Component because it needs a confirm() prompt and must show the
// API's error inline (e.g. "used in a workout") instead of crashing the page.

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type DeleteAction = (prev: { error?: string }, formData: FormData) => Promise<{ error?: string }>;

export function ConfirmDeleteButton({
  action,
  id,
  confirmMessage,
  label,
  showLabel = false,
}: {
  /** A Server Action that reads `id` from the form data. */
  action: DeleteAction;
  id: string;
  confirmMessage: string;
  /** Accessible name; also shown as text when `showLabel` is set. */
  label: string;
  showLabel?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
      className="flex items-center gap-2"
    >
      {state.error && (
        <p role="alert" className="max-w-48 text-right text-xs text-destructive">
          {state.error}
        </p>
      )}
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        variant={showLabel ? "destructive" : "ghost"}
        size={showLabel ? "default" : "icon-sm"}
        disabled={pending}
        aria-label={showLabel ? undefined : label}
      >
        <Trash2 />
        {showLabel && label}
      </Button>
    </form>
  );
}
