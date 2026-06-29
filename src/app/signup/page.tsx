import { SignupForm } from "@/components/auth/signup-form";

export const metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <div className="auth-shell flex min-h-dvh items-center justify-center bg-background p-6">
      <div className="air-card w-full max-w-lg air-card-pad">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold tracking-tight text-slate-900">menulia.net</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign up with your name, email, and password. You can add your restaurant after.
          </p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}
