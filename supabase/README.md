# Supabase setup

This portfolio stays on GitHub Pages (static hosting). Supabase adds the three
things static hosting can't do on its own: a **real login**, a **database** of
projects, and **file storage** for images and STL models.

You only do this once. Budget ~15 minutes.

---

## 1. Create a project

1. Go to <https://supabase.com> → **New project** (the free tier is plenty).
2. Pick a name and a strong database password. Choose a region near you.
3. Wait for it to finish provisioning.

## 2. Run the schema

1. In the dashboard, open **SQL Editor → New query**.
2. Open [`schema.sql`](./schema.sql), copy everything, paste it in, click **Run**.
   - This creates the `projects` table, the security rules (RLS), and the
     `images` + `models` storage buckets.
3. **Confirm your owner email.** In `schema.sql` the `is_owner()` function is
   set to `phillipcastro0@gmail.com`. If you log in with a different email,
   change it there and re-run that one statement.

## 3. Lock down sign-ups + create your account

1. **Authentication → Providers → Email**: keep it enabled.
2. **Authentication → Sign In / Providers** (or **Settings**): turn **OFF**
   "Allow new users to sign up". This means nobody can create an account —
   only the one you make by hand.
3. **Authentication → Users → Add user → Create new user**: enter your email
   (the same one in `is_owner()`) and a strong password. Tick "Auto confirm".
   This is the account you'll use at `/admin.html`.

## 4. Connect the site

1. **Project Settings → API**. Copy:
   - **Project URL**
   - **Project API keys → `anon` / `public`**
2. Open [`../js/config.js`](../js/config.js) and paste them into `url` and
   `anonKey`. Commit and push.

> The `anon` key is meant to be public — it's safe in the repo. The security
> comes from the RLS rules, not from hiding the key. **Never** put the
> `service_role` key in the site.

## 5. (Optional) image transformations

On paid plans Supabase can resize/convert images on the fly. On free tier the
admin uploader still works; just keep source JPEGs reasonably sized.

---

## Data shape (`projects` table)

| column | type | notes |
|---|---|---|
| `slug` | text, unique | URL key, e.g. `raspberry-pi-laptop` |
| `title` | text | |
| `subtitle` | text | one-line tagline |
| `status` | `'project'` \| `'concept'` | which list it shows in |
| `tags` | text[] | shown as chips |
| `summary` | text | card + meta description |
| `why_md` / `how_md` / `problems_md` | text (markdown-lite) | the three story sections |
| `hero_image` | text (URL) | top image |
| `gallery` | jsonb | `[{ "url": "...", "alt": "..." }]` |
| `stl_url` | text (URL) | optional STL for the 3D viewer |
| `specs` | jsonb | `[{ "label": "...", "value": "..." }]` |
| `published` | bool | drafts are hidden from the public |
| `sort_order` | int | lower shows first |

## Storage limits (free tier)

- ~1 GB total, ~50 MB per file. Keep STL files lean (decimate dense meshes).
- Buckets `images` and `models` are public-read; only the owner can upload or
  delete.

## Backups

Because content now lives in Supabase (not git), use the **Export JSON** button
in the admin dashboard now and then to keep a local backup.
