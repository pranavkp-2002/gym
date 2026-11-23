import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { ExpiredNotice } from "@/components/auth/search-param-bits";

// Fully static form; only the ?expired notice (and the hidden ?next field
// inside the form) depend on the URL and stream in separately.
export default function LoginPage() {
  return (
    <>
      <h1 className="mb-1 text-xl font-semibold tracking-tight">Sign in</h1>
      <p className="mb-6 text-sm text-muted-foreground">Welcome back. Log your next session.</p>
      <Suspense fallback={null}>
        <ExpiredNotice />
      </Suspense>
      <AuthForm mode="login" />
    </>
  );
}
