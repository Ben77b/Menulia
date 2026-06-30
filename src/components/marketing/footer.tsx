import Link from "next/link";

const ANCHORS = [
  { href: "#features", label: "Features" },
  { href: "#demo", label: "Demo" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Contact" },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-sm font-semibold tracking-tight text-slate-900">menulia.net</p>
            <p className="air-page-subtitle mt-2">
              Digital menus with dashboard-grade polish.
            </p>
          </div>
          <div>
            <p className="air-label mb-3">Explore</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {ANCHORS.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="transition-colors hover:text-slate-900">
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <Link href="/signup" className="transition-colors hover:text-slate-900">
                  Start free
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="air-label mb-3">Live demo</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/menu/santo-sushi"
                  className="transition-colors hover:text-slate-900"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Santo Sushi
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            <Link href="/privacy" className="air-link">
              Privacy Policy
            </Link>
            <Link href="/terms" className="air-link">
              Terms of Service
            </Link>
          </div>
          <p className="mt-5 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} menulia.net
          </p>
        </div>
      </div>
    </footer>
  );
}
