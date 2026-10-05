# Pharmacy Website — Project Guide for Claude Code

Website for an Illinois pharmacy run by a physician. Built for a client on a fixed $2,000 budget.
Public site + online shop + blog + prescription request form + admin dashboard.

**Start every session by reading `docs/progress.md`, then work on the next unchecked item in
`docs/build-plan.md`.** At the end of a session, update `docs/progress.md` and tick finished items.

## Decisions already made — do not change without the user's explicit OK

1. **Free tiers only.** The domain is the only paid item. No paid services, plugins, or APIs.
2. **No Stripe. No Supabase.** No online card processing at all.
3. **Orders are pay-by-email (manual payment):**
   cart → checkout form (contact, shipping, *preferred* payment method) → order saved as
   `awaiting-payment` → admin + customer get emails → admin clicks "Send payment instructions"
   (pre-saved per method) → admin marks Paid → Shipped. Unpaid orders: reminder at 48h, cancel at 7 days.
   Payment methods offered: PayPal, Venmo, Cash App, Zelle, Apple Pay, card (via invoice).
4. **Only OTC (over-the-counter) products can be added to the cart.** Prescription medicines are
   never sold through the cart; they go through the prescription request form.
5. **Prescription request form is "simple form, doctor decides"** — but the notification email
   must contain **no health details**: only "New prescription request #N — view it here" + admin link.
   Full details live in the admin dashboard only. Requests auto-delete after 90 days.
   Required consent checkbox + "Not for emergencies — call 911" banner.
6. **Booking:** to be decided — either the client's existing EHR/pharmacy-software portal (link out)
   or Doxy.me free for video. Do not build a custom booking system.
7. Never claim the site is "HIPAA compliant" in copy. Client is responsible for compliance.

## Stack

| Concern | Tool |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| CMS / admin | Payload CMS 3 (runs inside the Next app, admin at `/admin`) |
| Database | Postgres — local Postgres 16 in dev, **Neon** free tier in production |
| Styling | Tailwind CSS v4 (tokens in `src/app/(frontend)/styles.css`) |
| Icons | lucide-react |
| Email | Resend (free tier) — added in Phase 3 |
| Image storage (prod) | Cloudflare R2 (free tier) — added in Phase 7 |
| Hosting | **Netlify** free plan (Vercel Hobby forbids commercial use — don't use it) |

## Commands

```bash
pnpm dev                 # start site at http://localhost:3000 (admin: /admin)
pnpm build               # production build — run before calling a phase done
pnpm lint                # eslint
pnpm typecheck           # tsc --noEmit
pnpm generate:types      # regenerate src/payload-types.ts after changing collections
pnpm generate:importmap  # after adding custom admin components
```

Local DB: `postgres://<mac-user>@localhost:5432/pharmacy_site` (already in `.env`).
Secrets live in `.env` (git-ignored). Document every new variable in `.env.example`.

## Project layout

```
src/
  app/(frontend)/        public site pages (own root layout, Tailwind)
  app/(payload)/         Payload admin + API routes — generated, don't hand-edit
  collections/           Payload collections (Users, Media, later Products, Posts, Orders, …)
  components/layout/     Header, Footer, Logo
  components/home/       Home page sections
  lib/site.ts            ALL business details (name, phone, address, hours, license, doctor)
  payload.config.ts      Payload config
docs/                    scope, build plan, progress log
```

## Conventions

- Business details (name, phone, hours, license #) come from `src/lib/site.ts` — never hard-code them.
  Values marked `TODO` are placeholders to replace before launch.
- Use the theme tokens (`text-ink`, `bg-brand-600`, `border-line`, …) and the `.btn`, `.btn-primary`,
  `.btn-secondary`, `.container-page`, `.eyebrow` classes; don't introduce new ad-hoc colors.
- Server components by default; add `'use client'` only when needed (state, effects, handlers).
- Accessibility is required (US healthcare sites get ADA lawsuits): semantic HTML, one `h1` per page,
  labelled form fields, visible focus, alt text, `aria-hidden` on decorative icons, AA contrast.
- Every public page exports `metadata` (title + description).
- No fake reviews/testimonials, no invented credentials or medical claims.
- Commit after each finished checklist item with a clear message.
