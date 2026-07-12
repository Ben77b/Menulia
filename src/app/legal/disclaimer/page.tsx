import type { Metadata } from "next";
import { LegalDocumentLayout, LegalSection } from "@/components/marketing/legal-document-layout";
import { DISCLAIMER_COPY } from "@/lib/legal/disclaimer-copy";
import { resolveLegalLocale } from "@/lib/legal/locale";
import { marketingPageMetadata } from "@/lib/marketing/seo";

const LAST_UPDATED = "July 12, 2026";

type DisclaimerPageProps = {
  searchParams: Promise<{ lang?: string }>;
};

export async function generateMetadata({ searchParams }: DisclaimerPageProps): Promise<Metadata> {
  const { lang } = await searchParams;
  const locale = await resolveLegalLocale(lang);
  const copy = DISCLAIMER_COPY[locale];

  return marketingPageMetadata({
    title: copy.metaTitle,
    description: copy.metaDescription,
    path: "/legal/disclaimer",
  });
}

export default async function AllergenDisclaimerPage({ searchParams }: DisclaimerPageProps) {
  const { lang } = await searchParams;
  const locale = await resolveLegalLocale(lang);
  const copy = DISCLAIMER_COPY[locale];

  return (
    <LegalDocumentLayout title={copy.title} lastUpdated={LAST_UPDATED}>
      <p className="text-[15px] leading-7 text-slate-600">{copy.intro}</p>

      {copy.sections.map((section, index) => (
        <LegalSection key={section.title} number={index + 1} title={section.title}>
          {section.paragraphs.map((paragraph) => {
            const parts = paragraph.split(copy.contactLabel);
            if (parts.length === 1) {
              return <p key={paragraph.slice(0, 48)}>{paragraph}</p>;
            }

            return (
              <p key={paragraph.slice(0, 48)}>
                {parts[0]}
                <a href={`mailto:${copy.contactLabel}`} className="air-link">
                  {copy.contactLabel}
                </a>
                {parts[1]}
              </p>
            );
          })}
          {section.bullets ? (
            <ul className="list-disc space-y-2 pl-5">
              {section.bullets.map((bullet) => (
                <li key={bullet.slice(0, 48)}>{bullet}</li>
              ))}
            </ul>
          ) : null}
        </LegalSection>
      ))}
    </LegalDocumentLayout>
  );
}
