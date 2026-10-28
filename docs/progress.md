# Progress Log

Newest entry on top. Each session: what got done, what's unfinished, what's next.

---

## 2026-10-28 — Session 12: image storage (UploadThing)

**Decision (user):** no card or PayPal available, so **UploadThing replaces Cloudflare R2** (R2 requires a payment
method on file even on the free tier). UploadThing free plan, no card; official adapter maintained by Payload.

**Done**
- `@payloadcms/storage-uploadthing@3.90.2` (pinned to the Payload version) on the Media collection
  (`src/payload.config.ts`). On only when `UPLOADTHING_TOKEN` is set; without it (local dev) uploads stay in ./media.
  - `clientUploads`: the admin's browser sends files straight to UploadThing (Netlify rejects bodies > ~6 MB).
  - `alwaysInsertFields`: same `media` columns with or without the token. Migration
    `20261028_160627_uploadthing_storage` (adds `_key`, `prefix`, `_objectkey`).
  - Image URLs unchanged (`/api/media/file/…`, served through Payload), so next.config and the CSV import's
    image downloads need no change.
- `.env.example`, CLAUDE.md stack table, build plan updated.
- Accounts created by the user in the client's name: GitHub, Netlify, Neon, Resend, UploadThing.
  Cloudflare (domain) and business email later; the domain is the one item that needs a card.

- **Payload bug worked around** (`src/collections/Media.ts` beforeChange hook): with `clientUploads`, the cloud-storage
  plugin (3.90.2, same in 3.92.1) skips `handleUpload` for files the browser already sent, but that's the only place
  the UploadThing adapter stores `_key`. Admin uploads landed in UploadThing yet 404'd on the site. The hook copies
  the key from `req.file.clientUploadContext`. Remove when Payload fixes it.
- **Moved to the client's GitHub:** `origin` = https://github.com/bbenajer-bot/pharmasite (user pushed; `camilleyeyou`
  is a collaborator). Old repo kept as remote `personal` (the old preview still deploys from it).
- Client's Netlify site created with env vars; its first deploy ran all migrations on the client's Neon DB
  (`ep-steep-truth…`, 22 tables, 0 users). Local `.env` `NEON_DATABASE_URL` → client's DB.

**Verified** (real UploadThing token, local DB)
- Server-side upload (Local API, as the CSV import does): file in UploadThing, not on disk; served at
  `/api/media/file/…`; deleting the record deletes the UploadThing file.
- Admin upload in a browser (Puppeteer, temp admin): file goes browser → UploadThing, key saved, image served (200),
  no console errors; delete removes it from UploadThing. Test records, UploadThing test files and temp admin removed.
- typecheck + `pnpm build` pass.

**Next**
- On the client's site: create the admin login at `/admin`; `DATABASE_URL="$NEON_DATABASE_URL" pnpm seed:legal`;
  one upload on the live admin; end-to-end order + prescription test.

---

## 2026-10-20 — Session 11: Phase 6 performance pass

**Done**
- Audit: Lighthouse performance (mobile, simulated slow 4G + 4× CPU) on every public page, production build.
  Before: 96–100 everywhere, already above the 90 target.
- Fixed:
  - Payload's `withPayload` sends `Accept-CH` / `Critical-CH: Sec-CH-Prefers-Color-Scheme` (+ `Vary`) on **every**
    path, for the admin's light/dark theme. On public pages Chrome repeats the first request because of it
    (~600 ms extra on mobile, Lighthouse "redirects") and the `Vary` splits the CDN cache. `next.config.ts` now
    moves that header rule to `/admin/:path*` only. (`X-Powered-By` is in the same rule, so it's admin-only too.)
  - Cart/checkout: the "Loading…" placeholder (shown until the browser cart is read) is now the same height as the
    empty-cart box, so the footer no longer jumps. CLS 0.054 → 0.003.

**Verified**
- typecheck + `pnpm build` pass. Headers: none on `/`, `/shop`; still present on `/admin`; admin and API respond.
- Lighthouse performance (mobile) after: home 96, privacy 100, product/checkout/terms 99, all others 97–98.
  TBT 40–70 ms, CLS 0–0.003, FCP 0.8–0.9 s; simulated LCP 1.9–2.8 s (a text block, held back by CSS + fonts).
- Left as is: the ~27 KiB "unused JavaScript" and the one render-blocking CSS file are Next.js/React's shared
  bundle; not worth fighting at these scores.

**Notes**
- Re-check on the real Netlify URL after deploy (Phase 7). Real product photos should stay small: they're served
  through `next/image` (resized, WebP/AVIF), but upload sensible sizes (≤ 2000 px).
- Build still prints a `metadataBase` warning 3 times (for the admin / not-found routes outside the public layout).
  Harmless: public pages set it via the layout.

**Next**
- Phase 6 is done except the Notice of Privacy Practices text (waiting on the client). Phase 7: deploy + handoff.

---

## 2026-10-20 — Session 10: Phase 6 SEO

**Done**
- `src/app/sitemap.ts` → `/sitemap.xml`: the public pages + every active OTC product (with its images) + every
  published post (`lastmod` = last edit). Refreshed at most hourly (`revalidate = 3600`), no redeploy needed.
  Cart, checkout, order and "request received" pages are left out. Still returns the fixed pages if the DB is down.
- `src/app/robots.ts` → `/robots.txt`: allows everything except `/admin`, `/api/`, `/cart`, `/checkout`, `/order/`,
  points to the sitemap. **In preview mode (`NEXT_PUBLIC_PREVIEW_MODE=true`) it blocks every crawler.**
- Icons: `src/app/(frontend)/icon.svg` (browser tab; the logo cross) and `src/app/apple-icon.tsx` (180px PNG,
  phone home screen). Fixes the missing favicon found in Session 9. The admin keeps Payload's own favicon.
- Share image: `src/app/opengraph-image.tsx` (1200×630 PNG, brand gradient, logo, name, "Licensed Illinois
  pharmacy · City, ST" from Site Settings, refreshed hourly). Used by every page; blog posts with a cover image use it.
  These two files sit in `src/app/`, not `(frontend)/`: inside a route group Next adds a hash to the URL
  (`/opengraph-image-4usi79`), and the structured data needs a stable `/opengraph-image` and `/apple-icon`.
- Layout metadata: Open Graph defaults (site name, `en_US`, type, image; the image must be listed there, because the
  layout's `openGraph` replaces the file-based one) + `twitter:card = summary_large_image`.
- JSON-LD (`src/lib/structured-data.ts`, `<JsonLd>` escapes `<`): **Pharmacy** on the home page (name, address,
  phone, email, logo, image, opening hours), **Product** on product pages (price, USD, in/out of stock, SKU, brand,
  images, seller = the pharmacy), **BlogPosting** on posts. Opening hours are free text in Site Settings, so
  they're parsed best-effort ("Monday – Friday" + "9:00 AM – 7:00 PM", "Mon-Fri 9am-6pm", "Sat & Sun",
  "Weekdays", "Every day 24 hours"…); anything unreadable or "Closed" is left out, never guessed.
- `src/lib/url.ts`: `siteUrl()` (now also used for email links), `absoluteUrl()`, `isPreviewSite`. **Falls back to
  Netlify's `URL` variable** when `NEXT_PUBLIC_SITE_URL` isn't set. That variable was never set on Netlify, so until
  now email links on the live preview pointed at `localhost:3000`. Documented in `.env.example`.

**Verified** (production build; a blog draft published temporarily, then set back to draft)
- typecheck + `pnpm build` pass. `/sitemap.xml` 41 URLs (13 pages, 27 products, 1 post), image entries for products;
  `/robots.txt` correct in normal and preview builds; preview pages keep `noindex, nofollow`.
- All 19 page types: one title each, no duplicates, description present, `og:title/description/image/site_name/type`,
  `twitter:card`; noindex only on cart, checkout, request received and 404. JSON-LD parses on home/product/post.
- Lighthouse SEO **100** on home, shop, product, blog, post, prescriptions, contact, FAQ.
- Looked at the OG image and the apple icon: render correctly.

**Notes**
- Sample product summaries are short (e.g. 38 characters); real products' summaries become their meta descriptions.
- Validate with Google's Rich Results Test once the real domain is live (Phase 7, with Search Console).
- No `og:url` / canonical tags: every page has a single URL, and shop/blog filters are real pages. Revisit only if
  Search Console reports duplicates.

**User action**
- Optional now, required at launch: Netlify env var `NEXT_PUBLIC_SITE_URL=https://<real domain>`. Until then the
  Netlify URL is used automatically.

**Next**
- Phase 6 last item: performance pass (Lighthouse ≥ 90 on mobile).

---

## 2026-10-20 — Session 9: Phase 6 accessibility pass

**Done**
- Audit: Lighthouse (mobile) accessibility + axe-core (WCAG 2.0/2.1/2.2 A+AA and best practices) on every public
  page at 1280px and 375px, on the production build. Before: 93 on home, 96 elsewhere.
- Fixed:
  - Footer legal links were too small to tap (WCAG 2.2 target size): now `inline-block py-1`.
  - Doctor initials circle on the home page: white on `brand-500` failed contrast; now `brand-600`.
  - Mobile menu: Escape closes it and returns focus to the menu button.
  - Cart: +/− buttons use `aria-disabled` instead of `disabled`, so focus isn't lost at the limit;
    "Remove" announces "Removed X from your cart." and keeps focus in the cart.
  - Checkout: required fields, radio groups and the acknowledgement checkbox now carry `required`
    (the asterisk is visual only); field hints (email, order notes "no health information") are linked with
    `aria-describedby`, together with any error.

**Verified**
- Lighthouse accessibility **100** on all 18 pages (incl. cart/checkout with items, a published blog post,
  submitted page); axe: 0 violations at both widths; one h1 per page; no horizontal overflow at 375px.
- Keyboard script (Puppeteer): first Tab = visible skip link, which jumps into `main`; add to cart status message;
  cart focus/announcements; checkout, contact, prescription and refill forms submitted empty → focus moves to the
  error summary, fields have `aria-invalid` + described by their error; axe clean in those error states;
  mobile menu open/Escape.
- typecheck + `pnpm build` pass. (A blog draft was published temporarily for the audit, then set back to draft.)
- Audit scripts live outside the repo (session scratchpad); Lighthouse/axe were not added as dependencies.

**Found for later**
- No favicon / app icon (`/favicon.ico` 404). Do it with the SEO item (icons + OG image).
- Home "About us" block shows a quote attributed to the doctor ("Every patient deserves care…"). It's placeholder
  copy: the client must approve the wording or it should be removed (no invented quotes).

**Next**
- Phase 6: SEO (metadata check, sitemap.xml, robots.txt, favicon + OG image, Pharmacy JSON-LD), then performance.

---

## 2026-10-20 — Session 8: legal pages

**Done**
- Booking item skipped: still waiting on the client's choice (their EHR/pharmacy portal link or Doxy.me).
- New **Legal Pages** global (admin → Settings → Legal Pages), one tab each for Privacy Policy, Terms of Use,
  Accessibility, Notice of Privacy Practices: rich text + "Last updated" date. The client's attorney can edit
  the text without a developer. `{name}`, `{phone}`, `{email}`, `{address}` in the text are filled in from
  Site Settings when the page renders (`src/lib/legal.ts`).
- Pages `/privacy`, `/terms`, `/accessibility`, `/hipaa-notice` (shared `LegalPage` component). An empty tab
  shows a "contact us for a copy" box with the phone number (the NPP tab says "ask us for a copy").
- Drafts: `pnpm seed:legal` (`src/scripts/seed-legal.ts`) fills privacy/terms/accessibility only where empty.
  They describe what the site really does: form fields collected, no card data, no analytics or tracking cookies
  (cart is in localStorage, admin login cookie only), prescription requests deleted after 90 days, unpaid orders
  cancelled after 7 days, no health details in emails, WCAG 2.2 AA goal. NPP is not drafted (client supplies it).
- The coming-soon catch-all is now a plain 404 route (all its pages exist). It sets the 404 tab title
  "Page not found" + noindex (fixes the known title gap from Session 3).
- Migration `20261020_190656_legal_pages`.

**Verified**
- typecheck + `pnpm build` pass; the 4 pages prerender. Seed run twice (second run changes nothing).
- Production server: each page 200, one h1, no unfilled `{tokens}`; `/hipaa-notice` shows the fallback box;
  unknown URL → 404 with title "Page not found" and noindex.
- Chrome at 375px: `/privacy` no overflow, headings/lists/link render. Also did the Session 7 follow-up:
  `/prescriptions` and `/prescriptions/refill` at 375px: no overflow, every field labelled, one h1.

**For the client / attorney to decide** (written into the drafts, easy to change in the admin)
- Returns: "no returns of medicines/health products; damaged or wrong items reported within 7 days are
  replaced or refunded".
- Minimum age 18 to order online; accessibility feedback answered within 2 business days.
- Notice of Privacy Practices text (client supplies; paste into the NPP tab).

**User action**
- After Netlify deploys this commit: `DATABASE_URL='<Neon URL>' pnpm seed:legal` to load the drafts on the preview.

**Next**
- Phase 6: accessibility pass, then SEO (sitemap, robots, OG image, Pharmacy JSON-LD), then performance.

---

## 2026-10-19 — Session 7: Phase 5 prescription requests

**Done**
- `prescription-requests` collection (admin group **Patients**): request # (from 1001), type
  **new/refill**, status new → reviewed → approved / declined, staff-only doctor notes, patient (name,
  DOB as `YYYY-MM-DD` text, phone, optional email), request (medication, reason/symptoms, current meds,
  allergies; refills: Rx number + optional medication), pickup/delivery + address, consent timestamp.
  All access is admin-only; the public never uses the API (the form's server action uses the local API).
- `/prescriptions` (new request) and `/prescriptions/refill` (shorter form) share `RequestForm`:
  red "Not for emergencies, call 911" banner, required consent checkbox (accurate info, OK to contact,
  no guarantee, not for emergencies, link to /privacy), honeypot, field-level errors, pickup/delivery.
  Success redirects to `/prescriptions/submitted?type=…&ref=N` (noindex). Removed `prescriptions`
  from the coming-soon list.
- Doctor email (`src/lib/email/prescriptions.ts`): subject "New prescription request #N" + admin link
  only, no name or health details. Goes to Shop Settings → Notifications → "Send prescription and refill
  request emails to" (new field), else the new-order address, else the pharmacy email.
- Server action never logs submitted values (DB errors can echo them); only the error type.
- Maintenance job now deletes requests older than 90 days first (`requestsDeleted` in the result).
- Migration `20261019_205309_prescription_requests`.

**Verified**
- typecheck + `pnpm build` pass. Public REST read/create → 403.
- Form posted without JS: invalid input shows every field error; valid new request and refill saved
  (#1002, #1001) and redirect to the success page; honeypot saves nothing.
- Email test: correct subject/link, no name/medication/DOB in subject, HTML or text.
- Maintenance: a request backdated 91 days was deleted, one at 89 days kept.
- Not checked in a real browser this session (DevTools browser profile was locked): do a visual check
  of both forms at desktop and 375px next session.

**Notes**
- Two synthetic requests (#1001, #1002) are in the local DB to look at in /admin.
- Patients aren't emailed when the status changes; staff call them. Add later if the client wants it.

**Next**
- Booking item (needs the client's decision: their EHR/pharmacy portal link or Doxy.me), then Phase 6.

---

## 2026-10-19 — Session 6: Phase 4 blog

**Done**
- Home page shows real featured products (Phase 3 finished; see Session 5).
- `posts` collection (admin group **Blog**): title, excerpt (≤220, used as meta description), optional
  cover image, rich-text content, slug, status **draft/published** (default draft), publish date (set
  automatically on first publish), category, author (plain text, e.g. "Our pharmacy team"; Users only
  have an email). Visitors can read published posts only (access rule + `overrideAccess: false`).
- `blog-categories` collection (name, slug, order). The blog filter only lists topics with a published post.
- `src/lib/posts.ts` (cached, tag `posts`; saves/deletes revalidate `/`, `/blog`, `/blog/<slug>`, and the
  old slug on rename). `formatPostDate` uses Chicago time.
- `/blog`: topic pills, 9 per page, Newer/Older pagination, empty state. `/blog/[slug]`: breadcrumb,
  h1, author + date, cover, rich text, "general information, not medical advice … call 911" box,
  "More articles"; OG type `article`. Removed `blog` from the coming-soon list.
- Home `BlogTeaser`: 3 latest published posts; hidden when there are none (no more sample posts).
- Starter content: `pnpm seed:posts` (`src/scripts/seed-posts.ts`) creates 3 categories and 4 **draft**
  posts (prescription label, storing/disposing medicines, choosing an OTC pain reliever, flu vaccine).
  Skips anything that already exists. Wording sticks to label/CDC/FDA guidance and makes no claims about
  which services the pharmacy offers (the flu post says "call us to check vaccine availability").
- Migration `20261019_195808_blog`.

**Verified**
- typecheck + `pnpm build` pass. Seed run twice (second run creates nothing).
- As drafts: `/blog` shows "coming soon", post URL 404, public API returns 0, no home blog section.
- Published via API with a temp admin: publish date filled in; index, topic filter, post page (headings,
  lists, bold, date, disclaimer, more articles, metadata), home teaser all correct; one h1 per page.
  Screenshots at 1280px and 500px (headless Chrome can't go narrower) show no overflow.
  Then set back to draft (post 404 again right away) and the temp admin deleted. Local posts are drafts.

**User/client action**
- Load the drafts on the live preview: `DATABASE_URL='<Neon URL from .env NEON_DATABASE_URL>' pnpm seed:posts`
  (after Netlify has deployed this commit, which creates the tables).
- Client (doctor) reviews each draft for medical accuracy, edits the author name if wanted, then publishes.

**Next**
- Phase 5: prescription requests.

---

## 2026-10-19 — Session 5: Phase 3 shop + order emails (in progress)

**Done (commits dab6048 → this one)**
- `products` + `categories` collections (OTC-only enforced), shop page (grid, category filter, search),
  product detail pages, localStorage cart + cart page + header count.
- Checkout → `orders` collection (items/totals snapshot, order #1001+, secret `accessToken` for the
  customer's `/order/<token>` page, stock reserved on order and returned on cancel).
- **Shop Settings** global: delivery options/fees and payment instructions per method (placeholders
  `{orderNumber}`, `{total}`, `{name}`; `TODO` handles to replace before launch).
- Resend emails (`src/lib/email/`): new order → staff + customer; without `RESEND_API_KEY` Payload
  only logs the subject to the server console.
- Order sidebar button **Send payment instructions** (`src/components/admin/SendPaymentInstructions.tsx`
  → `POST /api/orders/:id/send-payment-instructions`, admins only, only while awaiting payment).
  Customer is emailed when status changes to Paid, Shipped/ready for pickup, or Cancelled.
- `paymentInstructionsSentAt` / `reminderSentAt` can only be set by the server
  (`req.context.setEmailTimestamps`); a stale admin form can't wipe them. The 48h reminder job must
  pass that context too.

**Verified**
- typecheck + `pnpm build` pass. Via API with a temp admin: send (200), not logged in (401),
  stale save → Paid keeps the sent timestamp, send after Paid (400), Shipped; all 5 emails fired.
  In the browser: confirm dialog → toast → button becomes "Resend…" with timestamp, no console errors.
  Test orders + temp admin deleted. (Local Shop Settings row now saved with the default values.)

- **Scheduled maintenance:** `netlify/functions/maintenance.ts` runs every 6 hours (`0 */6 * * *`) and POSTs to
  `/api/cron/maintenance` (Payload root endpoint, `src/endpoints/cron.ts`, needs `Authorization: Bearer $CRON_SECRET`).
  Logic in `src/lib/maintenance.ts`: reminder 48h after payment instructions were sent (once);
  cancel 7 days after the order was placed (returns stock, emails the customer). Orders whose instructions
  were never sent are left for staff. Phase 5's 90-day prescription cleanup should go in the same function.
  Tested locally with six backdated orders (each case correct; second run changes nothing; 401 without secret).

**User action:** set Netlify env var `CRON_SECRET` (any long random string, `openssl rand -hex 32`), all scopes,
then redeploy. Until then the function logs "URL or CRON_SECRET is not set" and does nothing.

- **Product CSV import** (Products list → "Import from CSV"): for the client's old WordPress/WooCommerce
  shop (Products → Export). Preview table first (nothing saved), per-row checkboxes, then imports one
  product per request (Netlify time limits) with a progress bar.
  - `src/lib/product-import/parse.ts`: pure CSV → products (WooCommerce columns + simple aliases like
    name/price/quantity/image). Variations become separate products and inherit parent details;
    variable parents, grouped, external, no-price rows can't be imported. Sale price ignored (regular used).
    Rows mentioning "Rx"/"prescription" are unticked by default. Admin must tick an OTC confirmation
    (server enforces it too).
  - `src/lib/product-import/commit.ts`: matches existing products by SKU, else by name/slug
    (skip or update, admin's choice); creates missing categories (most specific part of the first
    category); downloads images (public http(s) only, 10 MB, 10 s) and reuses them on re-import via the
    new `media.sourceUrl` field; HTML descriptions → rich text with Payload's `convertHTMLToLexical` + jsdom.
  - Migration `20261019_194234_media_source_url`. New deps: papaparse, jsdom (`serverExternalPackages`).
  - Tested with a sample WooCommerce export: preview, 3 API runs (create / skip / update, no duplicate
    images), full run through the admin UI, rich text renders on the product page. Test data removed.
  - **Limit until Phase 7:** on Netlify, image downloads will fail (no persistent disk until R2 storage is
    added); products still import, with an "image could not be saved" note. Import images after R2,
    or run the import locally against Neon.

- **Home page featured products** now come from the shop: up to 4 products ticked "Featured"
  (sorted by name); if none are ticked, the 4 newest; if the shop is empty (or the DB is unreachable
  during a build) the section is hidden. Uses the shop's `ProductCard`. Phase 3 complete.

**Next**
- Phase 4: Blog.

---

## 2026-10-05 — Session 4: Site Settings global (Phase 2 complete)

**Done**
- `src/globals/SiteSettings.ts`: admin → Settings → **Site Settings**, three tabs (Business; Contact & hours;
  License & doctor). Fields prefilled from the defaults in `src/lib/site.ts`.
- `src/lib/settings.ts` → `getSiteSettings()`: reads the global through `unstable_cache` (tag `site-settings`),
  fills empty fields from the defaults, and falls back to the defaults if the DB is unreachable (never throws).
- Saving the global calls `revalidateTag('site-settings', { expire: 0 })` + `revalidatePath('/', 'layout')`,
  so the static pages update on the next visit, no redeploy.
- Every page/component now uses `getSiteSettings()`; Header (client) and Logo get values as props.
  `site.ts` now holds types, defaults, `withDerived()` (tel link, full address, license labels), and `nav`.
- License stored as raw values (number, pharmacist name); the code adds "IL Pharmacy License #" and
  "Pharmacist-in-charge:".
- Migration `20261005_220716_site_settings` (tables `site_settings`, `site_settings_hours`).
- **Migrations moved to the build:** `prodMigrations` made `next build` hang locally (Payload asks an
  interactive question when the DB was created by dev push). Now Netlify runs `pnpm run ci`
  (= `payload migrate && pnpm build`). Note `pnpm ci` is a reserved pnpm command; use `pnpm run ci`.
- CLAUDE.md conventions updated (settings, migrations). `next dev` adds a Next.js agent-rules block to
  CLAUDE.md; it's committed on purpose.

**Verified**
- typecheck + `pnpm build` pass; pages still prerender as static.
- Dev **and** a local production build (`pnpm start`): edited phone + license number via the API with a
  temporary admin → home, Contact, About showed the new values (incl. `tel:` link) without a rebuild;
  restored the defaults; temp admin deleted. Local `users` table is empty again.

**Next**
- Phase 3: shop + pay-by-email orders.

---

## 2026-10-05 — Session 3b: Neon connected to the live preview

**Done**
- Neon free-tier Postgres (project `pharmacy-site`, AWS US East) created by the user, under their own
  account for now. **Move it to the client's account at launch (Phase 7).**
- Netlify env var `DATABASE_URL` = Neon string (set by the user). Local `.env` has `NEON_DATABASE_URL`
  (the Neon string) next to the local `DATABASE_URL`; documented in `.env.example`.
- First migration `src/migrations/20261005_172544_initial.ts` (all current tables), applied to Neon.
- ~~`prodMigrations` (apply migrations on startup)~~ replaced in Session 4 by a build step; see below.
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
