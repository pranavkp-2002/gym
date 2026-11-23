import { Suspense } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { Dashboard, DashboardSkeleton } from "@/components/dashboard/dashboard";

// Header + quick-start button are static (prerendered); the stats depend on
// the user's timezone cookie and fresh data, so they stream in.
export default function DashboardPage() {
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Dashboard" description="Your training at a glance." />
        <Link href="/log" className={buttonVariants({ size: "lg" })}>
          <Play /> Start workout
        </Link>
      </div>
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard />
      </Suspense>
    </>
  );
}
