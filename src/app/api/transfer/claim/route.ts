import { NextResponse } from "next/server";
import { z } from "zod";
import {
  claimRestaurantTransfer,
  transferClaimErrorMessage,
} from "@/lib/restaurant-transfer";
import { createAuthenticatedSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  token: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const supabase = await createAuthenticatedSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Please sign in to accept this transfer." }, { status: 401 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Missing transfer token." }, { status: 400 });
    }

    const restaurantId = await claimRestaurantTransfer(supabase, parsed.data.token);

    return NextResponse.json({
      success: true,
      restaurantId,
    });
  } catch (error) {
    console.error("[transfer:claim]", error);
    return NextResponse.json(
      { error: transferClaimErrorMessage(error) },
      { status: 400 }
    );
  }
}
