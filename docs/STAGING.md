# GigSaw frontend staging

## Target

- Branch: `staging`
- URL: `https://staging.gigsaw.it`
- API: `https://api-staging.gigsaw.it`
- Angular configuration: `staging`
- Build command: `npm run build:staging`
- Output directory: `www`

## Vercel

Create a dedicated Vercel project (recommended) for staging, connected to `bigjoe81/gigsaw-app`.

Settings:

- Production Branch: `staging`
- Framework preset: Other / Angular as detected
- Build Command: `npm run build:staging`
- Output Directory: `www`
- Domain: `staging.gigsaw.it`

Do not reuse the production deployment target for the staging branch: a separate Vercel project makes domains, analytics and environment variables harder to mix up.

## DNS

Point `staging.gigsaw.it` to the Vercel target shown by Vercel when the custom domain is added. Use the exact DNS value Vercel provides rather than copying the production record.

## Visual safety

The staging Angular environment sets `environment.staging = true`. The root app displays a fixed `STAGING` badge so production and staging are immediately distinguishable.

## Promotion flow

1. Merge feature branches into `staging`.
2. Vercel deploys `staging.gigsaw.it` using `npm run build:staging`.
3. Run smoke tests against the staging API/database.
4. Promote the tested commits from `staging` to `main`.
5. Production remains built with the normal `production` Angular configuration.

## Smoke checklist

- Login / OTP
- Create or select a band
- Empty-band onboarding flow
- Import repertoire (PDF/DOCX/XLSX/CSV/TXT)
- Create/edit song
- Create rehearsal
- Create gig
- Create setlist
- Support ticket with screenshot
- Billing pages with Stripe test data
- Logout/login session persistence
