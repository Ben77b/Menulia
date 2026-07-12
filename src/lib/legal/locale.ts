import { cookies, headers } from "next/headers";

export type LegalLocale = "en" | "es";

function prefersSpanish(acceptLanguage: string): boolean {
  const primary = acceptLanguage.split(",")[0]?.split(";")[0]?.trim().toLowerCase() ?? "";
  return primary === "es" || primary.startsWith("es-");
}

/** Resolve legal page locale from query param, session cookie, or Accept-Language. */
export async function resolveLegalLocale(langParam?: string): Promise<LegalLocale> {
  if (langParam === "es" || langParam === "en") {
    return langParam;
  }

  const cookieStore = await cookies();
  const stored = cookieStore.get("menulia_locale")?.value;
  if (stored === "es" || stored === "en") {
    return stored;
  }

  const headerStore = await headers();
  if (prefersSpanish(headerStore.get("accept-language") ?? "")) {
    return "es";
  }

  return "en";
}
