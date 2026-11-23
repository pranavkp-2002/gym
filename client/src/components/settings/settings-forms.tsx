"use client";

// Client Components only for useActionState (inline success/error messages).

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword, updateProfile, type SettingsFormState } from "@/lib/actions/auth";

function Status({ state }: { state: SettingsFormState }) {
  return (
    <p aria-live="polite" className="text-sm">
      {state.error && <span className="text-destructive">{state.error}</span>}
      {state.success && <span className="text-muted-foreground">{state.success}</span>}
    </p>
  );
}

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [state, action, pending] = useActionState(updateProfile, {});
  return (
    // Keyed on the saved values + failed attempts so fields show the current data.
    <form key={`${name}|${email}|${state.attempt ?? 0}`} action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="profile-name">Name</Label>
        <Input id="profile-name" name="name" required maxLength={80} defaultValue={name} autoComplete="name" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="profile-email">Email</Label>
        <Input id="profile-email" name="email" type="email" required defaultValue={email} autoComplete="email" />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save profile"}</Button>
        <Status state={state} />
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, {});
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="current-password">Current password</Label>
        <Input id="current-password" name="currentPassword" type="password" required autoComplete="current-password" maxLength={72} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="new-password">New password</Label>
          <Input id="new-password" name="newPassword" type="password" required minLength={8} maxLength={72} autoComplete="new-password" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Confirm new password</Label>
          <Input id="confirm-password" name="confirmPassword" type="password" required maxLength={72} autoComplete="new-password" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" disabled={pending}>{pending ? "Changing…" : "Change password"}</Button>
        <Status state={state} />
      </div>
    </form>
  );
}
