"use client";

// Client Component only for useActionState (inline errors, keeping typed values).
// Credentials go to a Server Action; the browser never sees the token.

import Link from "next/link";
import { Suspense, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, register, type AuthFormState } from "@/lib/actions/auth";
import { NextField } from "./search-param-bits";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    mode === "login" ? login : register,
    {}
  );
  const isLogin = mode === "login";

  return (
    <form action={action} className="space-y-4">
      {isLogin && (
        <Suspense fallback={null}>
          <NextField />
        </Suspense>
      )}
      {!isLogin && (
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" autoComplete="name" required maxLength={80} defaultValue={state.values?.name} />
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          required
          minLength={isLogin ? undefined : 8}
          maxLength={72}
        />
        {!isLogin && <p className="text-xs text-muted-foreground">At least 8 characters.</p>}
      </div>
      {!isLogin && (
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required maxLength={72} />
        </div>
      )}

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" className="h-9 w-full" disabled={pending}>
        {pending ? (isLogin ? "Signing in…" : "Creating account…") : isLogin ? "Sign in" : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {isLogin ? "No account yet? " : "Already have an account? "}
        <Link href={isLogin ? "/register" : "/login"} className="text-foreground underline-offset-4 hover:underline">
          {isLogin ? "Create one" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}
