# menulia.io

Premium SaaS platform for restaurant owners — digital menus, reservations, and analytics.

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| **Framework** | Next.js 15 (App Router) | Full-stack React, SSR, PWA-ready |
| **Database** | **Supabase (PostgreSQL)** | Your schema references `auth.users`; Supabase provides auth + Postgres + RLS in one |
| **Styling** | Tailwind CSS v4 | Design system with Emerald (#047857) + Coral CTA (#F97316) |
| **Charts** | Recharts | Analytics dashboard |
| **Local dev** | Mock data layer | Works without Supabase out of the box |

## Quick Start

```bash
cd ~/Projects/menulia
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** Node.js 18+ is required. Install from [nodejs.org](https://nodejs.org) if `npm` is not found.

## Demo Restaurants

| Restaurant | Slug | Tier | Reservations |
|------------|------|------|--------------|
| La Calle Tacos (Mexican) | `/la-calle-tacos` | Free | No |
| Sakura Omakase (Sushi) | `/sakura-omakase` | Premium | Yes |
| Nonna Rosa Trattoria (Italian) | `/nonna-rosa-trattoria` | Free | No |
| Smash & Co. (Burgers) | `/smash-and-co` | Premium | Yes |

## Routes

- **Marketing:** `/`, `/pricing`, `/services`, `/about`, `/blog`, `/contact`
- **Public menu (PWA):** `/[restaurant-slug]`
- **Onboarding:** `/onboarding`
- **Admin dashboard:** `/dashboard` (+ `/menu`, `/importer`, `/reservations`, `/analytics`, `/settings`)

## Supabase Setup (Production)

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration: `supabase/migrations/20250608000000_initial_schema.sql`
3. Optionally run `supabase/seed.sql` for demo data
4. Set env vars in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   NEXT_PUBLIC_USE_MOCK_DATA=false
   ```

## Design System

- **60%** — White/light-grey backgrounds (`#fafafa`)
- **30%** — Deep Emerald Green `#047857` (nav, success, brand)
- **10%** — Burnt Coral `#F97316` (primary CTAs only)

## Project Structure

```
src/
├── app/
│   ├── (marketing)/     # B2B website
│   ├── [restaurant-slug]/ # Public diner PWA
│   ├── dashboard/       # Admin dashboard
│   └── onboarding/
├── components/
│   ├── marketing/
│   ├── public/          # Diner-facing UI
│   ├── dashboard/
│   └── ui/
└── lib/
    ├── mock-data.ts     # Sandbox seed data
    ├── types.ts
    └── supabase/
```
