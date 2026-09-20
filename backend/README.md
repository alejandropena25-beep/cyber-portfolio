# Cyber Portfolio - Backend

NestJS 12, Prisma 7.10.0 and PostgreSQL 18, with session authentication and a protected administration API. Phase 6 adds a production-oriented runtime image and a separate operational-tooling target.

## Native development

For host development, PostgreSQL 18 must be running locally. Copy `.env.example` to `.env`, replace placeholders, and keep separate least-privilege roles/databases for development and tests. Never use the PostgreSQL superuser as the application role or commit credentials.

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

`npm run admin:create` prompts for an email and a masked password, requires at least 12 characters, stores only an Argon2id hash and revokes earlier sessions for that account. It is restricted to the expected local database unless the explicit Docker operation mode is active.

Tests require `TEST_DATABASE_URL`, apply migrations and seed their dedicated test database, restore temporary mutations, and never fall back to the development database.

## Docker image

`backend/Dockerfile` uses these stages:

- `dependencies`: reproducible complete install with `npm ci`.
- `build`: generates Prisma Client for Linux and compiles NestJS.
- `production-dependencies`: installs runtime-only dependencies.
- `runtime`: contains only production dependencies and `dist`, and runs as `node`.
- `tools`: retains Prisma/TypeScript tooling for migration, seed and interactive admin creation.

The normal application image does not contain the Prisma CLI, test fixtures, TypeScript source, local `.env` or host `node_modules`.

At the repository root:

```powershell
Copy-Item .env.docker.example .env.docker
docker compose --env-file .env.docker up --build
docker compose --env-file .env.docker --profile tools run --rm admin-create
```

The container database URL must use host `database`, never `localhost`. PostgreSQL is reachable only on Compose's internal `data` network.

## Migration and seed lifecycle

The `migrate` one-shot service runs `prisma migrate deploy` after PostgreSQL is healthy. No container runs `migrate dev`, reset or destructive recreation. The backend cannot start if migration fails.

The `seed` service then invokes the existing deterministic seed with `SEED_IF_EMPTY=true`. It initializes a fresh database, skips an already populated database and fails on a partial state. This preserves edits across restarts instead of resetting them. It never creates an administrator, session or credential.

## Authentication and local Docker

Docker publishes the API at `http://localhost:3000/api` and accepts only the exact configured `FRONTEND_ORIGIN`. Local HTTP uses the explicit `SESSION_COOKIE_SECURE=false` setting; production mode still forces secure cookies. HttpOnly session cookies, SameSite, Origin validation, CSRF cookie/header verification and server-side admin guards remain enabled.

## Health and shutdown

The backend healthcheck calls `GET /api/health` using Node's built-in `fetch`. The image runs as non-root; Compose adds a read-only root filesystem, `/tmp` tmpfs, `no-new-privileges`, dropped capabilities and an init process. Nest shutdown hooks close Prisma on SIGTERM.

## API

Public routes are `GET /api/health`, `/api/projects`, `/api/projects/:slug` and `/api/profile`. Auth routes are `/api/auth/login`, `/api/auth/logout` and `/api/auth/me`. Protected `/api/admin/*` routes manage projects and profile data.

## Audits

Run both dependency views without forcing changes:

```powershell
npm audit
npm audit --omit=dev
```

Do not use `npm audit fix --force`. Prisma CLI/peer-graph advisories must be assessed against compatible upstream releases rather than hidden by an unverified downgrade.
