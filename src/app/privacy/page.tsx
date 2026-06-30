import { LegalDocumentLayout, LegalSection } from "@/components/marketing/legal-document-layout";
import { marketingPageMetadata } from "@/lib/marketing/seo";

export const metadata = marketingPageMetadata({
  title: "Privacy Policy",
  description:
    "How menulia.net collects, secures, and processes your account and restaurant menu data.",
  path: "/privacy",
});

const LAST_UPDATED = "June 27, 2025";

export default function PrivacyPolicyPage() {
  return (
    <LegalDocumentLayout title="Privacy Policy" lastUpdated={LAST_UPDATED}>
      <p className="text-[15px] leading-7 text-slate-600">
        menulia.net (&ldquo;Menulia,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) provides a
        software-as-a-service platform for restaurants to create and publish digital menus. This
        Privacy Policy explains what information we collect, how we use it, and the choices you have.
      </p>

      <LegalSection number={1} title="Data We Collect">
        <p>
          We collect information you provide when you create an account, manage a restaurant, or
          contact us for support. This may include:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="font-semibold text-slate-800">Account information</strong> — your
            email address, display name, and authentication credentials managed through our identity
            provider.
          </li>
          <li>
            <strong className="font-semibold text-slate-800">Restaurant and menu data</strong> —
            restaurant names, branding, menu categories, dish names, descriptions, prices, images,
            dietary tags, allergens, hours, contact details, and related content you upload or
            configure in the dashboard.
          </li>
          <li>
            <strong className="font-semibold text-slate-800">Usage data</strong> — basic logs such as
            page views, feature interactions, device type, and browser information to keep the
            service reliable and secure.
          </li>
        </ul>
      </LegalSection>

      <LegalSection number={2} title="How We Secure Your Data">
        <p>
          We store application data in Supabase secure cloud infrastructure with encryption in
          transit (TLS) and at rest. Access to production systems is restricted to authorized
          personnel, protected by role-based controls and industry-standard authentication practices.
        </p>
        <p>
          While we implement reasonable safeguards, no method of transmission or storage is
          completely secure. We encourage you to use a strong, unique password and enable any
          additional security features we offer for your account.
        </p>
      </LegalSection>

      <LegalSection number={3} title="Cookies">
        <p>
          We use essential cookies and similar technologies to keep you signed in, remember
          preferences, and maintain session security. We may also use analytics cookies to understand
          how the platform is used and to improve performance.
        </p>
        <p>
          You can control non-essential cookies through your browser settings. Disabling certain
          cookies may limit some features of the service.
        </p>
      </LegalSection>

      <LegalSection number={4} title="Third-Party Processing">
        <p>
          We rely on trusted third-party providers to operate menulia.net. These may include:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="font-semibold text-slate-800">Supabase</strong> — authentication,
            database, and file storage.
          </li>
          <li>
            <strong className="font-semibold text-slate-800">Analytics providers</strong> — to
            measure product usage and diagnose issues (aggregated where possible).
          </li>
          <li>
            <strong className="font-semibold text-slate-800">Payment processors</strong> — to handle
            subscription billing for Premium plans. We do not store full payment card numbers on our
            servers.
          </li>
        </ul>
        <p>
          Each provider processes data according to its own privacy policy and only to the extent
          necessary to deliver the service on our behalf.
        </p>
      </LegalSection>

      <LegalSection number={5} title="Your Rights & Contact">
        <p>
          Depending on your location, you may have rights to access, correct, export, or delete your
          personal data. To exercise these rights or ask questions about this policy, contact us at{" "}
          <a href="mailto:privacy@menulia.net" className="air-link">
            privacy@menulia.net
          </a>
          .
        </p>
        <p>
          We may update this Privacy Policy from time to time. Material changes will be reflected
          on this page with a revised &ldquo;Last updated&rdquo; date.
        </p>
      </LegalSection>
    </LegalDocumentLayout>
  );
}
