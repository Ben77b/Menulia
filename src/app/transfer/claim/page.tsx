import { Suspense } from "react";
import { PublicLandingShell } from "@/components/marketing/public-landing-shell";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ClaimTransferClient } from "@/app/transfer/claim/claim-transfer-client";

export const dynamic = "force-dynamic";

type ClaimTransferPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ClaimTransferPage({ searchParams }: ClaimTransferPageProps) {
  const resolvedParams = await searchParams;
  const initialToken = resolvedParams.token?.trim() ?? "";

  return (
    <PublicLandingShell>
      <Suspense fallback={<LoadingSpinner label="Loading transfer invitation…" />}>
        <ClaimTransferClient initialToken={initialToken} />
      </Suspense>
    </PublicLandingShell>
  );
}
