# Memory — ArcJet + Prisma Setup

Last updated: 2026-06-27 6:00 PM

## What was built

### Session 1 — ArcJet Integration
- Installed `@arcjet/nest` and `@nestjs/config` via pnpm
- Migrated project to full ESM: added `"type": "module"` to `package.json`, updated `tsconfig.json` to `"module": "NodeNext"` + `"moduleResolution": "NodeNext"`, updated all relative imports to use `.js` extensions (`app.module.js`, `app.controller.js`, `app.service.js`)
- `src/app.module.ts`: wired `ConfigModule.forRoot({ isGlobal: true })` and `ArcjetModule.forRootAsync` with `ConfigService` injection; `shield({ mode: 'LIVE' })` and `slidingWindow({ mode: 'LIVE', interval: '1m', max: 10 })` applied globally via `APP_GUARD` + `ArcjetGuard`
- `.env`: `ARCJET_KEY` set to site key for `crud_hackathon_ajr` [REDACTED], `ARCJET_ENV=development`, `ARCJET_MODE=LIVE`
- Created ArcJet site `crud_hackathon_ajr` (Personal team) with two remote rules on the dashboard: shield (DRY_RUN) and rate limit 100 req/60s (DRY_RUN) — these are dashboard-side only, in-code rules are LIVE

### Session 2 — Prisma Postgres Database Setup
- Installed `prisma@7.8.0` (dev), `@prisma/client@7.8.0`, `@prisma/adapter-pg`, `pg`, `@types/pg`, `dotenv` via pnpm
- `prisma/schema.prisma`: Prisma 7 format — `provider = "prisma-client"`, `output = "../src/generated/prisma"`, no `url` in datasource (moved to prisma.config.ts)
- `prisma.config.ts`: created at project root with `datasource.url = process.env["DATABASE_URL"]` — this is the Prisma 7 way (replaces schema `url`)
- `DATABASE_URL` (direct postgres connection) and `PRISMA_ACCELERATE_URL` (prisma+postgres:// accelerate URL) added to `.env` — both [REDACTED]
- Prisma Client generated to `src/generated/prisma/`
- Database connection confirmed: `prisma migrate dev --name init` returned "Already in sync"
- Created `src/lib/database/prisma.service.ts` — composition pattern (`readonly db: InstanceType<typeof PrismaClient>`), uses `PrismaPg` adapter from `@prisma/adapter-pg`, `OnModuleInit`/`OnModuleDestroy`
- Created `src/lib/database/prisma.module.ts` — `@Global()`, exports `PrismaService`
- Updated `src/app.module.ts` to import `PrismaModule`
- Updated `src/main.ts` to call `app.enableShutdownHooks()`
- Added `pnpm.onlyBuiltDependencies` to `package.json` for `@prisma/engines`, `prisma`, `unrs-resolver` — pnpm v10 blocks postinstall scripts by default

## Decisions made

- Full ESM migration chosen (not SWC) because `@arcjet/nest` is a pure ESM package and TypeScript NodeNext is the clean path without extra tooling
- `ArcjetModule.forRootAsync` with `ConfigService` used instead of `process.env` directly — keeps DI consistent with NestJS patterns
- `APP_GUARD` global registration chosen over per-controller decoration — protects every route by default
- Remote rules on ArcJet dashboard left in DRY_RUN; in-code rules set to LIVE
- Prisma 7 uses `prisma-client` generator (not `prisma-client-js`) — client goes to `src/generated/prisma/`, not `@prisma/client`
- Composition pattern for PrismaService (`this.db`) instead of `extends PrismaClient` — Prisma 7 exports PrismaClient as a const factory, not a plain class; composition avoids TS issues
- `DATABASE_URL` = direct `postgres://db.prisma.io` URL used for both migrations (prisma.config.ts) and adapter (PrismaPg) — simpler than splitting direct/accelerate
- `PRISMA_ACCELERATE_URL` stored in `.env` for future edge/caching use but not wired up yet
- CLI `prisma postgres link` failed (API key invalid) — used MCP Prisma tool (`create_prisma_postgres_connection_string`) to get both URLs directly
- Database resource ID: `db_cmqwwsqth20o4zyf5wd37fcqz` (Prisma Postgres managed)

## Problems solved

- `@arcjet/nest` is ESM-only, causing TS1479 error — fixed by NodeNext tsconfig + `.js` extensions
- Port 3000 EADDRINUSE — kill with `Get-NetTCPConnection -LocalPort 3000 | Stop-Process`
- `prisma init` failed with "Port 51213 not available" — Prisma 7's interactive init tries to start a local server; schema.prisma and prisma.config.ts were still created despite the error
- `url` in `datasource db {}` is no longer valid in Prisma 7 — must go in `prisma.config.ts` under `datasource.url`
- pnpm v10 blocks Prisma postinstall scripts — add `pnpm.onlyBuiltDependencies` array to `package.json`, then `pnpm install` to run them
- `npx plugins add prisma/prisma-plugin` is not a valid command for Prisma 7 CLI

## Current state

- App starts clean with `pnpm start:dev` (watch mode)
- PrismaModule initialized and connected on startup
- ArcJet shield + sliding window active globally
- Schema has no models yet — `prisma/schema.prisma` is empty (just generator + datasource)
- No feature modules built

## Next session starts with

Define the domain model in `prisma/schema.prisma` (decide what resources the CRUD app needs), then run `npx prisma migrate dev --name <model-name>` to create the migration and regenerate the client. After that, use `nest g module`, `nest g service`, `nest g controller` to scaffold feature modules in `src/module/<name>/`. Feature services inject `PrismaService` and access DB via `this.prismaService.db.<model>.findMany()`.

## Open questions

- What features/resources does this hackathon CRUD app need? (no domain model defined yet — this is the first question for next session)
- Remote ArcJet dashboard rules (shield + rate limit) are in DRY_RUN — promote to LIVE via MCP `promote-rule` once traffic is flowing
- `PRISMA_ACCELERATE_URL` is in `.env` but unused — wire it up later if edge/serverless deployment is needed
