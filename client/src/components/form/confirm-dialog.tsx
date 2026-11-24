"use client";

import { useState, type ReactElement } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/** An in-app replacement for window.confirm(): `trigger` opens it, Confirm runs `onConfirm`. */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Delete",
  confirmVariant = "destructive",
  onConfirm,
}: {
  /** The button that opens the dialog (rendered via Base UI's `render` prop). */
  trigger: ReactElement;
  title: string;
  description?: string;
  confirmLabel?: string;
  /** "default" for confirmations that don't destroy anything permanent. */
  confirmVariant?: "destructive" | "default";
  onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={trigger} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="outline" />}>Cancel</AlertDialogClose>
          <Button
            variant={confirmVariant}
            onClick={() => {
              setOpen(false);
              onConfirm();
            }}
          >
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
