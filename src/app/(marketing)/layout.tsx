import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { StickyCta } from "@/components/marketing/sticky-cta";
import { JsonLd } from "@/components/marketing/json-ld";
import { softwareApplicationJsonLd } from "@/lib/marketing/seo";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="air-dashboard air-landing min-h-screen bg-white text-slate-900">
      <JsonLd data={softwareApplicationJsonLd()} />
      <MarketingHeader />
      <main className="scroll-smooth bg-white">{children}</main>
      <MarketingFooter />
      <StickyCta />
    </div>
  );
}
