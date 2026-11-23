"use client"; // Error boundaries must be Client Components.

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-lg border border-destructive/40 p-6">
      <h2 className="font-semibold">Something went wrong</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Couldn&apos;t load this page. Check that the API server is running.
      </p>
      <Button className="mt-4" variant="secondary" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}
