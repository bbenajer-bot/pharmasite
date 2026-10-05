# Progress Log

Newest entry on top. Each session: what got done, what's unfinished, what's next.

---

## 2026-10-05 — Session 3b: Neon connected to the live preview

**Done**
- Neon free-tier Postgres (project `pharmacy-site`, AWS US East) created by the user, under their own
  account for now. **Move it to the client's account at launch (Phase 7).**
- Netlify env var `DATABASE_URL` = Neon string (set by the user). Local `.env` has `NEON_DATABASE_URL`
  (the Neon string) next to the local `DATABASE_URL`; documented in `.env.example`.
- First migration `src/migrations/20261005_172544_initial.ts` (all current tables), applied to Neon.
- `prodMigrations` in `payload.config.ts`: the live site applies pending migrations on startup.
  **Rule from now on:** after changing collections or globals, run
  `pnpm payload migrate:create <name>` and commit the migration files. Dev still uses schema push.

**Verified on https://meridian-pharma.netlify.app**
- `/admin` returns 200 (create-first-user screen, since Neon has no users yet).
- The contact form saves to Neon and shows the success message (test row deleted afterwards).

**Notes**
- `.env` is not shell-sourceable (the Neon URL contains `&`). Read single lines with grep instead of `source .env`.
- The "contact form doesn't work on the live preview" gap from Session 3 is fixed.

**Next**
- Create an admin account on the live `/admin` (the user, with their own password).
- Phase 2 last item: Payload **Site Settings** global (now safe, since the live site has a database).

---

## 2026-10-05 — Session 3: Phase 2 core pages

**Done**
- `/about`: story, IDFPR license box, physician section, values, team (only the doctor + pharmacist-in-charge
  from `site.ts`; no invented staff).
- `/services`: six services with details + jump links. Service data moved to `src/lib/services.ts`;
  the home page cards read from it too.
- `/faq`: grouped `<details>` accordion (insurance, transfers, delivery, ordering, payment). No JS needed.
- `/contact`: form (server action `contact/actions.ts`, honeypot, server-side validation, no-medical-details
  warning, 911 note) + phone, email, address/directions, hours. Saves to the new admin-only
  **`contact-messages`** collection (no public REST create).
- `(frontend)/not-found.tsx`: custom 404. The `[...slug]` catch-all now has `dynamicParams = true`, so
  unknown URLs call `notFound()` and get the 404 inside the site layout (status 404).
- Removed about/services/contact/faq from the coming-soon list. `site.deliveryArea` added (TODO placeholder).
- Shared `PageHeader` component for inner-page title bands.

**Verified**
- `pnpm typecheck` and `pnpm build` pass; the four new pages prerender as static.
- Chrome (via DevTools protocol) at 375px and 1280px: no horizontal scroll, one h1 per page.
  FAQ items open; contact form shows field errors, keeps typed values, focuses the alert, and a valid
  message saves to the local DB.

**Known gaps**
- ~~Live preview has no `DATABASE_URL`~~ fixed in Session 3b (Neon connected).
- No admin email for contact messages yet (Phase 3, Resend).
- In `next dev`, the browser tab title on a 404 falls back to the default site title (server HTML has
  "Page not found"). Not re-checked on the production build yet.
- `pnpm lint` still broken (see Session 1).
- Placeholder copy to confirm with client: vaccines offered, delivery radius, doctor bio, founding story,
  insurance wording (all marked TODO in code).

**Next**
- Phase 2 last item: Payload **Site Settings** global so the client can edit business details.
- Then Phase 3 (shop + pay-by-email orders).

---

## 2026-10-05 — Session 2: client preview deployed

**Live preview:** https://meridian-pharma.netlify.app (Netlify, auto-deploys on every push to `main`)
**Repo:** https://github.com/camilleyeyou/pharmacy-site (private)

**Done**
- `netlify.toml` (pnpm build, Node 22) and `packageManager` pin in package.json.
- Preview mode: Netlify env `NEXT_PUBLIC_PREVIEW_MODE=true` shows a "work in progress" banner and
  sets `noindex`. **Remove that env var at real launch.**
- `src/app/(frontend)/[...slug]/page.tsx`: "Coming soon" pages for every menu/footer link not built yet.
  When you build a real page (e.g. `/shop`), delete its entry from the `upcoming` list in that file.

**Netlify env vars set:** `NEXT_PUBLIC_PREVIEW_MODE`, `PAYLOAD_SECRET`. No `DATABASE_URL` yet, so
`/admin` does not work on the live site until Neon is connected (Phase 7, or earlier if needed).

**GitHub CLI:** installed at `~/.local/bin/gh` (Homebrew couldn't connect), logged in as camilleyeyou.

---

## 2026-10-05 — Session 1: project setup + home page

**Done**
- Scaffolded from Payload's official `blank` template (v3.90.2), switched MongoDB → Postgres adapter.
- Created local Postgres DB `pharmacy_site`; `.env` (git-ignored) + `.env.example`.
- Tailwind v4 with brand tokens; fonts Inter (body) + Plus Jakarta Sans (headings).
- `src/lib/site.ts` holds every business detail. **All placeholders** (name "Meridian Pharmacy",
  fictional 555 phone, example address, fake license #, "Dr. Alex Morgan").
- Header with mobile menu, Footer with hours/address/license/IDFPR verify link and legal links.
- Home page sections: Hero, Services, How it works, Featured products (static samples),
  About teaser, Blog teaser (static samples), Visit us.
- CLAUDE.md, docs/scope.md, docs/build-plan.md.

**Verified**
- `pnpm typecheck` and `pnpm build` pass; home page prerenders as static.
- Checked in the browser at 1280px, 1024px and 375px (mobile menu opens and lists every link,
  no horizontal scroll, no console errors). `/admin` loads the create-first-user screen.

**Known issue: `pnpm lint` fails**
- The template's `eslint.config.mjs` uses `FlatCompat` + `extends('next/core-web-vitals')`, which crashes
  with eslint-config-next 16 ("Converting circular structure to JSON"). Fix: replace it with
  `import nextVitals from 'eslint-config-next/core-web-vitals'` and
  `import nextTs from 'eslint-config-next/typescript'`, then export `[...nextVitals, ...nextTs, {rules…}, {ignores…}]`.
- Not applied yet: the ecc plugin's config-protection hook blocks edits to lint configs. Disable that
  hook for one edit (or make the change by hand), then delete the `@eslint/eslintrc` devDependency.

**Dev notes**
- Port 3000 is often taken by another local project; the preview config uses `autoPort`, so the
  dev server may run on a random port. Check the terminal output for the URL.
- Slow internet: install with `pnpm install --prefer-offline`.

**Known gaps (expected at this stage)**
- Nav links (Shop, Services, Prescriptions, Blog, About, Contact, Cart, legal pages) go to 404
  until their phases are built.
- Service claims (vaccines offered, delivery, refill reminders) are placeholder copy; confirm with client.

**Waiting on the client**
- Pharmacy name, address, phone, hours, license numbers, doctor's name/bio
- Which pharmacy software and EHR they use (decides booking + refill portal approach)

**Next**
- Finish the Phase 1 checklist (admin user, build check, first commit), then Phase 2: core pages.
