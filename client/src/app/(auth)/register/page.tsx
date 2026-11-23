import { AuthForm } from "@/components/auth/auth-form";

export default function RegisterPage() {
  return (
    <>
      <h1 className="mb-1 text-xl font-semibold tracking-tight">Create your account</h1>
      <p className="mb-6 text-sm text-muted-foreground">Track workouts and see your progress.</p>
      <AuthForm mode="register" />
    </>
  );
}
