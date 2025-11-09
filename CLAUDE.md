# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RemoteJobs is a modern remote job aggregation platform built with Next.js 15, aggregating job listings from multiple sources (V2EX, Eleduck, RemoteOK, WeWorkRemotely, Himalayas, Remotive, VueJobs, Ruanyf Weekly) into a unified searchable database. The platform supports bilingual content (English/Chinese), user authentication, job posting, and advanced filtering.

## Development Commands

```bash
# Development
pnpm dev                 # Start dev server with Turbopack (port 3000)
pnpm build              # Production build
pnpm start              # Start production server
pnpm type-check         # TypeScript type checking

# Code Quality
pnpm lint               # Run ESLint
pnpm lint:fix           # Auto-fix ESLint issues
pnpm format             # Format code with Prettier
pnpm format:check       # Check code formatting

# Database (Drizzle ORM)
pnpm db:generate        # Generate migration files from schema changes
pnpm db:push            # Push schema directly to database (dev)
pnpm db:migrate         # Run migrations (production)
pnpm db:studio          # Open Drizzle Studio GUI

# Testing Crawlers
npx tsx test-crawlers.ts           # Test all crawlers
curl http://localhost:3000/api/crawl/himalayas    # Test individual crawler
```

## Architecture

### Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript 5.7, Tailwind CSS 4.x, shadcn/ui
- **Backend**: Next.js API Routes, Clerk Auth, Drizzle ORM
- **Database**: PostgreSQL (Vercel Postgres / Supabase)
- **Crawlers**: Axios, Cheerio, rss-parser
- **Deployment**: Vercel (with Cron Jobs every 6 hours)

### Key Design Patterns

**1. Crawler Architecture**

- Each crawler in `lib/crawlers/` exports a function returning `{success, failed, total}`
- All crawlers orchestrated by `lib/crawlers/scheduler.ts` → `runCrawlers()`
- Deduplication uses `sourceId` (unique identifier from source platform)
- Jobs filtered to last 30 days before saving
- Crawl results logged to `crawl_logs` table

**2. Database Schema (Drizzle ORM)**

- Schema defined in `db/schema.ts` using Drizzle's type-safe builders
- Relations: jobs ↔ skills (M:N), jobs ↔ tags (M:N), jobs ↔ categories
- Enums: `jobTypeEnum`, `remoteTypeEnum`, `jobSourceEnum`, `jobStatusEnum`
- Indexes on: `source`, `status`, `publishedAt`, `sourceId` (unique per source)

**3. Internationalization**

- next-intl with `as-needed` locale prefix strategy
- Locale routing handled by middleware (see `middleware.ts`)
- Translation files: `i18n/messages/en.json` and `i18n/messages/zh.json`
- Use `useTranslations()` hook in components: `const t = useTranslations('jobs.filters')`

**4. Authentication Flow**

- Clerk middleware protects `/console/*`, `/jobs/create`, `/jobs/edit`
- API routes skip Clerk auth (handled per-route if needed)
- Middleware chain: Clerk → next-intl → protected route check

### Critical Implementation Details

**Adding a New Crawler Source**

1. Create `lib/crawlers/newsource.ts` with function returning `{success, failed, total}`
2. Add source to `jobSourceEnum` in `db/schema.ts`
3. **Create migration file** `db/add-{source}-source.sql` (see Database Migrations section)
4. Run migration locally: `psql $DATABASE_URL -f db/add-{source}-source.sql`
5. Import and call in `lib/crawlers/scheduler.ts`
6. Create API route: `app/api/crawl/newsource/route.ts`
7. Add translations to `i18n/messages/{en,zh}.json` under `jobs.sources`
8. Test crawler: `curl http://localhost:3000/api/crawl/newsource`
9. Verify build passes: `pnpm build`
10. **Document migration in PR** - Remind reviewers to run migration before deployment

**Database Migrations**

- Always run `pnpm db:generate` after schema changes to create migration files
- Use `pnpm db:push` for quick dev iteration (pushes directly without migration)
- Use `pnpm db:migrate` in production with generated migration files
- **Important**: When adding enum values, PostgreSQL requires special handling

**Adding New Enum Values (Critical for Production)**

When adding new values to PostgreSQL enums (e.g., `jobSourceEnum`, `jobTypeEnum`):

1. **Update Schema** (`db/schema.ts`):

   ```typescript
   export const jobSourceEnum = pgEnum("job_source", [
     "EXISTING_VALUE",
     "NEW_VALUE", // Add new value
   ]);
   ```

2. **Local Development**:

   ```bash
   # Option 1: Direct push (development only)
   pnpm db:push

   # Option 2: SQL command
   psql $DATABASE_URL -c "ALTER TYPE job_source ADD VALUE IF NOT EXISTS 'NEW_VALUE';"
   ```

3. **Create Migration File** for production databases:
   - Create `db/add-{feature}-source.sql` with Supabase-compatible syntax:

   ```sql
   -- Migration: Add NEW_VALUE to job_source enum
   -- For Supabase: Run this in the SQL Editor
   -- For other PostgreSQL: psql $DATABASE_URL -f db/add-{feature}-source.sql

   -- Add NEW_VALUE to job_source enum (PostgreSQL 12+)
   ALTER TYPE job_source ADD VALUE IF NOT EXISTS 'NEW_VALUE';
   ```

4. **Deploy Migration**:
   - **Supabase**: Open SQL Editor → Paste migration content → Run
   - **Vercel Postgres**: Dashboard → Storage → Query → Paste and execute
   - **CLI**: `psql $DATABASE_URL -f db/add-{feature}-source.sql`

5. **Verify Migration**:
   ```sql
   SELECT enumlabel FROM pg_enum
   WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'job_source')
   ORDER BY enumsortorder;
   ```

**Important Notes**:

- ⚠️ **NEVER use `DO $$ ... END $$;` blocks in Supabase** - Use simple `ALTER TYPE` statements
- ✅ Always use `IF NOT EXISTS` to make migrations idempotent (safe to run multiple times)
- ✅ Test migration locally before running in production
- ✅ Commit migration file to repository (e.g., `db/add-greenhouse-source.sql`)
- ✅ PostgreSQL enum values cannot be removed or reordered after creation

**Fixing Crawler Issues**

- Check logs in console output for error messages
- Verify dependencies (e.g., `rss-parser` for RSS-based crawlers)
- Test API response format changes (common issue)
- Check `.env.local` for required API keys (e.g., `V2EX_API_TOKEN`)
- Verify database schema includes new columns (run migration if needed)

**Environment Variables**

```bash
# Required
DATABASE_URL                      # PostgreSQL connection string
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY # Clerk public key
CLERK_SECRET_KEY                  # Clerk secret key

# Required for Production (Optional for local dev)
CRON_SECRET                       # Secure cron endpoint (CRITICAL: protects /api/cron/* and /api/cleanup)
                                  # Generate with: openssl rand -base64 32

# Optional
V2EX_API_TOKEN                   # V2EX API access
RESEND_API_KEY                   # Email service
```

## Project Structure

```
app/
├── [locale]/             # Internationalized routes
│   ├── jobs/            # Job listing and details
│   ├── console/         # User dashboard (protected)
│   └── stats/           # Platform statistics
├── api/
│   ├── jobs/            # Job CRUD operations
│   ├── crawl/           # Manual crawler triggers
│   ├── cron/            # Vercel Cron endpoints
│   └── stats/           # Analytics endpoints
components/
├── ui/                  # shadcn/ui components
├── jobs/                # Job-specific components
│   ├── job-card.tsx     # Individual job card
│   └── job-filters.tsx  # Sidebar filters
lib/
├── crawlers/            # All crawler implementations
│   ├── scheduler.ts     # Orchestrates all crawlers
│   ├── v2ex.ts
│   ├── eleduck.ts
│   ├── himalayas.ts     # REST API crawler
│   ├── remoteok.ts      # REST API crawler
│   ├── remotive.ts      # REST API crawler
│   ├── weworkremotely.ts # RSS parser
│   ├── vuejobs.ts       # REST API crawler
│   └── ruanyf-weekly.ts # GitHub README parser
├── utils.ts             # Shared utilities
db/
├── schema.ts            # Drizzle schema definitions
└── index.ts             # Database connection
i18n/
├── messages/            # Translation JSON files
├── routing.ts           # next-intl routing config
└── request.ts           # Server-side i18n config
```

## Common Tasks

**Testing Crawlers Locally**

```bash
# Option 1: Run all crawlers
npx tsx test-crawlers.ts

# Option 2: Test via API (requires dev server running)
curl http://localhost:3000/api/crawl/himalayas
curl http://localhost:3000/api/crawl/remoteok
```

**Adding Category-Based Filtering**

1. Jobs already have `category_id` column linking to `job_categories` table
2. Categories support hierarchical structure (`parentId` field)
3. Add filter UI in `components/jobs/job-filters.tsx`
4. Update API query in `app/api/jobs/route.ts` to filter by `category_id`
5. Populate categories via `/api/jobs/categories` or seed script

**Debugging "No Data" for New Sources**

- Verify API endpoint works: `curl http://localhost:3000/api/crawl/[source]`
- Check crawler logs in console for errors
- Verify source added to `jobSourceEnum` in schema
- Confirm database migration ran: `pnpm db:push`
- Test source API response format hasn't changed
- Check date filtering (only jobs from last 30 days saved)

**Updating Job Source Badge Display**

- Source badges added in `components/jobs/job-card.tsx:104-106`
- Translation keys in `i18n/messages/{en,zh}.json` under `jobs.sources`
- Filter shows only sources with data via `/api/jobs/sources` endpoint

## Deployment

**Vercel Configuration**

- Cron job defined in `vercel.json`: runs every 6 hours (`0 */6 * * *`)
- Cron endpoint: `/api/cron/crawl-jobs` (protected by `CRON_SECRET` header)
- GitHub Actions also configured in `.github/workflows/crawl-jobs.yml` as backup

**Database Setup**

```bash
# After deployment, run migrations
pnpm db:push  # or use Vercel's "Redeploy" to trigger migrations
```

**Initialize Production Database (First Time)**

For a new production database, execute these SQL files in order:

1. Open your database SQL Editor:
   - **Vercel Postgres**: Dashboard → Storage → Your DB → Data → Query
   - **Supabase**: Dashboard → SQL Editor → New query

2. **Step 1**: Run `db/migration.sql` to create tables
   - Creates all tables, ENUMs, indexes, and foreign keys

3. **Step 2**: Run `db/seed-categories.sql` to populate categories
   - Inserts 44 job categories (5 parent + 39 child)

## Important Notes

- **Port Configuration**: Dev server uses port 3000 by default; if occupied, Next.js auto-selects next available port
- **Turbopack**: Development uses `--turbopack` flag for faster builds
- **Skill Duplication Warnings**: Duplicate key errors in `job_skill_relations` are non-fatal (crawler re-runs may attempt to re-add existing skills)
- **Data Freshness**: Jobs older than 30 days are filtered out during crawling
- **Enum Updates**: Adding new sources requires both schema update AND database push/migration
- **Company Field Issues**: Some APIs (e.g., VueJobs) may return `undefined` for `company` object; use optional chaining

## Troubleshooting

**"Module not found" errors**

- Check `package.json` for missing dependency
- Run `pnpm install` to ensure all dependencies installed
- For RSS-based crawlers, ensure `rss-parser` is installed

**Database connection errors**

- Verify `DATABASE_URL` in `.env.local`
- For Vercel Postgres, URL format: `postgres://user:pass@host/db?sslmode=require`
- Test connection: `psql $DATABASE_URL -c "SELECT 1"`

**Crawler returning 0 jobs**

- Check if source API response format changed
- Verify date filtering logic (jobs must be within 30 days)
- Look for error messages in crawler output
- Test API endpoint directly with `curl` or browser

**Filter showing wrong sources**

- Clear browser cache / hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)
- Verify `/api/jobs/sources` returns expected data
- Check `availableSources` state in `job-filters.tsx` component

## Reference Documentation

- [PRD.md](./PRD.md) - Product Requirements Document
- [README.md](./README.md) - Setup and deployment instructions
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [Clerk Auth Docs](https://clerk.com/docs)

- When you commit code and push to remote, Please make sure run `pnpm run build` successfully.
- When you develop new features, Please make sure add new i18n translations.
- When you develop new features, Please make sure use `chrome-devtools-mcp` to test the new features.
- Don't use hardcode, reuse code as much as possible.
- When you test new features, Please use `test@example.com` as the test email.
- For interface error handling, try to use createAPIError.
