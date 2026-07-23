export function JsonLd({ data }: { data: Record<string, unknown> }) {
  let payload = "";
  try {
    // Escape `<` so dish/logo strings cannot break out of the script tag.
    payload = JSON.stringify(data)?.replace(/</g, "\\u003c") ?? "";
  } catch (error) {
    console.error("[JsonLd.stringify]", error);
    return null;
  }

  if (!payload) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: payload }}
    />
  );
}
