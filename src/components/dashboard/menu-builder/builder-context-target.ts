import type { MenuBuilderCategory, MenuBuilderDish, MenuBuilderSection } from "@/lib/menu-builder-types";

export type BuilderContextTarget =
  | {
      kind: "dish";
      dish: MenuBuilderDish;
      categoryId: string;
      title: string;
    }
  | {
      kind: "category";
      category: MenuBuilderCategory;
      categoryId: string;
      title: string;
    }
  | {
      kind: "section";
      section: MenuBuilderSection;
      sectionId: string;
      title: string;
    };
