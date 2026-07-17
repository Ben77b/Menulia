import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildTransferExpiresAtIso,
  normalizeRestaurantTransferRecord,
  parseTransferTimestamp,
} from "@/lib/restaurant-transfer";
import { getSupabaseErrorFields } from "@/lib/auth/errors";
import { createAuthenticatedSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  restaurantId: z.string().uuid(),
  recipientEmail: z.string().email(),
});

export async function POST(request: Request) {
  let restaurantId: string | undefined;
  let recipientEmail: string | undefined;

  try {
    const supabase = await createAuthenticatedSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "You must be signed in to initiate a transfer." }, { status: 401 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    restaurantId = parsed.data.restaurantId;
    recipientEmail = parsed.data.recipientEmail.trim().toLowerCase();

    const generatedToken = randomUUID().trim();
    const expiresAt = buildTransferExpiresAtIso();

    if (!generatedToken || !parseTransferTimestamp(expiresAt)) {
      return NextResponse.json({ error: "Failed to compute a valid transfer expiration." }, { status: 500 });
    }

    const { data, error } = await supabase.rpc("initiate_restaurant_transfer", {
      p_restaurant_id: restaurantId,
      p_recipient_email: recipientEmail,
      p_token: generatedToken,
      p_expires_at: expiresAt,
    });

    if (error) {
      console.error("[transfer:initiate]", {
        rpc: "initiate_restaurant_transfer",
        restaurantId,
        recipientEmail,
        expiresAt,
        ...getSupabaseErrorFields(error),
      });
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const rawRow = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null;
    if (!rawRow) {
      return NextResponse.json({ error: "RPC returned no transfer record." }, { status: 400 });
    }

    const transfer = normalizeRestaurantTransferRecord(rawRow);
    if (!parseTransferTimestamp(transfer.expires_at)) {
      return NextResponse.json({ error: "Transfer saved with an invalid expiration timestamp." }, { status: 500 });
    }

    return NextResponse.json({ transfer });
  } catch (error) {
    const { message } = getSupabaseErrorFields(error);

    console.error("[transfer:initiate]", {
      rpc: "initiate_restaurant_transfer",
      restaurantId,
      recipientEmail,
      message,
      error,
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : message },
      { status: 500 }
    );
  }
}
