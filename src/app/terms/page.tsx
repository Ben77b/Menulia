import { LegalDocumentLayout, LegalSection } from "@/components/marketing/legal-document-layout";
import { marketingPageMetadata } from "@/lib/marketing/seo";

export const metadata = marketingPageMetadata({
  title: "Terms of Service",
  description:
    "Terms governing your use of the menulia.net digital menu platform, including accounts, content, billing, and liability.",
  path: "/terms",
});

const LAST_UPDATED = "June 27, 2025";

export default function TermsOfServicePage() {
  return (
    <LegalDocumentLayout title="Terms of Service" lastUpdated={LAST_UPDATED}>
      <p className="text-[15px] leading-7 text-slate-600">
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of menulia.net
        (&ldquo;Menulia,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By
        creating an account or using the platform, you agree to these Terms. If you do not agree,
        please do not use the service.
      </p>

      <LegalSection number={1} title="Account Responsibilities">
        <p>
          You are responsible for maintaining the confidentiality of your login credentials and for
          all activity that occurs under your account. You agree to provide accurate registration
          information and to keep it up to date.
        </p>
        <p>
          You must promptly notify us of any unauthorized access or security breach related to your
          account. We reserve the right to suspend or restrict accounts that appear compromised or
          used in violation of these Terms.
        </p>
      </LegalSection>

      <LegalSection number={2} title="Acceptable Content Use">
        <p>
          You may upload and publish menu content, branding, and restaurant information that you own
          or have the right to use. You agree not to upload content that:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Infringes copyright, trademark, or other intellectual property rights of third parties.</li>
          <li>Contains menus, images, or materials copied without authorization from other businesses.</li>
          <li>Is unlawful, misleading, defamatory, or harmful to guests or other users.</li>
          <li>Contains malware, spam, or attempts to disrupt the platform.</li>
        </ul>
        <p>
          You retain ownership of your content. By publishing through Menulia, you grant us a limited
          license to host, display, and distribute your content solely to operate and improve the
          service.
        </p>
      </LegalSection>

      <LegalSection number={3} title="Termination of Service">
        <p>
          You may cancel your account at any time through the dashboard or by contacting support.
          We may suspend or terminate access if you breach these Terms, fail to pay applicable fees,
          or if continued provision of the service becomes impractical for legal or operational
          reasons.
        </p>
        <p>
          Upon termination, your right to use the platform ceases. We may retain certain data as
          required by law or for legitimate business purposes, consistent with our Privacy Policy.
        </p>
      </LegalSection>

      <LegalSection number={4} title="Liability Limitations">
        <p>
          Menulia is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. To the
          fullest extent permitted by law, we disclaim all warranties, express or implied, including
          fitness for a particular purpose and non-infringement.
        </p>
        <p>
          We are not liable for indirect, incidental, special, consequential, or punitive damages,
          or for any loss of profits, revenue, data, or goodwill arising from your use of the
          service. Our total liability for any claim related to the service is limited to the amount
          you paid us in the twelve (12) months preceding the claim, or €100, whichever is greater.
        </p>
      </LegalSection>

      <LegalSection number={5} title="Billing Policies">
        <p>
          Free plans are offered at no charge subject to feature limits described on our website.
          Premium subscriptions are billed monthly (or as otherwise stated at checkout) and renew
          automatically until canceled.
        </p>
        <p>
          Fees are non-refundable except where required by applicable law. You may upgrade, downgrade,
          or cancel through your account settings; changes take effect according to the billing cycle
          shown at the time of purchase. We may change pricing with reasonable notice before it applies
          to your next renewal.
        </p>
      </LegalSection>

      <LegalSection number={6} title="General & Contact">
        <p>
          These Terms constitute the entire agreement between you and Menulia regarding the service.
          If any provision is found unenforceable, the remaining provisions remain in effect. We may
          update these Terms from time to time; continued use after changes constitutes acceptance.
        </p>
        <p>
          Questions about these Terms? Contact us at{" "}
          <a href="mailto:legal@menulia.net" className="air-link">
            legal@menulia.net
          </a>
          .
        </p>
      </LegalSection>
    </LegalDocumentLayout>
  );
}
