export type AppLocale = "en" | "es";

/** Parse Accept-Language and pick Spanish only when preferred over English. */
export function resolvePreferredLocale(acceptLanguage: string): AppLocale {
  const languages = acceptLanguage
    .split(",")
    .map((part) => {
      const [langPart, ...params] = part.trim().split(";");
      const qParam = params.find((param) => param.trim().startsWith("q="));
      const q = qParam ? Number.parseFloat(qParam.split("=")[1]) : 1;
      return {
        lang: langPart.trim().toLowerCase(),
        q: Number.isFinite(q) ? q : 0,
      };
    })
    .sort((a, b) => b.q - a.q);

  for (const { lang } of languages) {
    if (lang === "es" || lang.startsWith("es-")) return "es";
    if (lang === "en" || lang.startsWith("en-")) return "en";
  }

  return "en";
}

export function prefersSpanish(acceptLanguage: string): boolean {
  return resolvePreferredLocale(acceptLanguage) === "es";
}
