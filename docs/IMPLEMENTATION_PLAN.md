# Go Travels — Implementation Plan

Build Go Travels as **one Next.js app with Payload CMS inside it**, backed by PostgreSQL, with bookings and enquiries delivered to the team on **WhatsApp through an aggregator**. There is no payment gateway.

This plan turns the three sources into ordered, reviewable work. Each milestone below is about one Claude session's worth of work and ends in something you can see running.

| Source                 | Link                                                                               | What it gives us                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| UI design (34 screens) | [Go Travels – Website & CMS UI](https://claude.ai/artifact/2dPVxKfThYo5Y6svekFmBs) | Every website and CMS screen, desktop and mobile, plus states                                         |
| Design system          | [Go Travels design system](https://claude.ai/artifact/QEWzF4MWPbAdDPPAaDZT4W)      | Tokens (colour, type, spacing, radius, shadow, size), 10 components, logos, illustrations, copy rules |
| Tech & build plan      | [Technology & Build Plan](https://claude.ai/artifact/2MPCkj31hSnGr1jttr1pAJ)       | Stack choice, WhatsApp flow, 6 build phases                                                           |

---

## 1. Scope

### 1.1 Public website (desktop + mobile, one responsive codebase)

| Screen (design board)                                    | Route                                         | Notes                                                                                                                                                                                                                                             |
| -------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home (`Main`, `MobileHome`)                              | `/`                                           | Utility bar, header + mega menu, hero slider, search widget, Popular Destinations tabs + package carousel, Categories, Why Choose Us, custom-trip CTA band, testimonials, footer, floating "Find Your Perfect Trip" tab, floating WhatsApp button |
| Mega menu (`MegaMenu`), Mobile drawer (`MobileMenu`)     | —                                             | Driven by the CMS Main menu                                                                                                                                                                                                                       |
| Tour listing (`Listing`, `MobileListing`)                | `/tours/[category]` and `/tours?…` (search)   | Sub-destination chips, filters (destination with counts, duration 1–3/4–6/7+ N, budget range, theme), sort, pagination, empty state                                                                                                               |
| Destination (`Destination`)                              | `/destinations/[slug]`                        | Destination hero, intro, its packages, blog links                                                                                                                                                                                                 |
| Package detail (`PackageDetail`, `MobilePackage`)        | `/packages/[slug]`                            | Gallery, tabs (Overview, Itinerary, Inclusions, Hotels, Policies, FAQs), hotel-category pricing, sticky booking sidebar with estimate, Share, Download PDF, "Ask on WhatsApp"                                                                     |
| Booking flow (`Booking`, `MobileBooking`)                | `/packages/[slug]/book`                       | 4-step stepper: Trip details → Traveller details → Review → Sent to WhatsApp                                                                                                                                                                      |
| Find Your Perfect Trip (`EnquiryModal`, `MobileEnquiry`) | modal on every page, `/plan-my-trip` fallback | Trip type chips, destination, month, travellers, budget, name, WhatsApp number                                                                                                                                                                    |
| About (`About`)                                          | `/about`                                      | CMS page                                                                                                                                                                                                                                          |
| Contact (`Contact`, `MobileContact`)                     | `/contact`                                    | Contact form → enquiry, map embed, details from Site Settings                                                                                                                                                                                     |
| Blog list / post (`Blog`, `BlogPost`)                    | `/blog`, `/blog/[slug]`                       | Categories, featured post, embedded package cards in posts                                                                                                                                                                                        |
| Privacy / Terms (`Legal`)                                | `/privacy`, `/terms`                          | CMS pages                                                                                                                                                                                                                                         |
| States (`States`)                                        | —                                             | Empty search, WhatsApp-send failure, loading skeletons, field validation, 404 (`not-found.tsx`)                                                                                                                                                   |

### 1.2 Admin CMS (`/admin`)

Sidebar and modules exactly as the design: **Dashboard, Bookings, Enquiries · Packages, Destinations/Categories/Menus, Homepage & Slider, Testimonials, Blogs & Pages, Media Library · WhatsApp Integration, Users & Roles, Site Settings & SEO**, plus Login.

### 1.3 Out of scope (v1)

Online payments, customer accounts/login, multi-language, live chat. All can be added later without reworking the data model.

---

## 2. Technology

| Layer              | Choice                                                                                                         | Version to pin                                                                    |
| ------------------ | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Framework          | Next.js (App Router, React Server Components) + TypeScript                                                     | Next 16.4.2, React 19.2                                                           |
| CMS / backend      | Payload CMS 3 (runs inside the Next app, Local API in server components)                                       | Payload 3.91.0 (`payload`, `@payloadcms/next`, `db-postgres`, `richtext-lexical`) |
| Database           | PostgreSQL (Neon or Supabase; local via Docker)                                                                | Postgres 16                                                                       |
| Styling            | Tailwind CSS with design-system tokens as the theme                                                            | Tailwind 4.3.3 (site only; admin keeps Payload styles)                            |
| Forms / validation | React Hook Form + Zod (shared schemas client + server)                                                         |                                                                                   |
| Media storage      | Payload upload + `@payloadcms/storage-s3` (Cloudflare R2 / S3) or Cloudinary adapter; `sharp` for WebP + sizes |                                                                                   |
| WhatsApp           | Aggregator adapter (Gupshup default; Interakt, WATI, AiSensy, MSG91, Twilio selectable)                        |                                                                                   |
| Email fallback     | Resend or SMTP via `@payloadcms/email-nodemailer`                                                              |                                                                                   |
| Spam protection    | Honeypot + rate limit per IP/phone; optional Cloudflare Turnstile                                              |                                                                                   |
| Testing            | Vitest (unit), Playwright (e2e, mobile + desktop viewports), axe for a11y                                      |                                                                                   |
| CI/CD              | GitHub Actions (lint, typecheck, test, build) → Vercel (or Indian VPS with Docker)                             |                                                                                   |
| Monitoring         | Sentry (errors), Vercel Analytics / GA4 (ID from Site Settings)                                                |                                                                                   |

**Decision to confirm — CMS admin look.** Payload ships its own admin UI. Two options:

1. **Payload admin, themed + custom views (recommended).** Brand colours/fonts/logo applied via Payload's CSS variables and custom `graphics`; standard collection edit screens for Packages, Posts, Media, etc.; **custom views** for the screens the default UI can't match: Dashboard/Bookings table with KPIs, Enquiries inbox, WhatsApp Integration, Homepage section ordering, Role-permission matrix. ~70% of the design fidelity at ~40% of the effort.
2. **Fully custom admin** built from the CMS design screens, using Payload only as API/auth/data. Pixel-match to the design, roughly doubles CMS build time.

The plan below assumes option 1. Switching to option 2 only changes Phase 3 and Phase 6.

---

## 3. Architecture

```
Browser ──► Next.js (Vercel / VPS)
             ├─ app/(site)/…        public pages (RSC, ISR + on-demand revalidation)
             ├─ app/(payload)/admin  Payload admin + custom views
             ├─ app/api/…            Payload REST/GraphQL + custom routes
             │    ├─ POST /api/bookings/request   ─┐
             │    ├─ POST /api/enquiries/request  ─┤─► save to DB ─► enqueue WhatsApp job
             │    └─ POST /api/webhooks/whatsapp  ◄┘   (delivery status from aggregator)
             └─ Payload jobs queue ─► WhatsApp adapter ─► Aggregator API ─► Team phones
                                           └─ on failure ─► retry ×3 ─► email fallback
PostgreSQL ◄── Payload (collections, globals, users, jobs)
S3/R2 or Cloudinary ◄── media uploads (WebP, sizes)
```

**Booking request rule (from the doc):** the request is **saved first**, then sent. If the send fails, the customer still sees the request ID, a `wa.me` chat link prefilled with the ID, and a call button (design `States` board).

**Rendering:** marketing pages are static with ISR; Payload `afterChange` hooks call `revalidatePath`/`revalidateTag` so a CMS publish updates the site within seconds. Listing filters use search params rendered on the server.

---

## 4. Repository layout

```
go-travels/
├─ src/
│  ├─ app/
│  │  ├─ (site)/                 layout with header/footer/floating actions
│  │  │  ├─ page.tsx             Home
│  │  │  ├─ tours/[category]/page.tsx
│  │  │  ├─ tours/page.tsx       search results
│  │  │  ├─ destinations/[slug]/page.tsx
│  │  │  ├─ packages/[slug]/page.tsx
│  │  │  ├─ packages/[slug]/book/page.tsx
│  │  │  ├─ blog/… about/ contact/ privacy/ terms/ plan-my-trip/
│  │  │  └─ not-found.tsx
│  │  ├─ (payload)/admin/…       generated by Payload
│  │  ├─ api/bookings/request/route.ts
│  │  ├─ api/enquiries/request/route.ts
│  │  ├─ api/webhooks/whatsapp/[provider]/route.ts
│  │  ├─ sitemap.ts  robots.ts
│  ├─ collections/               Payload collection configs
│  ├─ globals/                   SiteSettings, WhatsAppSettings, Homepage, Menus
│  ├─ access/                    role helpers (isOwner, canEditBookings…)
│  ├─ hooks/                     revalidate, generateRequestId, notifyWhatsApp
│  ├─ jobs/                      sendWhatsApp, retryFailed
│  ├─ lib/whatsapp/              adapter interface + gupshup.ts, interakt.ts, wati.ts, aisensy.ts, msg91.ts, twilio.ts
│  ├─ lib/format.ts              ₹ Indian grouping, "3N / 4D", dates
│  ├─ lib/pricing.ts             estimate = adults×price + children×price×child% (+ rooms rule)
│  ├─ components/ui/             design-system components (Button, Chip, TextField, StatusBadge, …)
│  ├─ components/site/           Header, MegaMenu, MobileDrawer, Footer, PackageCard, SearchWidget, BookingStepper, WhatsAppMessage…
│  ├─ components/admin/          custom Payload views
│  ├─ styles/tokens.css          generated from design-system tokens.json
│  └─ payload.config.ts
├─ public/brand/                 logo SVGs, favicon, illustrations
├─ scripts/seed.ts               demo data matching the design
├─ tests/unit  tests/e2e
├─ docker-compose.yml            local Postgres
├─ .env.example
└─ .github/workflows/ci.yml
```

---

## 5. Data model (Payload)

Field lists come straight from the CMS design screens.

### 5.1 Collections

| Collection         | Key fields                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Used by                                |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| **users** (auth)   | name, email, phone, role (`owner` \| `manager` \| `sales` \| `contentEditor`), whatsappAlerts (`primary` \| `yes` \| `assignedOnly` \| `no`), status (invited/active), lastActive                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Users & Roles                          |
| **packages**       | title, slug, tourCode (e.g. `GT-GOA-04`), destination → destinations, categories → categories[], durationNights, durationDays, pickup, highlights {stay, meals, transport}, themes[] (Beach, Family, Couples, Honeymoon, Adventure, Luxury, Value), overview (rich text), gallery → media[] (first = cover), itinerary[] {day, title, text}, inclusions[], exclusions[], hotelOptions[] {category: standard3\|deluxe4\|luxury5, price, strikePrice, hotelName, isPopular}, childPricePercent, policies (rich text), faqs[] {q, a}, addOns[] {name, price?}, badge (none/bestseller/new/limitedOffer), showInPopular, featureOnSlider, status (draft/published/archived — Payload drafts + custom archived), seo {metaTitle, metaDescription, ogImage} | Listing, Package detail, Booking, Home |
| **destinations**   | name, slug, region, thumbnail, hero image, intro, tone (dest-coast…dest-mountain fallback), hasPage, seo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Destination page, filters, menus       |
| **categories**     | name (Domestic, International, Honeymoon, Jharkhand, Religious, Family, MICE), slug, eyebrow label (INDIA, ABROAD…), subtitle, colour, sub-destinations → destinations[], hero copy                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Home categories, listing               |
| **bookings**       | requestId (`GT-#####`, sequential), package →, packageSnapshot (title, duration), travelDate, departureCity, hotelCategory, rooms, adults, children, addOns[], name, whatsapp, email, city, specialRequests, consent, estimatedTotal, status (`new` \| `contacted` \| `confirmed` \| `cancelled`), whatsappStatus (`queued` \| `delivered` \| `read` \| `failed`), assignedTo → users, internalNotes[], source, ip/userAgent hash                                                                                                                                                                                                                                                                                                                     | Dashboard & Bookings                   |
| **enquiries**      | enquiryId (`EQ-####`), source (`tripFinder` \| `contactForm` \| `askWhatsApp`), tripType, destination text, month, travellers, budget, message, name, whatsapp, email, package → (optional), status (`new` \| `contacted` \| `quoteSent` \| `converted` \| `closed`), assignedTo, internalNotes[] {author, at, text}, whatsappStatus, convertedBooking → bookings                                                                                                                                                                                                                                                                                                                                                                                     | Enquiries inbox                        |
| **testimonials**   | name, trip/package →, rating 1–5, text, source (review link / staff / Google), status (`pending` \| `approved` \| `hidden`), photo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Home testimonials                      |
| **reviewLinks**    | token, phone, package, expiresAt, usedAt                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | "Send review link on WhatsApp"         |
| **posts**          | title, slug, category → postCategories, author → users, cover, content (Lexical with custom blocks: Image, Quote, **Package card**), status (draft/published/scheduled via `publishAt`), featured, seo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Blog                                   |
| **postCategories** | name, slug (Destination guides, Visa & documents, Pilgrimage, Honeymoon, Travel tips)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Blog                                   |
| **pages**          | title, slug (about, contact, privacy, terms), layout blocks (hero, rich text, stats, team, values), seo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | About, Legal                           |
| **slides**         | eyebrow, heading, buttonLabel, linkType (category/package/custom) + target, imageDesktop (1920×720), imageMobile (780×900) with focal point, showFrom, showUntil, active, order                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Home hero                              |
| **media** (upload) | alt (required), folder (Packages, Destinations, Slider, Blog), sizes (thumb, card, hero, og) WebP, max 10 MB                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Media Library                          |
| **messageLog**     | ref (booking/enquiry), recipientLabel, phone, direction, provider, providerMessageId, status, error, attempts, timestamps                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | WhatsApp delivery log                  |

### 5.2 Globals

| Global               | Fields                                                                                                                                                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **siteSettings**     | logo, favicon, siteName, tagline, primary/accent colour, address, phones[], publicWhatsApp, email, workingHours, mapEmbedUrl, social {instagram, facebook, youtube, googleReviews}, seo defaults, gaId, searchConsoleCode, sitemapEnabled        |
| **whatsappSettings** | provider, apiKey (encrypted at rest, never sent to browser), senderNumber, recipients[] {label, phone, primary}, sendCustomerCopy, emailFallback + email, bookingTemplate {name, language, variables mapping}, enquiryTemplate, connectionStatus |
| **homepage**         | sections[] {key, visible} in order (slider, search, popular, categories, whyUs, ctaBand, testimonials), popularTabs → destinations[], whyUs items[], ctaBand copy                                                                                |
| **menus**            | header[], footerQuickLinks[], footerTours[] — nested items {label, type (category/destination/page/package/custom), ref/url, children[]}                                                                                                         |

### 5.3 Roles & permissions (from `CmsUsers`)

| Module                | Owner | Manager | Sales         | Content Editor |
| --------------------- | ----- | ------- | ------------- | -------------- |
| Bookings              | Full  | Full    | Edit status   | None           |
| Enquiries             | Full  | Full    | Assigned only | None           |
| Packages              | Full  | Full    | View          | Full           |
| Homepage & slider     | Full  | Full    | None          | Full           |
| Blogs & pages         | Full  | Full    | None          | Full           |
| Testimonials          | Full  | Full    | View          | Full           |
| WhatsApp integration  | Full  | View    | None          | None           |
| Users & site settings | Full  | None    | None          | None           |

Implemented as Payload `access` functions per collection/global plus field-level access (e.g. Sales can update only `status` and `internalNotes` on bookings; query constraint `assignedTo = me` on enquiries). Unit-test this matrix row by row.

---

## 6. WhatsApp integration

1. **Adapter interface** `sendTemplate({to, template, language, variables}) → {providerMessageId}` and `parseWebhook(req) → {providerMessageId, status, error?}`. One file per provider; Gupshup first (design default), Interakt second.
2. **Template** (Meta "utility" category), variables exactly as the design: `request_id, package_name, duration, travel_date, departure_city, travellers, hotel_category, customer_name, customer_phone, estimated_total, special_requests`. Separate enquiry template and customer-copy template.
3. **Flow:** API route validates (Zod) → rate-limit + honeypot → create booking (status `new`, whatsapp `queued`) → enqueue `sendWhatsApp` job per recipient (+ customer copy if enabled) → respond with request ID immediately.
4. **Job:** call adapter, write `messageLog`, update booking `whatsappStatus`. Retry with backoff ×3; after final failure mark `failed` and send email fallback. Run jobs via Payload's `autoRun` (VPS) or a Vercel Cron hitting `/api/payload-jobs/run` every minute.
5. **Webhook** `/api/webhooks/whatsapp/[provider]` verifies signature/secret, updates `delivered` / `read` / `failed`.
6. **Admin:** "Send test message", "Resend" on failed rows, delivery log panel, recipient list, connection status badge.
7. **Customer UI:** success screen shows request ID + `WhatsAppMessage` preview of exactly what the team received; failure screen shows ID + Try again / Open WhatsApp chat (`https://wa.me/<public number>?text=…ID…`) / Call us.
8. **Security:** API key stored encrypted (AES-GCM with `WHATSAPP_ENC_KEY`), field hidden from API reads, only server code decrypts.

**Lead time:** WhatsApp Business number, Meta Business verification and template approval take days to weeks. Start in week 1, in parallel with Phase 1. Until approved, use the provider's sandbox and a `console` adapter in development.

---

## 7. Design system → code

- Generate `src/styles/tokens.css` (CSS variables) and the Tailwind theme from the design system's `tokens.json`: colours (`ocean-*`, `marigold-*`, `ink-*`, `whatsapp-*`, status, `dest-*`), type scale (display 64 → caption 12, mobile one step down), spacing `space-1…space-18`, radii, shadows, sizes (`touch-min` 44, `control-md` 48, `control-lg` 52, `container` 1280).
- Fonts: Sora (700) + Inter via `next/font/google`.
- Build the design-system components first, each with a small preview page at `/dev/ui` (dev only): **Button** (primary/accent/whatsapp/outline, md/lg), **Chip** (aria-pressed), **TextField/Select** (aria-invalid + text error), **StatusBadge**, **PackageCard**, **SiteHeader**, **BookingStepper**, **WhatsAppMessage**, **KpiCard**, **DataTable**.
- Copy rules enforced in components: `formatINR()` with Indian grouping (`₹1,32,497`), `formatDuration()` → `3N / 4D`, "No payment now. We confirm availability on WhatsApp." beside every booking action, no emoji.
- Logos and illustrations copied from the design system into `public/brand/`; illustrations are the image fallback until real photos are uploaded.
- Accessibility: 4.5:1 contrast, 44px tap targets, real buttons/links/labels, focus-visible rings, `aria-label` on icon buttons, modal focus trap.

---

## 8. Milestones

Each milestone = one branch + one PR, reviewed before the next starts. Estimates assume one developer working with Claude.

### Phase 0 — Accounts & setup (week 1, runs in parallel)

- [ ] Apply for WhatsApp Business number + Meta Business verification
- [ ] Pick aggregator, create account, submit booking, enquiry and customer-copy templates
- [ ] Create Neon/Supabase Postgres, S3/R2 bucket (or Cloudinary), Vercel project, domain
- [ ] Gather real photos, package data, prices, contact details

### Phase 1 — Foundation (≈3 days) · Done ([PR #1](https://github.com/Sumit0816/go-travels/pull/1))

1. Scaffold with `create-payload-app` (blank + Postgres), TypeScript strict, ESLint flat config, Prettier, path aliases.
2. `docker-compose.yml` for local Postgres; `.env.example` (`DATABASE_URI`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SITE_URL`, `S3_*`, `WHATSAPP_ENC_KEY`, `WHATSAPP_WEBHOOK_SECRET`, `EMAIL_*`, `SENTRY_DSN`).
3. Tokens → `tokens.css` + Tailwind theme; fonts; base layout.
4. UI components from §7 with `/dev/ui` preview.
5. GitHub Actions CI: lint, typecheck, unit tests, build.

**Done when:** `npm run dev` serves a styled placeholder home and `/admin` login; CI is green.

### Phase 2 — CMS data model & roles (≈4 days) · Done

1. All collections and globals from §5 with validation, slugs, admin list columns and filters.
2. Access control matrix (§5.3) + unit tests for every cell.
3. Hooks: sequential `GT-#####` / `EQ-####` IDs, slug generation, revalidation on publish, archived status.
4. Media: storage adapter, WebP sizes, alt text required, folders.
5. Admin branding: logo, colours, fonts, sidebar grouping (Overview / Content / Settings) matching the design.
6. `scripts/seed.ts` with the design's demo content (Goa, Dubai, Thailand, Bali, Deoghar, Netarhat packages; categories; destinations; slides; testimonials; posts; 4 users, one per role).

**Done when:** an Owner can create a full package in the admin; each role sees only what the matrix allows; seed fills every screen.

### Phase 3 — Admin custom views (≈4 days)

1. **Dashboard & Bookings:** KPI cards, status tabs (All/New/Contacted/Confirmed/Cancelled), search, table with WhatsApp status badges, inline status select, Resend, CSV export, pagination, sidebar badge for new bookings.
2. **Enquiries inbox:** Open/Mine/Closed list + detail panel, status, assignee, internal notes, Reply on WhatsApp / Call, **Convert to booking**.
3. **Package editor polish:** card preview, hotel-category pricing grid, drag-reorder itinerary and gallery.
4. **Homepage & Slider:** slide list with Live/Scheduled/Hidden, schedule window, focal point; section order + visibility; Popular tabs.
5. **Testimonials:** Pending/Approved/Hidden filters, approve/hide, "Send review link on WhatsApp".
6. **Taxonomy & menus:** categories, destinations table, nested drag-and-drop menu editor.
7. **Packages list:** bulk Publish / Move to draft / Duplicate / Archive, CSV import.

**Done when:** every CMS board in the design has a working equivalent.

### Phase 4 — Public website (≈7 days)

1. Site shell: utility bar, header, **mega menu** (from Menus global), mobile drawer, footer (Site Settings), floating WhatsApp + "Find Your Perfect Trip" tab.
2. **Home** with all sections, ordered/hidden per Homepage global; hero slider respects schedule; search widget → `/tours?…`.
3. **Listing** with server-side filters, counts, sort, pagination, empty state; mobile filter sheet.
4. **Destination** page.
5. **Package detail**: gallery + lightbox, sticky tabs, accordion itinerary, hotel options, live estimate sidebar, Share (Web Share API), **Download PDF** (server-rendered print route), Ask on WhatsApp → enquiry.
6. **About, Contact, Blog list, Blog post** (Lexical renderer incl. package-card block), **Privacy/Terms**.
7. States: loading skeletons, 404, error boundary.
8. SEO: `generateMetadata` from CMS, Open Graph images, JSON-LD (`TravelAgency`, `TouristTrip`, `BlogPosting`, `BreadcrumbList`), `sitemap.ts`, `robots.ts`, canonical URLs.

**Done when:** every website board in the design renders from CMS data at desktop and 390px widths.

### Phase 5 — Booking & enquiry flows + WhatsApp (≈5 days)

1. Shared Zod schemas; booking stepper (4 steps, state kept in URL/session so Back works and refresh doesn't lose data), adults 1–9 / children 0–6, rooms, add-ons, consent checkbox, Indian 10-digit mobile validation.
2. Enquiry modal + `/plan-my-trip` + Contact form + Ask on WhatsApp, all → `enquiries`.
3. API routes with rate limiting, honeypot, optional Turnstile.
4. WhatsApp adapter (Gupshup + Interakt), jobs, retries, email fallback, webhook, message log (§6).
5. WhatsApp Integration admin screen: provider, encrypted key, sender, recipients, customer copy, email fallback, template preview with variables, **Send test message**, delivery log.
6. Success and failure screens exactly as the design.

**Done when:** a booking from a real phone lands on the owner's WhatsApp within seconds, shows Delivered → Read in the dashboard, and a forced failure shows the fallback screen and sends the email.

### Phase 6 — Hardening & launch (≈4 days)

1. Playwright e2e: browse → package → book → success (desktop + mobile), enquiry modal, admin login + status change, role restrictions.
2. Accessibility pass with axe; keyboard-only run of the booking flow.
3. Performance: Lighthouse ≥ 90 mobile on Home and Package detail; `next/image` sizes; font preloading.
4. Security: headers (CSP, HSTS), admin rate limiting, secrets only in env, backups enabled on Postgres.
5. Production deploy, domain + SSL, GA4 + Search Console, sitemap submitted, Sentry.
6. Content entry with real photos and packages; staff walkthrough of the CMS; short admin guide in `docs/ADMIN_GUIDE.md`.

**Done when:** the live domain passes the launch checklist below.

**Total build time:** about 27 working days (~5–6 weeks), with WhatsApp approval running in parallel.

---

## 9. Testing strategy

| Level         | Tool                                                   | Covers                                                                                                                                              |
| ------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit          | Vitest                                                 | `formatINR`, `formatDuration`, pricing estimate, ID generation, access matrix, WhatsApp template variable mapping, adapter request/response parsing |
| Integration   | Vitest + Payload Local API on a test DB                | Booking route saves before sending; retry/fallback; webhook status updates                                                                          |
| E2E           | Playwright (Chromium desktop + Pixel/iPhone viewports) | Main user journeys and admin journeys in §8 Phase 6                                                                                                 |
| Accessibility | `@axe-core/playwright`                                 | Every public route, booking steps, modal                                                                                                            |
| Manual        | Real phones (Android + iPhone)                         | WhatsApp delivery, tap targets, mega menu/drawer                                                                                                    |

---

## 10. Launch checklist

- [ ] WhatsApp templates approved; live sender number connected; test message received by every recipient
- [ ] Booking + enquiry delivered end-to-end on production; failure path verified
- [ ] All packages, destinations, categories, slides and pages entered with real photos and alt text
- [ ] Site Settings complete (address, phones, hours, map, social, SEO defaults)
- [ ] Users invited with correct roles; Owner set as primary WhatsApp recipient
- [ ] Lighthouse mobile ≥ 90; axe has no serious violations
- [ ] Sitemap submitted; GA4 receiving events (booking_request, enquiry_submit, whatsapp_click)
- [ ] Database backups and error monitoring on

---

## 11. Open decisions

| #   | Decision                                                       | Recommendation                                                                            |
| --- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1   | Admin UI: themed Payload + custom views, or fully custom admin | Themed Payload + custom views (§2)                                                        |
| 2   | WhatsApp aggregator                                            | Gupshup or Interakt (compare per-message price and template approval speed)               |
| 3   | Hosting                                                        | Vercel + Neon (simplest); Indian VPS if data must stay in India or for lower monthly cost |
| 4   | Media storage                                                  | Cloudflare R2 (cheap, S3-compatible); Cloudinary if on-the-fly transforms are wanted      |
| 5   | Estimated price rule for rooms/children                        | Confirm with the business: child price % of adult, single-room supplement                 |
| 6   | Package PDF                                                    | Server-rendered print page → PDF; confirm the layout wanted                               |
