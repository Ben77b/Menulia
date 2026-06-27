import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const admin = createServiceRoleClient();
    const { data, error } = await admin.rpc("ensure_restaurants_schema");

    if (error) {
      console.error("[api:ensure-restaurants-schema]", error);
      return NextResponse.json(
        {
          error:
            "Database schema initialization failed. Ensure the ensure_restaurants_schema migration has been applied in Supabase.",
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      result: data,
      userId: user.id,
    });
  } catch (error) {
    console.error("[api:ensure-restaurants-schema:unexpected]", error);
    const message = error instanceof Error ? error.message : "Unexpected schema initialization error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
