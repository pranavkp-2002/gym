"use client";

// Client Component: the unsaved workout lives only in this browser's
// localStorage, so it can only be read after mount.

import { useMemo, useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Save, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/form/confirm-dialog";
import { saveWorkout } from "@/lib/actions/workouts";
import { formatKg } from "@/lib/format";
import { readDraftRaw, subscribeDraft, writeDraft } from "./draft-storage";
import {
  buildPayload,
  draftVolume,
  parseStoredDraft,
  type WorkoutDraft,
} from "@/lib/workout-draft";

const clearDraft = () => writeDraft(null);

/**
 * The in-progress workout from the logger, shown once it has at least one
 * exercise, with Save / Continue / Delete. Renders nothing otherwise.
 */
export function WorkoutDraftCard({ exerciseNames }: { exerciseNames: Record<string, string> }) {
  const router = useRouter();
  // Server render: no draft (storage is browser-only). Re-read on every show,
  // since Next keeps this page mounted while you're on /log.
  const raw = useSyncExternalStore(subscribeDraft, readDraftRaw, () => null);
  const draft = useMemo<WorkoutDraft | null>(() => parseStoredDraft(raw), [raw]);
  // Tied to the draft it was raised for, so it disappears once the draft changes.
  const [failure, setFailure] = useState<{ raw: string | null; message: string }>();
  const error = failure?.raw === raw ? failure.message : undefined;
  const setError = (message?: string) => setFailure(message ? { raw, message } : undefined);
  const [saving, startSaving] = useTransition();

  if (!draft || draft.entries.length === 0) return null;

  const nameOf = (id: string) => exerciseNames[id] ?? "Exercise";
  const setCount = draft.entries.reduce((n, e) => n + e.sets.length, 0);

  const handleSave = () => {
    const result = buildPayload(draft, nameOf);
    if ("error" in result) return setError(result.error);
    setError(undefined);
    startSaving(async () => {
      const res = await saveWorkout(result.payload);
      if (res.error || !res.id) return setError(res.error ?? "Couldn't save the workout");
      clearDraft();
      router.push(`/workouts/${res.id}`);
    });
  };

  return (
    <section
      aria-label="Draft workout"
      className="rounded-lg border border-dashed border-primary/50 bg-muted/30 p-4"
    >
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Badge variant="outline">Draft</Badge>
            <span className="truncate">{draft.name.trim() || "Untitled workout"}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {draft.date && `${draft.date} · `}
            {draft.entries.length} exercise{draft.entries.length === 1 ? "" : "s"} · {setCount} set
            {setCount === 1 ? "" : "s"} · {formatKg(draftVolume(draft))}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {draft.entries.map((e) => nameOf(e.exerciseId)).join(", ")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
            <Save /> {saving ? "Saving…" : "Save"}
          </Button>
          <Link href="/log" className={buttonVariants({ variant: "secondary", size: "sm" })}>
            <Pencil /> Continue
          </Link>
          <ConfirmDialog
            title="Delete draft workout?"
            description="Your unsaved exercises and sets will be lost. This can't be undone."
            onConfirm={clearDraft}
            trigger={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={saving}
                aria-label="Delete draft"
                title="Delete draft"
              >
                <Trash2 />
              </Button>
            }
          />
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {error} — use Continue to finish it.
        </p>
      )}
    </section>
  );
}
