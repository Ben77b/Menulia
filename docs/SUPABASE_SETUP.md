# Supabase, Vercel & Domain Setup

This document is the single source of truth for external configuration. The app code targets **`supabase-schema.sql`** at the repo root.

---

## 1. Supabase Database

### Run the canonical schema

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**
2. Paste and run the full contents of **`supabase-schema.sql`**
3. Confirm these tables exist:
   - `restaurants` — with `user_id`, `slug`, `logo`, `theme_colors`, `typography`, `operating_hours`, `custom_links`, `footer_slogan`
   - `categories` — with `restaurant_id`, `name`, `order_index`, `layout_type`
   - `dishes` — with `category_id`, `name`, `description`, `price`, `image` (or `image_url` if you ran the rename block at the bottom of the schema file)

### Do not use the old migrations for a fresh setup

Files under `supabase/migrations/20250608000000_initial_schema.sql` define **`menu_categories`** / **`menu_items`** and normalized link/hour tables. This codebase queries **`categories`** / **`dishes`** with JSONB columns on `restaurants`. Mixing both will break the dashboard.

If your project already ran old migrations, either:
- Start a new Supabase project and run `supabase-schema.sql` only, or
- Manually align tables to match `supabase-schema.sql` (drop conflicting tables first in a dev environment).

### Auth

Enable **Email** provider under Authentication → Providers.

The app expects a `profiles` table synced on login (see `src/lib/auth/profile.ts`). If profiles are missing, run any existing profiles migration or create:

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile" ON profiles FOR ALL USING (auth.uid() = id);
```

### Row Level Security

`supabase-schema.sql` ships permissive policies (`USING (true)`) for development. **Before scaling to production**, tighten policies so users can only read/write their own restaurants:

```sql
-- Example: restaurants owned by authenticated user
CREATE POLICY "Users manage own restaurants" ON restaurants
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

Apply similar rules for `categories` and `dishes` via `restaurant_id` ownership.

---

## 2. Supabase Storage

Create a **public** bucket named **`menu-images`**.

See [SUPABASE_STORAGE_SETUP.md](../SUPABASE_STORAGE_SETUP.md) for bucket policies.

Used for:
- Dish photos (Menu Builder)
- Restaurant logo uploads

If uploads fail, verify authenticated INSERT and public SELECT policies on `storage.objects`.

---

## 3. Environment Variables

### Local (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Vercel (Production)

Same keys, with:

```
NEXT_PUBLIC_SITE_URL=https://menulia.net
```

Add variables for **Production**, **Preview**, and **Development** environments as needed.

---

## 4. Vercel Deployment

1. Connect GitHub repo `Ben77b/Menulia` to Vercel
2. Production branch: **`main`**
3. Framework preset: **Next.js**
4. Set the three `NEXT_PUBLIC_*` env vars above
5. Deploy — each push to `main` triggers a production deploy

No extra build command required (`npm run build` is default).

---

## 5. Domain (menulia.net)

In **Vercel → Project → Settings → Domains**:

1. Add `menulia.net` and `www.menulia.net`
2. At your DNS registrar, add the records Vercel shows (usually `A`/`CNAME` to Vercel)
3. Enable redirect: `www` → apex (or vice versa — pick one canonical host)
4. Ensure `NEXT_PUBLIC_SITE_URL=https://menulia.net` matches the canonical domain (used for QR codes, sitemap, auth redirects)

In **Supabase → Authentication → URL Configuration**:

| Setting | Value |
|---------|--------|
| Site URL | `https://menulia.net` |
| Redirect URLs | `https://menulia.net/**`, `http://localhost:3000/**` |

---

## 6. Optional Tables (Not Yet Wired)

These features show empty UI until you add tables and wire `src/lib/data.ts`:

| Feature | Suggested tables |
|---------|------------------|
| Analytics | `page_views`, `reservations`, `business_expenses` |
| AI menu importer | External API + write to `categories`/`dishes` |

---

## 7. Column Notes

| App field | DB column | Notes |
|-----------|-----------|--------|
| Dish image | `dishes.image` or `dishes.image_url` | Code writes `image`; schema file can rename to `image_url` |
| Restaurant logo | `restaurants.logo` | Branding dashboard saves here |
| Theme colors | `restaurants.theme_colors` JSONB | Keys: `headerFooterBackgroundColor`, `categoryBackgroundColor`, etc. |
| Typography | `restaurants.typography` JSONB | Keys: `titleFont`, `metaTitle`, `metaDescription` |
| Settings email | May use `contact_email` if you add the column | Settings page may save `email` — add column if missing |

If settings save fails on unknown columns, add them in SQL Editor or remove unused fields from the settings form.

---

## 8. Quick Verification Checklist

- [ ] `supabase-schema.sql` applied
- [ ] `menu-images` storage bucket + policies
- [ ] Vercel env vars set
- [ ] Domain points to Vercel, SSL active
- [ ] Supabase auth redirect URLs include production + localhost
- [ ] Sign up → create restaurant → add category/dish → visible on `/menu/your-slug`
- [ ] Branding → Save Changes → colors persist after refresh
