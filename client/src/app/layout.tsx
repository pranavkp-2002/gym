import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MobileNavView, SidebarView } from "@/components/layout/nav-views";
import { TimezoneSync } from "@/components/layout/timezone-sync";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gym Tracker",
  description: "Log workouts and track your strength progress.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Dark theme is the default (plan §7). Theme switching comes later.
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full bg-background text-foreground">
        {/* The URL is runtime data on dynamic routes, so the active-link
            highlight streams in; the fallback is the same nav, unhighlighted. */}
        <Suspense fallback={<SidebarView pathname={null} />}>
          <Sidebar />
        </Suspense>
        <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:pb-6">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
        <Suspense fallback={<MobileNavView pathname={null} />}>
          <MobileNav />
        </Suspense>
        <TimezoneSync />
      </body>
    </html>
  );
}
