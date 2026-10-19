# Build Plan

Work top to bottom. Tick items (`[x]`) as they're finished and committed.
Each phase ends with `pnpm build` passing and a quick check in the browser (desktop + phone width).

## Phase 1 — Setup, brand, home page
- [x] Project scaffold: Next.js 16 + Payload 3 + Postgres adapter
- [x] Local Postgres database `pharmacy_site`, `.env` / `.env.example`
- [x] Tailwind v4 + brand tokens (white/blue clinical palette, Inter + Plus Jakarta Sans)
- [x] `src/lib/site.ts` with placeholder business details
- [x] Header (desktop + mobile menu), Footer (hours, address, license + IDFPR verify link)
- [x] Home page: hero, services, how prescriptions work, featured products (samples), about teaser,
      blog teaser (samples), visit us
- [x] Admin dashboard loads at `/admin` (schema created in local DB, "create first user" screen works)
- [ ] **You:** create your own admin account at `/admin` (choose your own password)
- [x] `pnpm build` passes, `pnpm typecheck` passes
- [ ] Fix `pnpm lint` (template's `eslint.config.mjs` uses FlatCompat, which breaks with
      eslint-config-next 16; replace with native imports, see progress.md)
- [x] Initial git commit

## Phase 2 — Core pages
- [x] About page (story, doctor bio, team, values)
- [x] Services page (each service with detail; vaccinations, consultations, delivery area)
- [x] Contact page: form (name, email, phone, message) with a warning not to include medical details;
      map link, hours, phone. Submissions saved in Payload `contact-messages` + email to admin (Phase 3 email)
- [x] Contact form: email the admin on each new message (do with Resend in Phase 3)
- [x] FAQ page (accordion; insurance, transfers, delivery, ordering, payment)
- [x] Custom 404 page
- [x] Move business details from `src/lib/site.ts` into a Payload **Site Settings** global so the client can edit them

## Phase 3 — Shop + pay-by-email orders
- [x] Collections: `products` (name, slug, description, price, images, category, stock, `isOTC` must be true,
      featured flag), `categories`
- [x] Shop page (grid, category filter, search), product detail page
- [x] Cart (client-side, persisted in localStorage), cart page
- [x] Checkout form: contact, shipping/pickup, preferred payment method
- [x] `orders` collection: items snapshot, totals, status
      (`awaiting-payment` → `paid` → `shipped` → `delivered` / `cancelled`), order number
- [x] Global **Payment Instructions**: text per payment method (PayPal, Venmo, Cash App, Zelle, Apple Pay, invoice)
      — built as the "Payment methods" tab of the **Shop Settings** global (also holds delivery options/fees)
- [x] Resend integration: new-order email to admin, order-received email to customer
- [x] Admin button "Send payment instructions" + status-change emails to customer
- [ ] Scheduled job: reminder at 48h unpaid, auto-cancel at 7 days (Netlify scheduled function)
- [ ] Replace home page sample products with real `featured` products

## Phase 4 — Blog
- [ ] Collections: `posts` (title, slug, excerpt, cover image, rich text body, category, author, publish date, status)
- [ ] Blog index (pagination, category filter) and post page
- [ ] Replace home page sample posts with latest posts
- [ ] Draft 3–5 starter posts (client reviews for medical accuracy)

## Phase 5 — Prescription requests
- [ ] `prescription-requests` collection: name, DOB, phone, email, medication requested, reason/symptoms,
      current meds, allergies, pickup/delivery, consent; status (new → reviewed → approved / declined); doctor notes
- [ ] Access control: only logged-in admins can read; public can only create
- [ ] Form page with consent checkbox and "Not for emergencies — call 911" banner, success page
- [ ] Notification email to doctor with **no health details**, only request # + admin link
- [ ] Auto-delete requests older than 90 days (scheduled function)
- [ ] Refill request form (simpler: name, DOB, phone, Rx number) — same handling
- [ ] Booking: link to client's existing portal or Doxy.me (decision pending)

## Phase 6 — Legal, accessibility, SEO
- [ ] Privacy Policy, Terms of Use, Accessibility statement (drafts; client's attorney reviews)
- [ ] Notice of Privacy Practices page (text supplied by client)
- [ ] Accessibility pass (keyboard, screen reader labels, contrast, Lighthouse a11y ≥ 95)
- [ ] SEO: metadata on every page, `sitemap.xml`, `robots.txt`, Open Graph image,
      LocalBusiness/Pharmacy JSON-LD schema
- [ ] Performance pass (Lighthouse ≥ 90 on mobile)

## Phase 7 — Deploy + handoff
- [ ] Accounts in the client's name: GitHub (private repo), Neon, Netlify, Resend, Cloudflare
- [ ] Cloudflare R2 storage adapter for media uploads
- [ ] Deploy to Netlify, set env vars, run migrations against Neon
- [ ] Register domain (Cloudflare Registrar), connect to Netlify, HTTPS
- [ ] Business email (Zoho Mail free or Cloudflare Email Routing → Gmail); verify domain in Resend
- [ ] Replace every `TODO` placeholder in `src/lib/site.ts` / Site Settings with real details
- [ ] End-to-end test: place an order, submit a prescription request, receive all emails
- [ ] Google Business Profile + Search Console
- [ ] Handoff: client admin account, short video (add product, write post, process order, review request)
