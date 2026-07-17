import { Suspense } from "react";
import { SignupForm } from "@/components/auth/signup-form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PublicLandingShell } from "@/components/marketing/public-landing-shell";

export const metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <PublicLandingShell>
      <div className="air-card w-full max-w-lg air-card-pad">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold tracking-tight text-slate-900">Menulia</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign up with your name, email, and password. You can add your restaurant after.
          </p>
        </div>
        <Suspense fallback={<LoadingSpinner label="Preparing signup..." />}>
          <SignupForm />
        </Suspense>
      </div>
    </PublicLandingShell>
  );
}
