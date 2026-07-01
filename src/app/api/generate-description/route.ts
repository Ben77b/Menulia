import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";
import { runtimeEnv } from "@/lib/runtime-env";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  dishName: z.string().min(1).max(200),
  categoryName: z.string().max(120).optional(),
  restaurantName: z.string().max(200).optional(),
});

const SYSTEM_PROMPT =
  "You are an elite restaurant menu writer. Write concise, 1-2 sentence sensory dish descriptions optimized for local SEO. Do not use fluff words, emojis, or exclamation points. Keep it grounded, appetizing, and natural. Reply with only the description text, nothing else.";

function buildUserPrompt(
  dishName: string,
  categoryName?: string,
  restaurantName?: string
): string {
  const parts = [`Dish name: ${dishName}`];
  if (categoryName?.trim()) parts.push(`Menu category: ${categoryName.trim()}`);
  if (restaurantName?.trim()) parts.push(`Restaurant: ${restaurantName.trim()}`);
  return parts.join("\n");
}

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

export async function POST(request: Request) {
  try {
    const supabase = await createAuthenticatedSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in to use AI descriptions." }, { status: 401 });
    }

    const apiKey = runtimeEnv("OPENAI_API_KEY");
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI descriptions are not configured. Add OPENAI_API_KEY to your environment." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Enter a dish name before generating a description." },
        { status: 400 }
      );
    }

    const { dishName, categoryName, restaurantName } = parsed.data;

    const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        max_tokens: 120,
        messages: [
          { role: "system", content: `${SYSTEM_PROMPT} Use the dish name: ${dishName}.` },
          {
            role: "user",
            content: buildUserPrompt(dishName, categoryName, restaurantName),
          },
        ],
      }),
    });

    if (!openAiResponse.ok) {
      console.error("[generate-description] OpenAI error", await openAiResponse.text());
      return NextResponse.json(
        { error: "Could not generate a description. Try again in a moment." },
        { status: 502 }
      );
    }

    const completion = (await openAiResponse.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };

    const description = completion.choices?.[0]?.message?.content?.trim();

    if (!description) {
      return NextResponse.json(
        { error: "No description was returned. Try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ description });
  } catch (error) {
    console.error("[generate-description]", error);
    return NextResponse.json(
      { error: "Could not generate a description. Try again." },
      { status: 500 }
    );
  }
}
