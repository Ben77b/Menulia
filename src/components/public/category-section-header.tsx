import { resolveLocalizedText, type LocalizedTextValue } from "@/lib/localized-text";

interface CategorySectionHeaderProps {
  note?: LocalizedTextValue;
  lang?: string;
  fallbackLang?: string;
  bodyFont: string;
  bodyFontWeight?: number;
  bodyFontStyle?: "normal" | "italic";
  noteColor: string;
}

export function CategorySectionHeader({
  note,
  lang = "en",
  fallbackLang = "en",
  bodyFont,
  bodyFontWeight,
  bodyFontStyle,
  noteColor,
}: CategorySectionHeaderProps) {
  const trimmedNote = resolveLocalizedText(note, lang, fallbackLang).trim();
  if (!trimmedNote) return null;

  return (
    <header className="mb-8 text-center">
      <p
        className="mx-auto max-w-xl text-sm italic leading-relaxed opacity-75"
        style={{
          fontFamily: bodyFont,
          fontWeight: bodyFontWeight ?? 400,
          fontStyle: bodyFontStyle ?? "italic",
          color: noteColor,
        }}
      >
        {trimmedNote}
      </p>
    </header>
  );
}
