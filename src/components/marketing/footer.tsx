import Link from "next/link";

const ANCHORS = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#contact", label: "Contact" },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-lg font-semibold text-slate-900">
              menulia<span className="text-accent">.net</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Premium digital menus for modern restaurants.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">Product</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {ANCHORS.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="hover:text-slate-900">
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <Link href="/signup" className="hover:text-slate-900">
                  Start free
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">Demo menus</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/menu/la-calle-tacos" className="hover:text-slate-900">
                  La Calle Tacos
                </Link>
              </li>
              <li>
                <Link href="/menu/sakura-omakase" className="hover:text-slate-900">
                  Sakura Omakase
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} menulia.net — All rights reserved.
        </p>
      </div>
    </footer>
  );
}
