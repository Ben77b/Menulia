# Menulia

Premium SaaS platform for restaurant owners — digital menus, branding, and QR codes.

**Production:** [menulia.net](https://menulia.net)

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Database & Auth | Supabase (PostgreSQL) |
| Styling | Tailwind CSS v4 |
| Hosting | Vercel (GitHub `main` branch) |

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Set these in `.env.local` (local) and in **Vercel → Project → Settings → Environment Variables** (production):

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL, e.g. `https://menulia.net` |

## Routes

| Area | Path |
|------|------|
| Marketing | `/`, `/pricing`, `/services`, `/about`, `/blog`, `/contact` |
| Auth | `/login`, `/signup`, `/logout` |
| Public menu | `/menu/[restaurant-slug]` |
| Legacy redirect | `/[restaurant-slug]` → `/menu/[slug]` |
| Dashboard | `/dashboard` → `/dashboard/[restaurant-id]` |
| Menu builder | `/dashboard/[id]/menu` |
| Branding | `/dashboard/[id]/branding` |
| Settings | `/dashboard/[id]/settings` |
| QR code | `/dashboard/[id]/qr` |

## Supabase Setup

**Use the canonical schema:** run `supabase-schema.sql` in the Supabase SQL Editor. Do not use the older `supabase/migrations/20250608000000_initial_schema.sql` — it targets different table names (`menu_categories`, `menu_items`) that this app does not use.

See [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) for full database, storage, auth, and Vercel configuration.

## Design System

- **Brand:** Deep Emerald `#047857`
- **CTA:** Burnt Coral `#F97316`

## Project Structure

```
src/
├── app/
│   ├── (marketing)/              # B2B website
│   ├── menu/[restaurant-slug]/   # Public diner menu
│   ├── dashboard/
│   │   ├── (main)/               # First-restaurant onboarding gate
│   │   └── [restaurantId]/       # Authenticated dashboard features
│   ├── login, signup, logout
│   └── ...
├── components/
│   ├── marketing/
│   ├── public/                   # Diner-facing UI (DinerApp)
│   └── dashboard/
├── contexts/                     # Auth, restaurant, design state
└── lib/
    ├── data.ts                   # Server-side restaurant/menu fetch
    ├── menu-db.ts                # Client-side menu CRUD
    ├── restaurant-design.ts      # Design types & defaults
    └── supabase.ts               # Browser Supabase client
```
