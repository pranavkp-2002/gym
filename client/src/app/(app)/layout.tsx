import { Suspense } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MobileNavView, SidebarView } from "@/components/layout/nav-views";
import { TimezoneSync } from "@/components/layout/timezone-sync";

/** Signed-in app shell: sidebar (desktop), bottom tabs (mobile). */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {/* The URL is runtime data on dynamic routes, so the active-link
          highlight streams in; the fallback is the same nav, unhighlighted. */}
      <Suspense fallback={<SidebarView pathname={null} />}>
        <Sidebar />
      </Suspense>
      <main className="min-w-0 flex-1 px-4 py-6 pb-24 md:px-8 md:pb-6">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
      <Suspense fallback={<MobileNavView pathname={null} />}>
        <MobileNav />
      </Suspense>
      <TimezoneSync />
    </>
  );
}
