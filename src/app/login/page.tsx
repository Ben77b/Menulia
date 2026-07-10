import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PublicLandingShell } from "@/components/marketing/public-landing-shell";

export const metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <PublicLandingShell>
      <div className="air-card w-full max-w-lg air-card-pad">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold tracking-tight text-slate-900">Menulia</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Log in to manage your restaurants and menus.
          </p>
        </div>
        <Suspense fallback={<LoadingSpinner label="Preparing login..." />}>
          <LoginForm />
        </Suspense>
      </div>
    </PublicLandingShell>
  );
}
