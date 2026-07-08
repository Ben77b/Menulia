import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";
import { runtimeEnv } from "@/lib/runtime-env";

export const dynamic = "force-dynamic";

const DEEPL_BATCH_SIZE = 50;

const requestSchema = z.object({
  texts: z.array(z.string()).min(1).max(500),
  source_lang: z.string().optional(),
  target_lang: z.string().min(2).max(5),
  tag_handling: z.enum(["html", "xml"]).optional(),
});

async function createAuthenticatedSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

function getDeepLEndpoint(apiKey: string): string {
  return apiKey.endsWith(":fx")
    ? "https://api-free.deepl.com/v2/translate"
    : "https://api.deepl.com/v2/translate";
}

async function translateBatch(
  apiKey: string,
  texts: string[],
  sourceLang: string | undefined,
  targetLang: string,
  tagHandling?: "html" | "xml"
): Promise<Array<{ text: string; detectedSourceLanguage?: string }>> {
  const endpoint = getDeepLEndpoint(apiKey);
  const body = new URLSearchParams();
  texts.forEach((text) => body.append("text", text));
  body.set("target_lang", targetLang.toUpperCase());
  body.set("preserve_formatting", "1");

  const normalizedSource = sourceLang?.trim().toLowerCase();
  if (normalizedSource && normalizedSource !== "auto") {
    body.set("source_lang", normalizedSource.toUpperCase());
  }

  if (tagHandling) {
    body.set("tag_handling", tagHandling);
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const details = await response.text();
    console.error("[translate] DeepL error", response.status, details);
    throw new Error("DeepL translation failed");
  }

  const payload = (await response.json()) as {
    translations?: Array<{ text?: string; detected_source_language?: string }>;
  };

  const translations = payload.translations ?? [];
  if (translations.length !== texts.length) {
    throw new Error("DeepL returned an unexpected number of translations");
  }

  return translations.map((entry, index) => ({
    text: entry.text ?? texts[index] ?? "",
    detectedSourceLanguage: entry.detected_source_language,
  }));
}

export async function POST(request: Request) {
  try {
    const supabase = await createAuthenticatedSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in to translate your menu." }, { status: 401 });
    }

    const apiKey = runtimeEnv("DEEPL_API_KEY");
    if (!apiKey) {
      return NextResponse.json(
        { error: "Translation is not configured. Add DEEPL_API_KEY to your environment." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid translation request." }, { status: 400 });
    }

    const { texts, source_lang, target_lang, tag_handling } = parsed.data;
    const translations: string[] = [];
    const detectedSourceLanguages: string[] = [];

    for (let index = 0; index < texts.length; index += DEEPL_BATCH_SIZE) {
      const chunk = texts.slice(index, index + DEEPL_BATCH_SIZE);
      const chunkTranslations = await translateBatch(
        apiKey,
        chunk,
        source_lang,
        target_lang,
        tag_handling
      );
      translations.push(...chunkTranslations.map((entry) => entry.text));
      detectedSourceLanguages.push(
        ...chunkTranslations.map((entry) => entry.detectedSourceLanguage ?? "")
      );
    }

    return NextResponse.json({ translations, detected_source_languages: detectedSourceLanguages });
  } catch (error) {
    console.error("[translate]", error);
    return NextResponse.json(
      { error: "Could not translate text. Try again in a moment." },
      { status: 500 }
    );
  }
}
