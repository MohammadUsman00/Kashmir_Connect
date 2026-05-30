# BullMQ Workers

This directory contains queue and worker infrastructure for background processing.

## Files
- `queues.ts`: queue declarations and shared Redis connection.
- `workers/emailWorker.ts`: transactional email jobs and dead-letter handling.
- `workers/aiWorker.ts`: AI generation and translation preprocessing jobs.
- `workers/analyticsWorker.ts`: analytics buffer flush and hourly aggregation jobs.
- `workers/imageWorker.ts`: image optimization and Supabase CDN updates.
- `workers/index.ts`: bootstraps all workers.

## Required Environment Variables
- `REDIS_URL`
- `DATABASE_URL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `ANTHROPIC_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_MEDIA_BUCKET`

## Running workers locally
```bash
pnpm --filter @kashmir/web exec tsx src/lib/jobs/workers/index.ts
```
