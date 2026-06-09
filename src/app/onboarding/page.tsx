import { OnboardingForm } from "@/components/dashboard/onboarding-form";

export const metadata = { title: "Onboarding" };

export default function OnboardingPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface p-6">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold text-emerald-brand">menulia.io</p>
          <h1 className="mt-2 text-2xl font-bold">Set up your restaurant</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Complete onboarding to unlock your dashboard.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </div>
  );
}
