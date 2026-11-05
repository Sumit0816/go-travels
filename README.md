# Go Travels

Website and admin CMS for Go Travels, a Ranchi-based tour company. Built with Next.js 16 and Payload CMS 3 on PostgreSQL. There's no payment gateway: every booking and enquiry is saved, then sent to the team on WhatsApp.

- Implementation plan: [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)
- UI design: <https://claude.ai/artifact/2dPVxKfThYo5Y6svekFmBs>
- Design system: <https://claude.ai/artifact/QEWzF4MWPbAdDPPAaDZT4W>

## Getting started

Requirements: Node 22.23+ or 24.22+, npm.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your env file and set `PAYLOAD_SECRET` to a long random string:

   ```bash
   cp .env.example .env
   ```

3. Start PostgreSQL. With Docker (port 5432):

   ```bash
   docker compose up -d
   ```

   Without Docker, run an embedded Postgres in its own terminal (port 5433). Then set `DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5433/go_travels` in `.env`:

   ```bash
   npm run db:local
   ```

4. Optional: load the demo content from the design (packages, bookings, blog, users and settings). Set `SEED_USER_PASSWORD` in `.env` first:

   ```bash
   npm run seed
   ```

   Restart `npm run dev` afterwards if it was running (the site caches CMS data). It creates four demo users, one per role, with that password: `rajesh@gotravels.in` (Owner), `priya@gotravels.in` (Manager), `rohit@gotravels.in` (Sales) and `pooja@gotravels.in` (Content Editor). Re-running it resets all content but never deletes other accounts.

5. Start the app:

   ```bash
   npm run dev
   ```

   - Website: <http://localhost:3000>
   - Admin CMS: <http://localhost:3000/admin> (without the seed, the first visit asks you to create the first user, who becomes the Owner)
   - Component library (dev only): <http://localhost:3000/dev/ui>

## Scripts

| Command                                                 | What it does                                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `npm run dev`                                           | Dev server                                                                            |
| `npm run build` / `npm start`                           | Production build / serve                                                              |
| `npm run db:local`                                      | Embedded PostgreSQL on port 5433 (no Docker)                                          |
| `npm run seed`                                          | Reset content and load the demo data from the design                                  |
| `npm run tokens`                                        | Regenerate `src/styles/tokens.css` from `src/design/tokens.json`                      |
| `npm run lint` / `npm run typecheck` / `npm run format` | Code quality                                                                          |
| `npm test`                                              | Unit tests (no database needed)                                                       |
| `npm run test:int`                                      | Integration tests against the database                                                |
| `npm run test:e2e`                                      | Playwright tests, desktop + mobile (run `npx playwright install chromium` once first) |
| `npm run generate:types`                                | Regenerate `src/payload-types.ts` after changing collections                          |
| `npm run payload -- migrate:create <name>`              | Create a database migration after changing collections (commit it)                    |

## Project layout

```
src/
  app/(site)/          public website (layout, pages, /dev/ui)
  app/(payload)/       Payload admin + API routes (generated)
  access/              roles and the permission matrix (Owner, Manager, Sales, Content Editor)
  collections/         Payload collections (packages, bookings, enquiries, posts, …)
  globals/             site settings, WhatsApp settings, homepage, menus
  blocks/              page and blog content blocks
  fields/              shared fields (SEO, status, links) and cache revalidation hooks
  migrations/          production database migrations (generated)
  components/ui/       design-system components (Button, Chip, TextField, PackageCard, …)
  design/              tokens.json (from the design system) + token generator
  lib/                 helpers: ₹ formatting, request IDs, encryption, rich text, option lists
  styles/              globals.css, tokens.css (generated), components.css
public/brand/          logos and placeholder illustrations from the design system
scripts/               local DB, token build, demo seed
tests/unit|int|e2e     Vitest + Playwright
```

## Design tokens

Colours, type, radii, shadows and sizes come from the design system's `tokens.json`. After updating `src/design/tokens.json`, run `npm run tokens`. A unit test fails if `tokens.css` is out of date. In Tailwind, use them as `bg-ocean-700`, `text-ink-500`, `rounded-lg`, `shadow-card`, `text-h4` and `max-w-site`. The responsive heading utilities are `heading-display`, `heading-1`, `heading-2`, `heading-3`, `eyebrow` and `container-site`.

## Database changes

In development, Payload updates the database schema automatically when the app starts. Production only applies committed migrations, on start. After changing a collection or global:

1. Run `npm run generate:types`.
2. Run `npm run payload -- migrate:create <short-name>`.
3. Commit the new files in `src/migrations/`.

CI checks that every migration applies cleanly to an empty database.

## Roles

| Module                | Owner | Manager | Sales       | Content Editor |
| --------------------- | ----- | ------- | ----------- | -------------- |
| Bookings              | Full  | Full    | Edit status | None           |
| Enquiries             | Full  | Full    | Assigned    | None           |
| Packages              | Full  | Full    | View        | Full           |
| Homepage & slider     | Full  | Full    | None        | Full           |
| Blogs & pages         | Full  | Full    | None        | Full           |
| Testimonials          | Full  | Full    | View        | Full           |
| WhatsApp integration  | Full  | View    | None        | None           |
| Users & site settings | Full  | None    | None        | None           |

The table lives in `src/access/roles.ts`, and `tests/unit/access.test.ts` checks every cell. The first account ever created becomes the Owner.

## WhatsApp alerts

Bookings and enquiries are saved first, then sent to every recipient in **Settings › WhatsApp Integration** (plus a copy to the customer, if that's switched on). Gupshup and Interakt are supported; the code is in `src/lib/whatsapp/`.

- **Without an API key**, development and CI print each message to the server log instead of sending it. In production, a missing key counts as a failed send.
- **Retries:** a failed send is tried again after 1, 5 and 15 minutes. Something must call `GET /api/whatsapp/process` every minute with `Authorization: Bearer $CRON_SECRET`: `vercel.json` sets this up on Vercel (per-minute crons need a paid plan); on a VPS, use a crontab line (see `.env.example`).
- **Fallback email:** once every team alert for a booking or enquiry has failed, the message is emailed to the fallback address. Set the `SMTP_*` variables, or emails only go to the server log.
- **Delivery receipts:** set the webhook URL shown on the "Test & delivery log" tab in the provider's dashboard, so statuses move on to Delivered and Read.
- **Templates:** each approved Meta template takes its values in the order listed on the "Message templates" tab. For Gupshup, the template name is the template ID.
