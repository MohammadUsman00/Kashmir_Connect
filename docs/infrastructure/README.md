# Kashmir Connect Infrastructure Guide

This document explains local containers, production simulation, CI/CD, workers, and monitoring setup.

## 1) Docker and Compose

### Local Development
- File: `docker-compose.yml`
- Services: `web`, `postgres`, `redis`, `worker`, `pgadmin`
- Ports:
  - Web: `3000`
  - Postgres: `5432`
  - Redis: `6379`
  - PgAdmin: `5050`

### Production Simulation
- File: `docker-compose.prod.yml`
- Services: `web`, `postgres`, `redis`, `worker`
- Uses `Dockerfile` runner target and `Dockerfile.worker`.

### Required Environment Variables
- `DATABASE_URL`
- `REDIS_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MAPBOX_TOKEN`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `SUPABASE_MEDIA_BUCKET` (default: `media`)

## 2) Job Workers (BullMQ)

- Queues: `email`, `ai-preprocessing`, `analytics`, `image-processing`, and `email-dlq`.
- Worker entrypoint: `apps/web/src/lib/jobs/workers/index.ts`.
- Analytics flush repeat interval: 60 seconds.

### Worker-Specific Environment Variables
- `REDIS_URL`
- `DATABASE_URL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `ANTHROPIC_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_MEDIA_BUCKET`

## 3) GitHub Actions

### CI (`.github/workflows/ci.yml`)
- Trigger: push on any branch + PR to `main`.
- Jobs: typecheck, lint, test with coverage, build.
- Reports:
  - Codecov upload
  - PR comment and success check.

### Staging Deploy (`.github/workflows/deploy-staging.yml`)
- Trigger: push to `develop`.
- Steps: CI gates -> Prisma migrate deploy -> Railway deploy -> smoke test -> PR comment.
- Required secrets:
  - `RAILWAY_TOKEN`
  - `RAILWAY_SERVICE`
  - `STAGING_DATABASE_URL`
  - `STAGING_URL`

### Production Deploy (`.github/workflows/deploy-production.yml`)
- Trigger: push to `main`.
- Steps: full CI -> GitHub Release -> Prisma migrate deploy -> Vercel deploy -> smoke tests -> Sentry release -> Slack notify.
- Required secrets:
  - `PRODUCTION_DATABASE_URL`
  - `VERCEL_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID`
  - `PRODUCTION_URL`
  - `SENTRY_AUTH_TOKEN`
  - `SENTRY_ORG`
  - `SENTRY_PROJECT`
  - `SLACK_WEBHOOK_URL`
  - `CODECOV_TOKEN`

## 4) PWA

- Manifest: `apps/web/public/manifest.json`
- Service Worker: `apps/web/public/sw.js`
- Offline fallback: `apps/web/public/offline.html`

### Features
- App-shell pre-cache for `/`, `/map`, `/emergency`, `/explore`, `offline.html`.
- API network-first strategy with stale fallback (5 min max).
- Image cache-first strategy (7 day cache).
- Page stale-while-revalidate.
- SOS POST offline queue with background sync replay.
- Periodic sync every 6h for emergency refresh.

## 5) Monitoring and Product Analytics

- Sentry init:
  - `apps/web/src/instrumentation.ts` (server)
  - `apps/web/src/instrumentation-client.ts` (client)
- Vercel Analytics: enabled in `apps/web/src/app/layout.tsx`.
- PostHog server tracking helper: `apps/web/src/lib/monitoring/posthog.ts`.

### Monitoring Variables
- `SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_TRACES_SAMPLE_RATE`
- `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE`
- `POSTHOG_API_KEY`
- `POSTHOG_HOST`
