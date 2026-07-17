import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { RestaurantTransferRecord } from "@/lib/restaurant-transfer";
import { getSupabaseErrorFields } from "@/lib/auth/errors";
import { createAuthenticatedSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const TRANSFER_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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

    const generatedToken = randomUUID();
    const expiresAt = new Date(Date.now() + TRANSFER_TTL_MS).toISOString();

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
        ...getSupabaseErrorFields(error),
      });
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const row = (Array.isArray(data) ? data[0] : data) as RestaurantTransferRecord | null;
    if (!row) {
      return NextResponse.json({ error: "RPC returned no transfer record." }, { status: 400 });
    }

    return NextResponse.json({ transfer: row });
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
