import { NextResponse } from "next/server";
import { createAnonClient } from "@/lib/supabase";
import { lookupRestaurantTransferPreview } from "@/lib/restaurant-transfer";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token")?.trim();

    if (!token) {
      return NextResponse.json({ error: "Missing transfer token." }, { status: 400 });
    }

    const supabase = createAnonClient();
    const preview = await lookupRestaurantTransferPreview(supabase, token);

    if (!preview) {
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
    console.error("[transfer:lookup]", error);
    return NextResponse.json({ error: "Unable to look up transfer." }, { status: 500 });
  }
}
