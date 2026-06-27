import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface p-6">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold text-emerald-brand">menulia.net</p>
          <h1 className="mt-2 text-2xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Log in to manage your restaurants and menus.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
