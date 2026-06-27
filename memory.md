# Memory — ArcJet + Prisma Setup + Review Fixes

Last updated: 2026-06-27 7:00 PM

## What was built

### Session 1 — ArcJet Integration
- Installed `@arcjet/nest` and `@nestjs/config` via pnpm
- Migrated project to full ESM: `"type": "module"` in `package.json`, `tsconfig.json` set to `NodeNext` module + moduleResolution, all relative imports use `.js` extensions
- `src/app.module.ts`: `ConfigModule.forRoot({ isGlobal: true })` and `ArcjetModule.forRootAsync` with `ConfigService`; `shield({ mode: 'LIVE' })` and `slidingWindow` applied globally via `APP_GUARD` + `ArcjetGuard`
- `.env`: `ARCJET_KEY`, `ARCJET_ENV=development`, `ARCJET_MODE=LIVE` [secrets REDACTED]
- Created ArcJet site `crud_hackathon_ajr` (Personal team); remote dashboard rules left in DRY_RUN

### Session 2 — Prisma Postgres Database Setup
- Installed `prisma@7.8.0`, `@prisma/client@7.8.0`, `@prisma/adapter-pg`, `pg`, `@types/pg`, `dotenv` via pnpm
- `prisma/schema.prisma`: Prisma 7 format — `provider = "prisma-client"`, `output = "../src/generated/prisma"`, no `url` in datasource
- `prisma.config.ts`: created at project root with `datasource.url = process.env["DATABASE_URL"]`
- `DATABASE_URL` and `PRISMA_ACCELERATE_URL` added to `.env` [secrets REDACTED]
- Prisma Client generated to `src/generated/prisma/`
- `src/lib/database/prisma.service.ts`: composition pattern (`readonly db`), uses `PrismaPg` adapter, `OnModuleInit`/`OnModuleDestroy`
- `src/lib/database/prisma.module.ts`: `@Global()`, exports `PrismaService`
- Updated `src/app.module.ts` to import `PrismaModule`; `src/main.ts` calls `app.enableShutdownHooks()`
- Added `pnpm.onlyBuiltDependencies` to `package.json` for Prisma build scripts
- Added `db:generate`, `db:migrate`, `db:format`, `db:studio` scripts to `package.json`

### Session 3 — Review + Jest ESM Fix (PR #1, merged)
- `/review` identified: Jest not configured for ESM (critical), rate limit 10/min too low (important), no global ValidationPipe (minor), noImplicitAny off (minor)
- Fixed Jest ESM: test scripts now use `node --experimental-vm-modules node_modules/jest/bin/jest.js`; jest configs (`package.json` + `test/jest-e2e.json`) gained `extensionsToTreatAsEsm: [".ts"]`, `ts-jest` with `useESM: true`, `moduleNameMapper` for `.js` imports; `--passWithNoTests` added to prevent CI failure with empty suite
- Fixed e2e test import: `test/app.e2e-spec.ts` line 6 now uses `.js` suffix on `AppModule` import
- Raised ArcJet `slidingWindow` max from 10 → config-driven via `config.get<number>('ARCJET_RATE_LIMIT_MAX', 60)`; `.env` sets `ARCJET_RATE_LIMIT_MAX=100` for dev
- PR #1 opened on `fix/jest-esm-rate-limit`, CodeRabbit reviewed (one comment addressed), merged to main

## Decisions made

- Full ESM (NodeNext) chosen because `@arcjet/nest` is ESM-only — no SWC, no extra tooling
- `APP_GUARD` global registration for ArcJet — protects every route by default
- Remote ArcJet dashboard rules left in DRY_RUN; in-code rules are LIVE
- Prisma 7 `prisma-client` generator, client output to `src/generated/prisma/`
- Composition pattern for PrismaService (`this.db`) — Prisma 7 exports PrismaClient as a const factory, not a plain class
- `DATABASE_URL` (direct postgres) used for both migrations and runtime adapter
- `PRISMA_ACCELERATE_URL` stored in `.env` for future edge use but not wired yet
- Rate limit max pulled from `ARCJET_RATE_LIMIT_MAX` env var; production default is 60, dev uses 100
- Database resource ID: `db_cmqwwsqth20o4zyf5wd37fcqz` (Prisma Postgres managed)
- Jest binary invoked as `node_modules/jest/bin/jest.js` directly — `.bin/jest` shim is a bash script that breaks on Windows with `node`

## Problems solved

- `@arcjet/nest` ESM-only → TS1479 error: fixed by NodeNext tsconfig + `.js` import extensions
- Port 3000 EADDRINUSE: kill with `Get-NetTCPConnection -LocalPort 3000 | Stop-Process`
- Prisma 7 `url` in `datasource {}` removed: must go in `prisma.config.ts`
- pnpm v10 blocks Prisma postinstall: add `pnpm.onlyBuiltDependencies` to `package.json`
- `node_modules/.bin/jest` is a bash shim — can't be passed to `node` on Windows; use `node_modules/jest/bin/jest.js` instead
- Jest + ESM: `ts-jest` needs `useESM: true` + `extensionsToTreatAsEsm` + `moduleNameMapper` for `.js` imports

## Current state

- `main` is clean and up to date after PR #1 merge
- App starts clean with `pnpm start:dev`
- PrismaModule connected on startup; ArcJet guard active globally
- `pnpm test` exits 0 (no unit tests yet, passWithNoTests)
- Schema has no models — `prisma/schema.prisma` is empty (just generator + datasource)
- No feature modules built yet

## Next session starts with

Define the domain model in `prisma/schema.prisma` (decide what resources the CRUD app needs), then `pnpm db:migrate -- --name <model>` to create the migration and regenerate the client. After that, scaffold feature modules: `nest g module`, `nest g service`, `nest g controller` in `src/module/<name>/`. Feature services inject `PrismaService` and access DB via `this.prismaService.db.<model>.findMany()`.

Also address the two remaining minor review items when convenient:
- Add `app.useGlobalPipes(new ValidationPipe({ whitelist: true }))` to `src/main.ts`
- Consider setting `noImplicitAny: true` in `tsconfig.json`

## Open questions

- What features/resources does this hackathon CRUD app need? (no domain model defined — first question for next session)
- Remote ArcJet dashboard rules (shield + rate limit) still in DRY_RUN — promote to LIVE via MCP `promote-rule` once traffic flows
- `PRISMA_ACCELERATE_URL` in `.env` but unused — wire up later for edge/serverless
