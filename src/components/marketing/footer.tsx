import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-surface-elevated">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-lg font-semibold">
              menulia<span className="text-emerald-brand">.io</span>
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              Premium digital menus and reservations for modern restaurants.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Product</p>
            <ul className="mt-3 space-y-2 text-sm text-text-secondary">
              <li><Link href="/services" className="hover:text-emerald-brand">Services</Link></li>
              <li><Link href="/pricing" className="hover:text-emerald-brand">Pricing</Link></li>
              <li><Link href="/dashboard" className="hover:text-emerald-brand">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium">Company</p>
            <ul className="mt-3 space-y-2 text-sm text-text-secondary">
              <li><Link href="/about" className="hover:text-emerald-brand">About</Link></li>
              <li><Link href="/blog" className="hover:text-emerald-brand">Blog</Link></li>
              <li><Link href="/contact" className="hover:text-emerald-brand">Contact</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium">Demo restaurants</p>
            <ul className="mt-3 space-y-2 text-sm text-text-secondary">
              <li><Link href="/la-calle-tacos" className="hover:text-emerald-brand">La Calle Tacos</Link></li>
              <li><Link href="/sakura-omakase" className="hover:text-emerald-brand">Sakura Omakase</Link></li>
              <li><Link href="/nonna-rosa-trattoria" className="hover:text-emerald-brand">Nonna Rosa</Link></li>
              <li><Link href="/smash-and-co" className="hover:text-emerald-brand">Smash & Co.</Link></li>
            </ul>
          </div>
        </div>
        <p className="mt-10 border-t border-border pt-6 text-center text-xs text-text-secondary">
          © {new Date().getFullYear()} menulia.io — All rights reserved.
        </p>
      </div>
    </footer>
  );
}
