# DF Creatives

A responsive agency website and private visual content studio, built with React, TypeScript, Vite, Express, Puck, Supabase, and Resend.

## Start locally

Requires Node.js 24 and npm.

```sh
npm ci
cp .env.example .env  # only if you do not already have .env
# Set DEMO_ADMIN_PASSWORD to a unique password of at least 12 characters.
npm run dev
```

Open **http://localhost:3000** and **http://localhost:3000/admin**. In local preview mode, use the password from `DEMO_ADMIN_PASSWORD`; no email is needed. A private `.env` with a generated password is included in the current local workspace, but is excluded from version control.

Without Supabase credentials, development uses persistent `.local/data.json` and `.local/media` / `.local/resumes`. Local preview binds only to `127.0.0.1`, has a single admin, and cannot send team invitations. It is not used in production. Preview forms save real local submissions and explicitly report email as unconfigured if the email settings are missing.

## Connect Supabase

1. Create a Supabase project.
2. Apply `supabase/migrations/001_initial.sql` with the Supabase SQL editor, or your Supabase CLI migration workflow.
3. Set `SUPABASE_URL`, `SUPABASE_ANON_KEY` (the public anon/publishable key), and `SUPABASE_SERVICE_ROLE_KEY` in `.env` or the hosting environment. The service key is used only by the Node server and never returned to the client.
4. In **Authentication → URL Configuration**, set the site URL and allow `https://your-domain/admin` as a redirect URL (plus your localhost URL for development).
5. Disable public sign-ups. Set up custom SMTP for reliable invitation and password-reset delivery. The application uses invite-only accounts, with roles stored in the protected `profiles` table.
6. Run `npm run db:seed`. Seeding adds missing records and preserves existing records. The initial public content includes service descriptions; client logos, testimonials, portfolio examples, team examples, and job examples remain drafts.
7. Create the initial administrator with `ADMIN_EMAIL` and `ADMIN_PASSWORD` supplied securely as environment variables, then run `npm run admin:create`. The password must contain at least 12 characters. Remove these temporary variables afterward.
8. Start the app and sign in at `/admin` with the created account. Invite editors/admins from **Team access**.

All database tables have RLS enabled and revoke direct access for `anon` and `authenticated`. Public content is served through the Node API, which removes drafts. The backend validates Supabase sessions and reads the current account role on every protected request. The database publish function separately requires an active admin and atomically records revisions. Public image storage is separate from the private résumé bucket; résumé links expire after 60 seconds.

## Dashboard workflow

- **Pages:** create routes; edit SEO titles and descriptions; drag, duplicate, reorder, hide, or remove Puck blocks. Select desktop, tablet, and mobile viewports. Layout controls offer consistent presets.
- **Save draft** keeps changes private. **Preview** displays saved drafts and draft collection data with form submissions disabled. **Publish** is available only to admins.
- **History** restores a previous published revision as a draft. Publish again to make the restored version public.
- **Collections:** services, projects, testimonials, client logos, team members, and jobs. Select individual records in page blocks, or leave the selection empty to show all published records of that kind.
- **Media library:** upload an image (8 MB maximum), edit alt text and the crop focal point, and reuse its URL. Uploads become optimized WebP images. Referenced media cannot be deleted, including references retained in revisions.
- **Site settings:** logo, favicon, brand color, announcement, navigation and dropdowns, footer, contact information, and social links. Settings have their own draft/publish cycle.
- **Inbox:** review enquiries/applications, download private PDF résumés (5 MB maximum), update status and internal notes, retry notifications, and export CSV. CSV cells are escaped to prevent spreadsheet formula execution.
- Jobs stop accepting applications when their published `open` field is false. The API rechecks the job at submission time.
- Editors can edit drafts and manage submissions. Only admins publish, unpublish, restore revisions, delete content/media, and manage users. Users cannot change their own account role/access.

Changing a published URL requires unpublishing first. Concurrent edits are rejected with a conflict message instead of silently overwriting someone else's work. Internal links are editable; review them after changing URLs. Empty social-proof sections are hidden publicly. Remove the sample flag only after replacing placeholder content with approved material.

Run `npm run setup:check` to verify the database, admin account, storage buckets, and required environment settings without sending email or exposing credentials.

## Email notifications

Set `RESEND_API_KEY`, `EMAIL_FROM` (on a verified sending domain), `NOTIFICATION_EMAIL`, and `SITE_URL`. The server saves each submission before attempting a notification. Notifications link staff to the dashboard rather than emailing résumé attachments or the full message. Delivery status is shown in the inbox: pending, sent, failed, or not configured. Use **Retry notification** after fixing email configuration. Retries use an idempotency key and do not create another submission.

Invitations/password resets use Supabase Auth's email delivery, configured separately from Resend submission notifications. Notification retries are manual; there is no background retry worker in this version.

## Build and deploy

```sh
npm run build
npm start
```

Production requires configured Supabase credentials and will fail clearly if they are missing. Express serves the built frontend, server-renders public routes, and provides APIs on the same origin. Admin/editor code is loaded separately from the public site. Publish changes take effect on the next request without rebuilding.

`render.yaml` defines a single Node web service. Set its environment variables, apply the database migration, seed content, and create the admin before directing visitors to the service. Set `SITE_URL` to the final HTTPS origin. Confirm Supabase redirect URLs and the notification sender domain. No live deployment is performed by this repository.

- `/health` checks the application's database connection; use it for deployment monitoring.
- `/sitemap.xml` includes published pages, services, projects, and jobs.
- `/robots.txt` excludes the dashboard and API.
- Server-rendered pages include titles, descriptions, canonical URLs, and Open Graph tags; unknown pages return HTTP 404.
- Server errors are logged without enquiry bodies, passwords, or API keys. Set up host error/uptime monitoring and Supabase backups for the chosen hosting plans.

## Verification

```sh
npm test
npm run test:browser
npm run build
npm audit
```

API tests start an isolated server and temporary data directory. Browser tests use installed Google Chrome and an isolated test server; if Chrome is unavailable, install a Playwright-supported browser and adjust `channel` in `playwright.config.ts`. Tests cover SSR, private endpoints, editor permission enforcement, draft isolation, publishing/revisions, optimistic concurrency, sample protection, image uploads, referenced-media protection, enquiry persistence, notification retry behavior, honeypots, PDF access, closed jobs, responsive layouts, and dashboard workflows.

Cloud-dependent operations (real Supabase Auth/invitations, SQL/RLS execution, signed storage links, and Resend delivery) require configured accounts and are not simulated as successful delivery. Verify these against your staging project before production launch.

## Content and assets

The site uses your supplied DF Creatives logo, framed with CSS for the navigation, footer, and dashboard. Replace it through Site Settings when needed. Photography is illustrative stock, not an assertion about DF Creatives' staff or clients. Replace it with your own imagery whenever ready. Source URLs are recorded in `ASSETS.md`.

Contact details and social URLs are blank until supplied. Pricing, company metrics, client claims, and open positions are not invented. The privacy and terms pages are editable starter copy and should be aligned with your actual business practices before launch. This version is English-only and excludes payments, CRM integrations, and arbitrary freeform layouts.
