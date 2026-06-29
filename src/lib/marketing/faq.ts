export type FaqItem = {
  question: string;
  answer: string;
};

export const LANDING_FAQ_ITEMS: FaqItem[] = [
  {
    question: "Why are PDFs bad for my restaurant mobile sales?",
    answer:
      "PDF menus force guests to pinch, zoom, and scroll through static pages on small screens — friction that kills impulse orders and specials visibility. A mobile-native digital menu loads instantly via QR, adapts to any phone, and keeps pricing and photos readable without downloads.",
  },
  {
    question: "Do customers need to download an app?",
    answer:
      "No. Menulia menus open in the mobile browser from a QR code or link. Guests scan, browse, and order context without installing anything — the same zero-friction experience they expect from premium hospitality brands.",
  },
  {
    question: "How fast can I update my pricing?",
    answer:
      "Price changes publish in seconds from the dashboard. Edit a dish, save, and every live menu link and QR destination reflects the update immediately — no re-exporting PDFs or reprinting table tents.",
  },
  {
    question: "Can I match my restaurant's brand and typography?",
    answer:
      "Yes. The Design Studio lets you tune fonts, spacing, colors, and layout accents with live mobile preview so your digital menu feels as considered as your dining room.",
  },
  {
    question: "Does Menulia work for multi-language guests?",
    answer:
      "Menulia supports 28+ languages out of the box, helping neighborhood bistros, pizzerias, and cafés serve tourists and locals with the same polished experience.",
  },
];
