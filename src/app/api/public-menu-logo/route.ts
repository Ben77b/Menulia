import { NextResponse } from "next/server";
import { getPublicRestaurantRow } from "@/lib/public-menu-cache";
import { logSupabaseAuditError } from "@/lib/supabase-safe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
};

function parseDataUrl(dataUrl: string): { contentType: string; body: Buffer } | null {
  try {
    const trimmed = dataUrl.trim();
    if (!trimmed.startsWith("data:")) return null;

    const comma = trimmed.indexOf(",");
    if (comma < 0) return null;

    const meta = trimmed.slice(5, comma); // after "data:"
    const payload = trimmed.slice(comma + 1);
    const parts = meta.split(";").filter(Boolean);
    const contentType = parts[0] && parts[0].includes("/") ? parts[0] : "application/octet-stream";
    const isBase64 = parts.some((part) => part.toLowerCase() === "base64");

    if (isBase64) {
      return { contentType, body: Buffer.from(payload, "base64") };
    }

    return {
      contentType,
      body: Buffer.from(decodeURIComponent(payload), "utf8"),
    };
  } catch {
    return null;
  }
}

/**
 * Serves the restaurant logo without embedding Base64 into the menu RSC payload.
 * GET /api/public-menu-logo?slug=restaurant-slug
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = (searchParams.get("slug") ?? "").trim();
    if (!slug || slug.length > 120) {
      return new NextResponse(null, { status: 400 });
    }

    const row = await getPublicRestaurantRow(slug);
    const logo = typeof row?.logo === "string" ? row.logo.trim() : "";
    if (!logo) {
      return new NextResponse(null, { status: 404 });
    }

    if (logo.startsWith("https://") || logo.startsWith("http://")) {
      return NextResponse.redirect(logo, {
        status: 307,
        headers: CACHE_HEADERS,
      });
    }

    if (logo.startsWith("data:")) {
      const parsed = parseDataUrl(logo);
      if (!parsed || parsed.body.length === 0) {
        return new NextResponse(null, { status: 404 });
      }

      return new NextResponse(new Uint8Array(parsed.body), {
        status: 200,
        headers: {
          ...CACHE_HEADERS,
          "Content-Type": parsed.contentType,
          "Content-Length": String(parsed.body.length),
        },
      });
    }

    if (logo.startsWith("/")) {
      return NextResponse.redirect(new URL(logo, request.url), {
        status: 307,
        headers: CACHE_HEADERS,
      });
    }

    return new NextResponse(null, { status: 404 });
  } catch (error) {
    logSupabaseAuditError("api.public-menu-logo", error);
    return new NextResponse(null, { status: 500 });
  }
}
