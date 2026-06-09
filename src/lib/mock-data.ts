import type {
  Restaurant,
  CustomRestaurantLink,
  OperatingHour,
  MenuCategory,
  MenuItem,
  MenuTranslation,
  Reservation,
  PageView,
  BusinessExpense,
  RestaurantFull,
} from "./types";

// Fixed UUIDs for deterministic sandbox testing
const U = {
  user1: "11111111-1111-1111-1111-111111111111",
  user2: "22222222-2222-2222-2222-222222222222",
  user3: "33333333-3333-3333-3333-333333333333",
  user4: "44444444-4444-4444-4444-444444444444",
  taco: "a0000001-0000-0000-0000-000000000001",
  sushi: "a0000002-0000-0000-0000-000000000002",
  trattoria: "a0000003-0000-0000-0000-000000000003",
  burger: "a0000004-0000-0000-0000-000000000004",
} as const;

const defaultHours = (restaurantId: string): OperatingHour[] =>
  [0, 1, 2, 3, 4, 5, 6].map((day) => ({
    id: `${restaurantId}-hour-${day}`,
    restaurant_id: restaurantId,
    day_of_week: day,
    open_time: day === 1 ? null : "11:00:00",
    close_time: day === 1 ? null : "22:00:00",
    is_closed: day === 1,
  }));

export const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: U.taco,
    user_id: U.user1,
    name: "La Calle Tacos",
    slug: "la-calle-tacos",
    logo_url: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200&h=200&fit=crop",
    banner_url: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1200&h=400&fit=crop",
    instagram_url: "https://instagram.com/lacalletacos",
    facebook_url: "https://facebook.com/lacalletacos",
    website_url: null,
    is_premium: false,
    accepts_reservations: false,
  },
  {
    id: U.sushi,
    user_id: U.user2,
    name: "Sakura Omakase",
    slug: "sakura-omakase",
    logo_url: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=200&h=200&fit=crop",
    banner_url: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=1200&h=400&fit=crop",
    instagram_url: "https://instagram.com/sakuraomakase",
    facebook_url: null,
    website_url: "https://sakuraomakase.com",
    is_premium: true,
    accepts_reservations: true,
  },
  {
    id: U.trattoria,
    user_id: U.user3,
    name: "Nonna Rosa Trattoria",
    slug: "nonna-rosa-trattoria",
    logo_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200&fit=crop",
    banner_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=400&fit=crop",
    instagram_url: "https://instagram.com/nonnarosa",
    facebook_url: "https://facebook.com/nonnarosa",
    website_url: "https://nonnarosa.it",
    is_premium: false,
    accepts_reservations: false,
  },
  {
    id: U.burger,
    user_id: U.user4,
    name: "Smash & Co.",
    slug: "smash-and-co",
    logo_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop",
    banner_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=400&fit=crop",
    instagram_url: "https://instagram.com/smashandco",
    facebook_url: "https://facebook.com/smashandco",
    website_url: null,
    is_premium: true,
    accepts_reservations: true,
  },
];

export const MOCK_CUSTOM_LINKS: CustomRestaurantLink[] = [
  { id: "link-1", restaurant_id: U.taco, label: "TripAdvisor", url: "https://tripadvisor.com/la-calle-tacos" },
  { id: "link-2", restaurant_id: U.sushi, label: "Michelin Guide", url: "https://guide.michelin.com/sakura" },
  { id: "link-3", restaurant_id: U.burger, label: "Uber Eats", url: "https://ubereats.com/smash-and-co" },
];

export const MOCK_OPERATING_HOURS: OperatingHour[] = [
  ...defaultHours(U.taco),
  ...defaultHours(U.sushi).map((h) =>
    h.day_of_week === 0 || h.day_of_week === 6
      ? { ...h, open_time: "17:00:00", close_time: "23:00:00" }
      : h
  ),
  ...defaultHours(U.trattoria).map((h) =>
    h.day_of_week === 2 ? { ...h, is_closed: true, open_time: null, close_time: null } : h
  ),
  ...defaultHours(U.burger).map((h) => ({
    ...h,
    open_time: h.is_closed ? null : "12:00:00",
    close_time: h.is_closed ? null : "23:30:00",
  })),
];

// Menu data builders
function item(
  id: string,
  categoryId: string,
  name: string,
  description: string,
  price: number,
  image: string,
  allergens: string[],
  tags: string[] = []
): MenuItem {
  return {
    id,
    category_id: categoryId,
    name,
    description,
    price,
    image_url: image,
    allergens,
    is_available: true,
    tags,
  };
}

function tr(
  id: string,
  itemId: string,
  lang: MenuTranslation["language_code"],
  name: string,
  desc: string
): MenuTranslation {
  return { id, item_id: itemId, language_code: lang, translated_name: name, translated_description: desc };
}

const IMG = {
  taco: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=300&fit=crop",
  burrito: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=300&fit=crop",
  salsa: "https://images.unsplash.com/photo-1514516344777-8f3f22d2f0b0?w=400&h=300&fit=crop",
  sushi: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop",
  nigiri: "https://images.unsplash.com/photo-1611143669185-af63c5e9c4cd?w=400&h=300&fit=crop",
  pasta: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop",
  pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop",
  burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",
  fries: "https://images.unsplash.com/photo-1573080496216-bf04024dfbb1?w=400&h=300&fit=crop",
};

export const MOCK_CATEGORIES: MenuCategory[] = [
  { id: "cat-t1", restaurant_id: U.taco, name: "Tacos", sort_order: 0 },
  { id: "cat-t2", restaurant_id: U.taco, name: "Burritos", sort_order: 1 },
  { id: "cat-t3", restaurant_id: U.taco, name: "Sides", sort_order: 2 },
  { id: "cat-s1", restaurant_id: U.sushi, name: "Nigiri", sort_order: 0 },
  { id: "cat-s2", restaurant_id: U.sushi, name: "Maki Rolls", sort_order: 1 },
  { id: "cat-s3", restaurant_id: U.sushi, name: "Omakase", sort_order: 2 },
  { id: "cat-i1", restaurant_id: U.trattoria, name: "Antipasti", sort_order: 0 },
  { id: "cat-i2", restaurant_id: U.trattoria, name: "Pasta", sort_order: 1 },
  { id: "cat-i3", restaurant_id: U.trattoria, name: "Pizza", sort_order: 2 },
  { id: "cat-b1", restaurant_id: U.burger, name: "Smash Burgers", sort_order: 0 },
  { id: "cat-b2", restaurant_id: U.burger, name: "Sides", sort_order: 1 },
];

export const MOCK_MENU_ITEMS: MenuItem[] = [
  item("mi-t1", "cat-t1", "Al Pastor Taco", "Marinated pork, pineapple, cilantro, onion", 4.5, IMG.taco, ["Gluten"], ["Gluten-Free"]),
  item("mi-t2", "cat-t1", "Carnitas Taco", "Slow-braised pork with salsa verde", 4.0, IMG.taco, [], ["Gluten-Free"]),
  item("mi-t3", "cat-t1", "Veggie Taco", "Grilled peppers, black beans, avocado crema", 3.8, IMG.taco, ["Dairy"], ["Vegan", "Vegetarian", "Gluten-Free"]),
  item("mi-t4", "cat-t2", "California Burrito", "Carne asada, fries, guacamole, cheese", 12.5, IMG.burrito, ["Gluten", "Dairy"], []),
  item("mi-t5", "cat-t3", "Chips & Guac", "Fresh avocado, lime, sea salt", 6.0, IMG.salsa, [], ["Vegan", "Vegetarian", "Gluten-Free"]),
  item("mi-s1", "cat-s1", "Otoro Nigiri", "Fatty tuna, wasabi, nigiri rice", 18.0, IMG.nigiri, ["Fish", "Soy"], ["Gluten-Free"]),
  item("mi-s2", "cat-s1", "Uni Nigiri", "Hokkaido sea urchin, nori", 22.0, IMG.nigiri, ["Fish"], ["Gluten-Free"]),
  item("mi-s3", "cat-s2", "Dragon Roll", "Eel, avocado, cucumber, tobiko", 16.5, IMG.sushi, ["Fish", "Gluten", "Eggs"], []),
  item("mi-s4", "cat-s3", "Chef's Omakase", "12-course seasonal tasting menu", 95.0, IMG.sushi, ["Fish", "Shellfish", "Soy"], ["Gluten-Free"]),
  item("mi-i1", "cat-i1", "Burrata", "Heirloom tomatoes, basil oil, aged balsamic", 14.0, IMG.pasta, ["Dairy"], ["Vegetarian", "Gluten-Free"]),
  item("mi-i2", "cat-i2", "Cacio e Pepe", "Pecorino Romano, black pepper, tonnarelli", 16.0, IMG.pasta, ["Gluten", "Dairy"], []),
  item("mi-i3", "cat-i2", "Pesto Genovese", "Fresh basil, pine nuts, Parmigiano", 15.5, IMG.pasta, ["Gluten", "Dairy", "Nuts"], []),
  item("mi-i4", "cat-i3", "Margherita DOC", "San Marzano, fior di latte, fresh basil", 13.0, IMG.pizza, ["Gluten", "Dairy"], []),
  item("mi-b1", "cat-b1", "Classic Smash", "Double patty, American cheese, pickles, special sauce", 14.0, IMG.burger, ["Gluten", "Dairy", "Eggs"], []),
  item("mi-b2", "cat-b1", "Truffle Smash", "Black truffle aioli, gruyère, caramelized onions", 17.5, IMG.burger, ["Gluten", "Dairy", "Eggs"], []),
  item("mi-b3", "cat-b1", "Plant Smash", "Beyond patty, vegan cheese, avocado", 15.0, IMG.burger, ["Gluten", "Soy"], ["Vegan", "Vegetarian"]),
  item("mi-b4", "cat-b2", "Loaded Fries", "Bacon, cheddar, jalapeño ranch", 8.5, IMG.fries, ["Dairy"], []),
];

export const MOCK_TRANSLATIONS: MenuTranslation[] = [
  tr("tr-1", "mi-t1", "es", "Taco al Pastor", "Cerdo marinado, piña, cilantro, cebolla"),
  tr("tr-2", "mi-t1", "de", "Al Pastor Taco", "Mariniertes Schweinefleisch, Ananas, Koriander"),
  tr("tr-3", "mi-s1", "es", "Nigiri de Otoro", "Atún graso, wasabi, arroz nigiri"),
  tr("tr-4", "mi-s1", "fr", "Nigiri Otoro", "Thon gras, wasabi, riz nigiri"),
  tr("tr-5", "mi-i2", "it", "Cacio e Pepe", "Pecorino Romano, pepe nero, tonnarelli"),
  tr("tr-6", "mi-i2", "es", "Cacio e Pepe", "Pecorino Romano, pimienta negra, tonnarelli"),
  tr("tr-7", "mi-b1", "nl", "Klassieke Smash", "Dubbele burger, Amerikaanse kaas, augurken"),
];

export const MOCK_RESERVATIONS: Reservation[] = [
  {
    id: "res-1",
    restaurant_id: U.sushi,
    customer_name: "Emma Laurent",
    customer_email: "emma@example.com",
    customer_phone: "+34 612 345 678",
    date: "2026-06-12",
    time: "20:00:00",
    party_size: 2,
    status: "pending",
    special_requests: "Window seat if possible",
  },
  {
    id: "res-2",
    restaurant_id: U.sushi,
    customer_name: "James Chen",
    customer_email: "james@example.com",
    customer_phone: "+34 698 765 432",
    date: "2026-06-10",
    time: "19:30:00",
    party_size: 4,
    status: "confirmed",
    special_requests: null,
  },
  {
    id: "res-3",
    restaurant_id: U.burger,
    customer_name: "Sofia Martinez",
    customer_email: "sofia@example.com",
    customer_phone: "+34 611 222 333",
    date: "2026-06-09",
    time: "13:00:00",
    party_size: 6,
    status: "pending",
    special_requests: "Birthday celebration — need high chair",
  },
  {
    id: "res-4",
    restaurant_id: U.burger,
    customer_name: "Marc Dubois",
    customer_email: "marc@example.com",
    customer_phone: "+34 644 555 666",
    date: "2026-06-05",
    time: "21:00:00",
    party_size: 2,
    status: "completed",
    special_requests: null,
  },
];

function generatePageViews(restaurantId: string, count: number, monthsBack = 6): PageView[] {
  const views: PageView[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * monthsBack * 30);
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    views.push({
      id: `pv-${restaurantId}-${i}`,
      restaurant_id: restaurantId,
      viewed_at: d.toISOString(),
    });
  }
  return views;
}

export const MOCK_PAGE_VIEWS: PageView[] = [
  ...generatePageViews(U.taco, 120),
  ...generatePageViews(U.sushi, 340),
  ...generatePageViews(U.trattoria, 85),
  ...generatePageViews(U.burger, 280),
];

export const MOCK_EXPENSES: BusinessExpense[] = [
  { id: "exp-1", restaurant_id: U.sushi, title: "Fish delivery — Tsukiji", amount: 2400, category: "Inventory", expense_date: "2026-05-28" },
  { id: "exp-2", restaurant_id: U.sushi, title: "Sous chef payroll", amount: 3200, category: "Staff", expense_date: "2026-05-30" },
  { id: "exp-3", restaurant_id: U.sushi, title: "Lease — Rambla location", amount: 4500, category: "Rent", expense_date: "2026-06-01" },
  { id: "exp-4", restaurant_id: U.sushi, title: "Instagram ads", amount: 450, category: "Marketing", expense_date: "2026-05-15" },
  { id: "exp-5", restaurant_id: U.burger, title: "Weekly beef order", amount: 890, category: "Inventory", expense_date: "2026-06-02" },
  { id: "exp-6", restaurant_id: U.burger, title: "Staff wages", amount: 4100, category: "Staff", expense_date: "2026-05-30" },
  { id: "exp-7", restaurant_id: U.burger, title: "Electricity", amount: 380, category: "Utilities", expense_date: "2026-06-01" },
];

export function getRestaurantBySlug(slug: string): RestaurantFull | null {
  const restaurant = MOCK_RESTAURANTS.find((r) => r.slug === slug);
  if (!restaurant) return null;

  const categories = MOCK_CATEGORIES.filter((c) => c.restaurant_id === restaurant.id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((cat) => ({
      ...cat,
      items: MOCK_MENU_ITEMS.filter((i) => i.category_id === cat.id).map((item) => ({
        ...item,
        translations: MOCK_TRANSLATIONS.filter((t) => t.item_id === item.id),
      })),
    }));

  return {
    ...restaurant,
    custom_links: MOCK_CUSTOM_LINKS.filter((l) => l.restaurant_id === restaurant.id),
    operating_hours: MOCK_OPERATING_HOURS.filter((h) => h.restaurant_id === restaurant.id),
    categories,
  };
}

export function getAllSlugs(): string[] {
  return MOCK_RESTAURANTS.map((r) => r.slug);
}

export function getReservationsForRestaurant(restaurantId: string): Reservation[] {
  return MOCK_RESERVATIONS.filter((r) => r.restaurant_id === restaurantId).sort(
    (a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)
  );
}

export function getPageViewsForRestaurant(restaurantId: string): PageView[] {
  return MOCK_PAGE_VIEWS.filter((v) => v.restaurant_id === restaurantId);
}

export function getExpensesForRestaurant(restaurantId: string): BusinessExpense[] {
  return MOCK_EXPENSES.filter((e) => e.restaurant_id === restaurantId);
}

/** Demo dashboard uses Sakura Omakase (premium) by default */
export const DEMO_RESTAURANT = MOCK_RESTAURANTS.find((r) => r.slug === "sakura-omakase")!;
