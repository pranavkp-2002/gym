"use client";

// Client Component because it asks for confirmation in a dialog and must show
// the API's error inline (e.g. "used in a workout") instead of crashing the page.

import { useActionState, useRef } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "./confirm-dialog";

type DeleteAction = (prev: { error?: string }, formData: FormData) => Promise<{ error?: string }>;

export function ConfirmDeleteButton({
  action,
  id,
  title,
  confirmMessage,
  label,
  showLabel = false,
}: {
  /** A Server Action that reads `id` from the form data. */
  action: DeleteAction;
  id: string;
  /** Dialog heading, e.g. "Delete exercise?". */
  title: string;
  /** Dialog body text. */
  confirmMessage: string;
  /** Accessible name; also shown as text when `showLabel` is set. */
  label: string;
  showLabel?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={formAction} className="flex items-center gap-2">
      {state.error && (
        <p role="alert" className="max-w-48 text-right text-xs text-destructive">
          {state.error}
        </p>
      )}
      <input type="hidden" name="id" value={id} />
      <ConfirmDialog
        title={title}
        description={confirmMessage}
        onConfirm={() => formRef.current?.requestSubmit()}
        trigger={
          <Button
            type="button"
            variant={showLabel ? "destructive" : "ghost"}
            size={showLabel ? "default" : "icon-sm"}
            disabled={pending}
            aria-label={showLabel ? undefined : label}
            title={label}
          >
            <Trash2 />
            {showLabel && label}
          </Button>
        }
      />
    </form>
  );
}
