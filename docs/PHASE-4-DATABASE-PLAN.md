# Phase 4 - PostgreSQL + Prisma

Status: COMPLETE - validated on local PostgreSQL 18 with Node 24.19.0. Phase 4 remains the current phase; Phase 5 has not started.

## Delivered

Prisma 7.10.0 client/CLI and PostgreSQL adapter; nine relational models; initial migration 20260919000000_initial_public_content; transactional idempotent seed copied from Phase 3 public content; shared NestJS database lifecycle; explicit API mappers; published-only queries and ordered relations; fail-closed local database test runner.

PostgreSQL is the sole runtime source. Obsolete projects.data.ts and profile.data.ts were removed only after database, live HTTP, frontend tests and SSR/prerender validation. Bootstrap content remains in prisma/seed-data. Frontend code and public copy were preserved.

See [architecture](ARCHITECTURE.md) for design and [backend README](../backend/README.md) for reproducible setup and exact commands.

## Validation

- Local development database cyber_portfolio: initial migration applied; migration status up to date; seed succeeded.
- Local test database cyber_portfolio_test: migration applied; 9 database-backed HTTP/integrity tests passed, including seed idempotency and live database changes.
- Prisma generation, NestJS build, seed/e2e TypeScript checks passed.
- Live HTTP comparison against original Phase 3 data passed: health, list, all four project details, profile, unknown slug 404, malformed slug 400.
- Angular: 10 tests passed; production browser/server build succeeded with database/API running; 8 static routes prerendered, including all four project details.
- Full and production-only npm audits: 4 high findings in Prisma dependency graph; no forced fix. See backend README.
- Final git diff --check passed. Configured database credentials were absent from tracked/nonignored files; generated artifacts and backend/.env are ignored.

## Warnings and review

Prisma latest tag points to 8.0.0-rc.15; stable 7.10.0 was retained. Prisma/engines and existing parcel/watcher/unrs-resolver install-script approval warnings were reported. ts-node seed runner emits Node DEP0180 (fs.Stats); Jest emits experimental VM Modules warning. Some commands needed sandbox escalation for child-process spawning; subsequent executions succeeded. Git may report LF/CRLF conversion warnings on Windows.

Review upstream Prisma dependency fixes before deployment. Public portfolio roadmap copy intentionally retains Phase 3 wording to preserve the requested content contract; updating claims is separate editorial work.

No authentication, Docker, CI/CD or later phases were started. No commits or pushes. Credentials remain local in ignored backend/.env.
