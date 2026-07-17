import { NextResponse } from "next/server";
import { getSupabaseErrorFields } from "@/lib/auth/errors";
import { createAnonClient } from "@/lib/supabase";
import { createServiceRoleSupabaseClient } from "@/lib/supabase-admin";
import {
  lookupRestaurantTransferByToken,
  lookupRestaurantTransferPreview,
} from "@/lib/restaurant-transfer";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim();

  if (!token) {
    return NextResponse.json({ error: "Missing transfer token." }, { status: 400 });
  }

  const lookupMethod = createServiceRoleSupabaseClient()
    ? "service_role_direct"
    : "anon_rpc";

  try {
    const serviceRoleClient = createServiceRoleSupabaseClient();
    const preview = serviceRoleClient
      ? await lookupRestaurantTransferByToken(serviceRoleClient, token)
      : await lookupRestaurantTransferPreview(createAnonClient(), token);

    if (!preview) {
      console.warn("[transfer:lookup] No transfer found for token.", { tokenLength: token.length });
      return NextResponse.json({
        valid: false,
        expired: true,
        restaurantName: null,
        recipientEmail: null,
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
      lookupMethod,
      ...details,
      error,
    });

    return NextResponse.json(
      { error: details.message || "Unable to look up transfer." },
      { status: 500 }
    );
  }
}
