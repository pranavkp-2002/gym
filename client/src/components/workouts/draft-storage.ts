// Browser-only access to the unsaved workout in localStorage, shared by the
// Workouts page draft card and the routines "Start" button.

import { DRAFT_STORAGE_KEY, type WorkoutDraft } from "@/lib/workout-draft";

const CHANGE_EVENT = "gym:workout-draft-change";

/** For useSyncExternalStore: changes from this tab (writeDraft) or other tabs. */
export function subscribeDraft(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export function readDraftRaw(): string | null {
  try {
    return localStorage.getItem(DRAFT_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Replace (or, with null, clear) the stored draft and notify subscribers. */
export function writeDraft(draft: WorkoutDraft | null) {
  try {
    if (draft) localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    else localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {}
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
