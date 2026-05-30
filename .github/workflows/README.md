# CI/CD Workflows

## `ci.yml`
- Runs on push and PR.
- Validates typecheck, lint, tests, and build.

## `deploy-staging.yml`
- Runs on `develop`.
- Deploys to Railway after passing CI and running Prisma migrations.

## `deploy-production.yml`
- Runs on `main`.
- Creates release, migrates production DB, deploys to Vercel, triggers smoke checks, and sends notifications.

## Required Secrets
- `CODECOV_TOKEN`
- `RAILWAY_TOKEN`, `RAILWAY_SERVICE`, `STAGING_DATABASE_URL`, `STAGING_URL`
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `PRODUCTION_DATABASE_URL`, `PRODUCTION_URL`
- `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`
- `SLACK_WEBHOOK_URL`
