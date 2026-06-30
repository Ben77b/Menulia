import Link from "next/link";
import type { ReactNode } from "react";

interface LegalDocumentLayoutProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

export function LegalDocumentLayout({ title, lastUpdated, children }: LegalDocumentLayoutProps) {
  return (
    <div className="air-landing min-h-screen bg-white font-sans text-slate-900">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-3xl items-center px-6 py-6 sm:px-10">
          <Link href="/" className="air-link">
            ← menulia.net
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 py-16 sm:px-10 sm:py-20">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
        <p className="mt-3 text-sm tracking-wide text-muted-foreground">Last updated: {lastUpdated}</p>
        <div className="mt-14 space-y-14">{children}</div>
      </article>

      <footer className="border-t border-border bg-white px-6 py-10">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-3">
          <Link href="/privacy" className="air-link">
            Privacy Policy
          </Link>
          <Link href="/terms" className="air-link">
            Terms of Service
          </Link>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} menulia.net
        </p>
      </footer>
    </div>
  );
}

interface LegalSectionProps {
  number: number;
  title: string;
  children: ReactNode;
}

export function LegalSection({ number, title, children }: LegalSectionProps) {
  return (
    <section>
      <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
        <span className="mr-1.5">{number}.</span>
        {title}
      </h2>
      <div className="mt-5 space-y-4 text-[15px] leading-7 tracking-normal text-slate-600">
        {children}
      </div>
    </section>
  );
}
