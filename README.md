# Pharmacy Website

Next.js + Payload CMS site for an Illinois pharmacy: storefront (pay-by-email orders), blog,
prescription request form, and admin dashboard.

## Run locally

```bash
pnpm install
cp .env.example .env   # then fill in DATABASE_URL and PAYLOAD_SECRET
pnpm dev               # http://localhost:3000 — admin at /admin
```

## Docs
- `CLAUDE.md`: project rules and decisions (read by Claude Code automatically)
- `docs/scope.md`: what's included in the project
- `docs/build-plan.md`: phase-by-phase checklist
- `docs/progress.md`: session log

## Continue with Claude Code
Open this folder in Claude Code and say:
> Read docs/progress.md and continue with the next unchecked item in docs/build-plan.md.
