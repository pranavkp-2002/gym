import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { LogoutButton } from "@/components/auth/logout-button";
import { PasswordForm, ProfileForm } from "@/components/settings/settings-forms";
import { authApi } from "@/lib/api";
import { formatWorkoutDate } from "@/lib/format";

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border p-4 sm:p-6">
      <h2 className="text-sm font-medium">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

async function SettingsContent() {
  const user = await authApi.me();
  return (
    <div className="space-y-4">
      <Section title="Profile" description={`Member since ${formatWorkoutDate(user.createdAt)}.`}>
        <ProfileForm name={user.name} email={user.email} />
      </Section>
      <Section title="Password">
        <PasswordForm />
      </Section>
      <Section title="Appearance" description="Dark theme. Light theme and switching are planned after the MVP.">
        <p className="text-sm text-muted-foreground">Theme: Dark</p>
      </Section>
      <Section title="Session">
        <LogoutButton className="-ml-3" />
      </Section>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Profile, password and preferences." />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-muted/60" aria-busy="true" />}>
        <SettingsContent />
      </Suspense>
    </>
  );
}
