import { cn } from "@/lib/utils";

type DashboardSectionCardProps = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

export function DashboardSectionCard({
  title,
  description,
  icon,
  children,
  className,
  contentClassName,
}: DashboardSectionCardProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-neutral-200/50 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] md:p-6",
        className
      )}
    >
      <div className="mb-5 flex items-start gap-3">
        {icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-slate-900">{title}</h2>
          {description ? (
            <p className="mt-1 text-xs text-neutral-500">{description}</p>
          ) : null}
        </div>
      </div>
      <div className={cn("space-y-4", contentClassName)}>{children}</div>
    </section>
  );
}

export function DashboardFieldLabel({
  label,
  hint,
  htmlFor,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
}) {
  return (
    <div className="mb-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-800">
        {label}
      </label>
      {hint ? <p className="mt-1 text-xs text-neutral-500">{hint}</p> : null}
    </div>
  );
}
