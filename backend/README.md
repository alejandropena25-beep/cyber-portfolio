# Cyber Portfolio - Backend

Phase 5: NestJS -> Prisma 7.10.0 -> PostgreSQL, with session authentication and protected administration. The Phase 4 public API contract remains unchanged.

## Local database prerequisite (Windows)

PostgreSQL 18 is installed and running. Connect using your local administrator password entered interactively:

```powershell
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -X -h localhost -U postgres -d postgres
```

Check existing databases/roles with `\l` and `\du`. For a fresh setup, execute the following in psql; do not recreate/reset existing databases:

```sql
CREATE ROLE portfolio_dev LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE;
\password portfolio_dev
CREATE ROLE portfolio_test LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE;
\password portfolio_test
CREATE DATABASE cyber_portfolio OWNER portfolio_dev;
CREATE DATABASE cyber_portfolio_test OWNER portfolio_test;
REVOKE CONNECT ON DATABASE cyber_portfolio FROM PUBLIC;
REVOKE CONNECT ON DATABASE cyber_portfolio_test FROM PUBLIC;
```

Use separate local credentials. Each role owns only its database; migrations need DDL privileges. Do not use postgres superuser for the application. Production roles are a later decision.

From backend/, copy .env.example to .env and replace placeholders locally. Never paste credentials into chat or commit them. Percent-encode special characters in URL credentials. Node 24 loads .env using its built-in loader; existing process environment takes precedence.

- DATABASE_URL: local cyber_portfolio connection.
- TEST_DATABASE_URL: local cyber_portfolio_test, separate credentials, only optional schema=public query parameter.
- PORT: optional API port, default 3000.
- FRONTEND_ORIGIN: exact allowed browser origin; defaults to `http://localhost:4200`.
- SESSION_COOKIE_SECURE: use `false` only for localhost HTTP; production forces Secure cookies.
- SESSION_TTL_HOURS: positive session lifetime, default 8.

## Bootstrap and startup order

With PostgreSQL running, from backend/:

```powershell
npm ci
npm run prisma:generate
npm run db:migrate
npm run db:status
npm run db:seed
npm run admin:create
npm run build
npm test
npm run start:dev
```

Migrations use prisma migrate deploy: no reset or shadow database. The initial SQL was generated from the schema without a database connection.

Seed execution is restricted to local cyber_portfolio or cyber_portfolio_test. It upserts confirmed projects/profile and replaces their children in one transaction. Rerunning restores bootstrap content and publication flags for those records; it is not an ongoing editing tool. Unrelated projects and unused technologies remain. Child numeric IDs may change; they are private.

Start Angular from frontend/ with npm start. Browser requests use the development proxy; SSR uses http://127.0.0.1:3000/api.

`npm run admin:create` is intentionally interactive and restricted to local `cyber_portfolio`. It prompts for an email and masked password, creates or updates the administrator with Argon2id, and revokes that account's existing sessions. Never add administrator credentials to seeds, environment examples or source files.

## Authentication and administration

Login creates independent random 256-bit session and CSRF tokens. Only SHA-256 digests are stored in `AdminSession`. The raw session token is sent solely in an HttpOnly, SameSite=Strict cookie scoped to `/api`; it is Secure in production. Logout deletes the session, and expired or disabled-user sessions cannot authenticate.

Unsafe requests require the exact configured Origin. Authenticated mutations also require the readable `XSRF-TOKEN` cookie to match `X-XSRF-TOKEN` and the digest tied to the session. Login is limited to five requests per minute with the Nest throttler. This limiter uses process memory and the observed request IP; a later reverse-proxy/multi-instance deployment must configure trusted proxy handling and shared limiter storage.

All `/api/admin/*` routes use the server-side session guard. Project and profile aggregate writes use Prisma transactions. The Angular guard is only a navigation convenience.

Auth routes are `/api/auth/login`, `/api/auth/logout` and `/api/auth/me`. Admin routes cover project list/detail/create/update and profile read/update. There is no registration, password-reset, OAuth or hard-delete endpoint.

## Validation

npm test refuses to run without the explicit local test URL, never falls back to development, applies migrations and seeds the test database. No reset/truncate is used. Tests restore temporary content mutations and leave bootstrap records seeded. Reserve this database exclusively for tests. Coverage compares all Phase 3 fields, verifies malformed/unknown/unpublished slugs, live database changes and ordering, relation uniqueness and seed idempotency.

Keep PostgreSQL and the database-backed API running, then from frontend/:

```powershell
npm test -- --watch=false
npm run build
```

Verify all four prerendered project routes. Do not disable prerender to work around missing database access.

## Prisma and audit

Prisma 7.10.0 was the newest stable Prisma 7 release returned by npm; latest pointed to an 8.0.0 release candidate. Uses prisma-client with explicit output, CommonJS matching NestJS, prisma.config.ts and @prisma/adapter-pg. The adapter supplies the PostgreSQL driver dependency. No additional ORM or dotenv package.

Both full and production-only npm audits reported 4 high findings: prisma, @prisma/config, deepmerge-ts and mysql2. Underlying advisories concern recursive merge exhaustion and MySQL authentication/compression. These originate in Prisma CLI dependencies, also retained by its peer graph in the production audit. CLI origin does not mean a clean production audit. npm suggested downgrade to 6.19.3; no forced fix or unverified major override was applied. Review upstream fixes before deployment.

Install warned about unapproved scripts for Prisma/engines and existing parcel/watcher and unrs-resolver. Generation/build succeeded despite these warnings. See the phase document for actual validation status.
