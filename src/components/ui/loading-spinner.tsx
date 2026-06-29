interface LoadingSpinnerProps {
  label?: string;
  className?: string;
}

export function LoadingSpinner({
  label = "Loading...",
  className = "",
}: LoadingSpinnerProps) {
  return (
    <div className={`flex min-h-[50vh] flex-col items-center justify-center gap-4 ${className}`}>
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-4 border-border" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-slate-700" />
      </div>
      <p className="text-sm font-medium text-gray-600">{label}</p>
    </div>
  );
}
