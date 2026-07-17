import { NextResponse } from "next/server";
import { z } from "zod";
import {
  initiateRestaurantTransfer,
  transferInitiateErrorMessage,
} from "@/lib/restaurant-transfer";
import { createAuthenticatedSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  restaurantId: z.string().uuid(),
  recipientEmail: z.string().email(),
});

export async function POST(request: Request) {
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
      return NextResponse.json({ error: "Enter a valid email address for the new owner." }, { status: 400 });
    }

    const transfer = await initiateRestaurantTransfer(
      supabase,
      parsed.data.restaurantId,
      parsed.data.recipientEmail
    );

    return NextResponse.json({ transfer });
  } catch (error) {
    console.error("[transfer:initiate]", error);
    return NextResponse.json(
      { error: transferInitiateErrorMessage(error) },
      { status: 400 }
    );
  }
}
