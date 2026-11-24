# Deploying Go Travels (Vercel + Neon)

The site runs on **Vercel** (Mumbai region, set in `vercel.json`) with a **Neon** Postgres database and a **Cloudflare R2** bucket for uploaded images. Expect about an hour the first time.

> **Plan note:** Vercel's free (Hobby) plan is for personal, non-commercial projects. It's fine for setting up and testing. Before the site takes real customers, move to Vercel Pro. Pro also allows a per-minute cron: change the schedule in `vercel.json` to `"* * * * *"`.

## 1. Database: Neon

1. Create a Neon project in **AWS Asia Pacific (Mumbai)**, Postgres 17.
2. Copy two connection strings from **Connect**:
   - the **pooled** one (host contains `-pooler`), for the site: `DATABASE_URL`
   - the **direct** one, for backups: `BACKUP_DATABASE_URL`
3. Nothing else is needed. The site creates its tables on first start, from the migrations in `src/migrations`.

Neon keeps a short restore history on the free plan. The nightly backup in step 6 covers anything older.

## 2. Images: Cloudflare R2

Vercel can't keep uploaded files, so images must go to a bucket.

1. In Cloudflare, go to **R2**, create the bucket `go-travels-media`, and keep it private.
2. Under **R2 › Manage API tokens**, create a token with _Object Read & Write_ on that bucket.
3. Note the S3 endpoint (`https://<account-id>.r2.cloudflarestorage.com`) and the key pair.

The site serves images itself (`/api/media/file/…`), so the bucket never needs to be public.

## 3. Vercel project

1. In Vercel, choose **Add New › Project** and import `Sumit0816/go-travels`. Framework: Next.js (detected).
2. Add these **Environment Variables** for _Production_:

| Name                                                                                         | Value                                                                                                 |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                                                               | Neon pooled connection string                                                                         |
| `PAYLOAD_SECRET`                                                                             | 64 random hex characters (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
| `NEXT_PUBLIC_SITE_URL`                                                                       | `https://<your-project>.vercel.app` for now; the real domain later                                    |
| `WHATSAPP_ENC_KEY`                                                                           | another 64 random hex characters. **Keep a copy**: without it, the saved WhatsApp key can't be read   |
| `WHATSAPP_WEBHOOK_SECRET`                                                                    | a long random string                                                                                  |
| `CRON_SECRET`                                                                                | a long random string                                                                                  |
| `S3_BUCKET`, `S3_REGION` (`auto`), `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | from step 2                                                                                           |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`                             | your mail provider (for WhatsApp fallback emails and password resets)                                 |
| `SENTRY_DSN`                                                                                 | optional, from a Sentry project (Next.js)                                                             |

3. **Preview deployments** (one per pull request) get Production values unless you set them separately. Either set a _Preview_ `DATABASE_URL` pointing at a Neon **branch**, or turn previews off under Settings › Git. Otherwise previews read and write the live database.
4. Click **Deploy**.
5. Open `/admin`. The first account you create becomes the **Owner**. Don't run `npm run seed` against production: it deletes content.

## 4. Domain and HTTPS

1. In Vercel, go to **Settings › Domains**, add `gotravels.in` (and `www`), and add the DNS records Vercel shows at your registrar. Vercel issues the SSL certificate automatically.
2. Change `NEXT_PUBLIC_SITE_URL` to `https://gotravels.in` and **redeploy**. This turns on HSTS, and canonical URLs, the sitemap and share links switch to the real domain.

## 5. Scheduled jobs (GitHub Actions)

The free Vercel plan runs its cron once a day, so `.github/workflows/scheduled.yml` sends due WhatsApp retries every ~5 minutes. (Retries also run after every booking, enquiry and admin dashboard visit.) In GitHub, go to **Settings › Secrets and variables › Actions** and add:

- `SITE_URL`: `https://gotravels.in`
- `CRON_SECRET`: the same value as in Vercel

## 6. Nightly database backup

The same workflow can dump the database at 03:00 IST, encrypt it, and upload it to a **separate private R2 bucket** (e.g. `go-travels-backups`). Add these secrets:

- `BACKUP_DATABASE_URL`: the Neon **direct** connection string
- `BACKUP_PASSPHRASE`: a long passphrase. **Store it in your password manager**; backups can't be opened without it.
- `BACKUP_BUCKET`, `BACKUP_ENDPOINT`, `BACKUP_ACCESS_KEY_ID`, `BACKUP_SECRET_ACCESS_KEY`: an R2 token for the backup bucket

In R2, add a lifecycle rule on that bucket to delete objects after 30 days. Run the workflow once by hand (**Actions › Scheduled › Run workflow**) and check that a file appears.

To restore a backup into an empty database:

```bash
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -in go-travels-YYYYMMDD-HHMM.sql.gz.enc -pass env:PASSPHRASE | gunzip | psql "$DATABASE_URL"
```

If Neon moves to a newer Postgres version, set the repository _variable_ `BACKUP_PG_MAJOR` to match (default `17`).

## 7. Search, analytics and monitoring

- **Google Analytics 4:** create a GA4 property, then enter its `G-…` ID in **Admin › Site Settings › SEO**. The site sends `booking_request`, `enquiry_submit` and `whatsapp_click` events. Mark the first two as _key events_ in GA.
- **Search Console:** add the domain, choose the HTML tag method, paste the code into Site Settings › SEO, then submit `https://gotravels.in/sitemap.xml`.
- **Uptime:** point a free monitor (UptimeRobot, Better Stack) at `https://gotravels.in/api/health`.
- **Sentry:** with `SENTRY_DSN` set, server errors are reported with phone numbers and emails masked. A booking whose WhatsApp alerts all failed is reported too.

## 8. Team alerts

- **Now (free):** in **Admin › Settings › Team Alerts**, set up Telegram (bot token, group, "Find my group", test) and/or email recipients, and switch them on. Email needs the `SMTP_*` variables from step 3. The bot token is encrypted with `WHATSAPP_ENC_KEY`, so keep that key safe.
- **Later (WhatsApp):** after the Gupshup account and templates are approved, fill in **Settings › WhatsApp Integration**. Set the provider's delivery webhook to the URL on the "Test & delivery log" tab, use **Send test message**, then switch on **Send alerts on WhatsApp**. Telegram and email can stay on alongside it.

## Before launch

Work through the launch checklist in `docs/IMPLEMENTATION_PLAN.md` (§10).
