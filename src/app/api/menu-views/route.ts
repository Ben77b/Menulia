import { NextResponse } from "next/server";
import { z } from "zod";
import { recordMenuViewAnon, type MenuViewDeviceType } from "@/lib/menu-views";
import { logSupabaseAuditError } from "@/lib/supabase-safe";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  restaurant_id: z.string().uuid(),
  language: z.string().min(1).max(16).optional(),
  device_type: z.enum(["mobile", "tablet", "desktop", "unknown"]).optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const deviceType = (parsed.data.device_type ?? "unknown") as MenuViewDeviceType;
    await recordMenuViewAnon({
      restaurantId: parsed.data.restaurant_id,
      language: parsed.data.language,
      deviceType,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logSupabaseAuditError("api.menu-views", error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
