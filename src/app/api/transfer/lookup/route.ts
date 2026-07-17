import { NextResponse } from "next/server";
import { getSupabaseErrorFields } from "@/lib/auth/errors";
import {
  lookupRestaurantTransferByToken,
} from "@/lib/restaurant-transfer";
import {
  createServiceRoleSupabaseClient,
  isServiceRoleConfigured,
} from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const SERVICE_ROLE_MISSING_MESSAGE =
  "Transfer lookup is not configured on the server. Set SUPABASE_SERVICE_ROLE_KEY in the deployment environment.";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim();

  if (!token) {
    return NextResponse.json({ error: "Missing transfer token." }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing from environment variables.");
    return NextResponse.json({ error: SERVICE_ROLE_MISSING_MESSAGE }, { status: 503 });
  }

  if (!isServiceRoleConfigured()) {
    console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing from environment variables.");
    return NextResponse.json(
      { error: "Transfer lookup is misconfigured. NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required." },
      { status: 503 }
    );
  }

  const serviceRoleClient = createServiceRoleSupabaseClient();
  if (!serviceRoleClient) {
    console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing from environment variables.");
    return NextResponse.json({ error: SERVICE_ROLE_MISSING_MESSAGE }, { status: 503 });
  }

  try {
    const preview = await lookupRestaurantTransferByToken(serviceRoleClient, token);

    if (!preview) {
      console.warn("[transfer:lookup] No transfer found for token.", { tokenLength: token.length });
      return NextResponse.json({
        valid: false,
        expired: true,
        restaurantName: null,
        recipientEmail: null,
        error: "No transfer record matches this token.",
      });
    }

    return NextResponse.json({
      valid: preview.isValid,
      expired: !preview.isValid,
      restaurantName: preview.restaurantName,
      recipientEmail: preview.recipientEmail,
      expiresAt: preview.expiresAt,
    });
  } catch (error) {
    const details = getSupabaseErrorFields(error);

    console.error("[transfer:lookup]", {
      tokenLength: token.length,
      lookupMethod: "service_role_direct",
      ...details,
      error,
    });

    return NextResponse.json(
      { error: details.message || "Unable to look up transfer." },
      { status: 500 }
    );
  }
}
