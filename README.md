# ppmmcc.dev

Personal engineering portfolio of Phillip Castro — mechanical engineering student
building hardware for a Type I civilization. Live at https://ppmmcc.dev.

Static HTML / CSS / JS, auto-deployed to Cloudflare on every push to `main`.
**No build step.** Animation via GSAP + Lenis (CDN). The public site is fully
static — it reads `data/projects.json` and files in `assets/`, with no backend
call. A private admin dashboard ([Supabase](https://supabase.com) auth + database
+ storage) is an optional authoring tool; `npm run sync` bakes its content into
the repo (see below).

## How it fits together

| Area | Files |
|---|---|
| Pages | `index/about/projects/concepts/vision/contact.html`, `project.html` (data-driven detail), `admin.html` (private) |
| Styles | `css/style.css` (design tokens, motion, CAD + admin UI) |
| Motion | `js/motion.js` (Lenis smooth scroll, GSAP reveals, custom cursor) · `js/main.js` (menu, fallbacks) |
| Data | `data/projects.json` is the source of truth for the public site (read by `js/render.js`); models + images live in `assets/` |
| Sync | `scripts/sync-from-supabase.mjs` (`npm run sync`) bakes admin edits from Supabase into the repo |
| 3D viewer | `js/stl-viewer.js` (Three.js + STLLoader), mounted by `project.html` |
| Admin | `js/admin.js` (login, CRUD, image/STL uploads, publish, JSON export/import) |
| Backend | `js/config.js`, `js/supabase-client.js`, `supabase/schema.sql`, `supabase/README.md` |

## Adding / editing a project

The public site is **static**: it reads `data/projects.json` and files in
`assets/` and never calls Supabase. The admin is just an authoring convenience —
so changes go live in two steps: author, then bake + push.

1. Open `/admin.html`, sign in with your owner account.
2. **+ New project** → fill in title, the why/how/what sections, tags, specs,
   upload images and an optional 3D model (STL/GLB/glTF/OBJ/3MF), toggle
   **Published**, save.
3. **Bake it into the repo:** `npm run sync`. This downloads any new
   images/models into `assets/` and regenerates `data/projects.json`.
4. **Publish:** `git add -A && git commit -m "Update projects" && git push`.

> Until you run `npm run sync` and push, admin edits live only in Supabase and
> won't appear on the published site (and will vanish if the free project
> pauses). The sync step is what makes them permanent.

## First-time backend setup

See [`supabase/README.md`](supabase/README.md). ~15 minutes: create a Supabase
project, run `supabase/schema.sql`, disable public sign-ups, create your owner
user, then paste your project URL + anon key into `js/config.js`.

> The anon key in `js/config.js` is public by design — Row-Level Security
> protects the data. **Never commit the Supabase `service_role` key.**

## Local preview

```
npx serve .        # or: python -m http.server
```

Open http://localhost:3000 (or :8000). The public pages always serve the
committed `data/projects.json` content; only `/admin.html` needs Supabase
configured (and the project awake) to author changes.

---

If you'd like to use anything here as reference, please email
phillipcastro0@gmail.com first if you're copying substantial portions.
