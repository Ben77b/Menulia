export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  dateLabel: string;
  tag: string;
  readTime: string;
  author: string;
  sections: { heading?: string; paragraphs: string[] }[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "why-digital-menus-matter",
    title: "Why Digital Menus Matter in 2026",
    excerpt:
      "Paper menus are costing you guests. Here's how interactive displays drive engagement and higher check averages.",
    date: "2026-05-28",
    dateLabel: "May 28, 2026",
    tag: "Growth",
    readTime: "6 min read",
    author: "Menulia Team",
    sections: [
      {
        paragraphs: [
          "Guests decide within seconds whether your restaurant feels modern, trustworthy, and worth their time. A blurry PDF on a phone screen signals the opposite — outdated, hard to read, and easy to abandon.",
          "Interactive digital menus flip that first impression. Large typography, swipeable dish photos, and instant language switching keep guests browsing instead of bouncing.",
        ],
      },
      {
        heading: "The revenue case for going digital",
        paragraphs: [
          "Restaurants that replace static PDFs with structured menu experiences see longer session times and stronger item discovery. When guests can filter dietary preferences and explore categories visually, they order more confidently.",
          "Menulia's live preview lets you test layout and copy before publishing — so every menu update ships with main-character energy, not guesswork.",
        ],
      },
    ],
  },
  {
    slug: "multi-language-restaurants",
    title: "Serving Tourists: A Multi-Language Guide",
    excerpt:
      "How to configure 28-language menus that auto-detect your guest's preferred language.",
    date: "2026-05-15",
    dateLabel: "May 15, 2026",
    tag: "Product",
    readTime: "5 min read",
    author: "Menulia Team",
    sections: [
      {
        paragraphs: [
          "Tourism-heavy neighborhoods punish restaurants that force guests to decode menus in a second language. Auto-detected locale switching removes friction the moment someone lands on your page.",
        ],
      },
      {
        heading: "Best practices",
        paragraphs: [
          "Keep dish names descriptive in the default language, then verify translations for your top sellers. Pair multilingual copy with strong photography so meaning is clear even before text loads.",
          "Use Menulia's Design Studio to align category accents and typography across every locale — one brand system, every market.",
        ],
      },
    ],
  },
  {
    slug: "reservation-best-practices",
    title: "Reservation Best Practices for Small Restaurants",
    excerpt: "Reduce no-shows and fill tables with smart booking workflows.",
    date: "2026-04-30",
    dateLabel: "Apr 30, 2026",
    tag: "Operations",
    readTime: "4 min read",
    author: "Menulia Team",
    sections: [
      {
        paragraphs: [
          "Phone-tag reservations leak revenue. A single booking link on your menu captures intent while guests are already excited about your food.",
          "Tie reservation slots to your real operating hours so staff never manually rejects impossible bookings.",
        ],
      },
    ],
  },
  {
    slug: "design-your-menu-page",
    title: "Design a Menu Page Guests Actually Use",
    excerpt:
      "Carousels, dietary icons, and full-screen layouts that convert browsers into diners.",
    date: "2026-04-12",
    dateLabel: "Apr 12, 2026",
    tag: "Design",
    readTime: "7 min read",
    author: "Menulia Team",
    sections: [
      {
        paragraphs: [
          "Great menu design is not decoration — it's navigation. Guests should understand categories, spot signatures, and reach a decision without zooming or scrolling through walls of text.",
        ],
      },
      {
        heading: "Three layers that work",
        paragraphs: [
          "Structure: sections and categories that mirror how your kitchen thinks.",
          "Story: descriptions and photos that sell the experience, not just ingredients.",
          "Motion: subtle carousels and highlights that draw eyes to high-margin items.",
          "Menulia's 3-Tier Menu Builder, Design Studio, and mobile live preview keep all three layers in sync before you publish.",
        ],
      },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function getAllBlogSlugs(): string[] {
  return BLOG_POSTS.map((post) => post.slug);
}
