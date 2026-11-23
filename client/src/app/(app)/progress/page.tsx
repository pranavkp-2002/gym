import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ProgressSkeleton, ProgressView } from "@/components/progress/progress-view";

export default function ProgressPage({ searchParams }: PageProps<"/progress">) {
  return (
    <>
      <PageHeader title="Progress" description="Strength progression and personal records." />
      <Suspense fallback={<ProgressSkeleton />}>
        <ProgressView searchParams={searchParams} />
      </Suspense>
    </>
  );
}
