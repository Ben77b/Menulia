interface CategorySectionHeaderProps {
  name: string;
  note?: string | null;
  titleFont: string;
  bodyFont: string;
  titleFontWeight?: number;
  titleFontStyle?: "normal" | "italic";
  bodyFontWeight?: number;
  bodyFontStyle?: "normal" | "italic";
  titleColor: string;
  noteColor: string;
}

export function CategorySectionHeader({
  name,
  note,
  titleFont,
  bodyFont,
  titleFontWeight,
  titleFontStyle,
  bodyFontWeight,
  bodyFontStyle,
  titleColor,
  noteColor,
}: CategorySectionHeaderProps) {
  const trimmedNote = note?.trim();

  return (
    <header className="mb-8 text-center">
      <h2
        className="text-lg font-semibold uppercase tracking-[0.18em] sm:text-xl"
        style={{
          fontFamily: titleFont,
          fontWeight: titleFontWeight ?? 400,
          fontStyle: titleFontStyle ?? "normal",
          color: titleColor,
        }}
      >
        {name}
      </h2>
      {trimmedNote ? (
        <p
          className="mx-auto mt-2 max-w-xl text-sm italic leading-relaxed opacity-75"
          style={{
            fontFamily: bodyFont,
            fontWeight: bodyFontWeight ?? 400,
            fontStyle: bodyFontStyle ?? "italic",
            color: noteColor,
          }}
        >
          {trimmedNote}
        </p>
      ) : null}
    </header>
  );
}
